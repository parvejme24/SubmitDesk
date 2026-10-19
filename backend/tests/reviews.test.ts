import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, bearer, createMentor, createStudent, validSubmission } from "./helpers.js";

async function setup(count = 1) {
  const student = await createStudent();
  const mentor = await createMentor();
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const res = await api()
      .post("/api/submissions")
      .set(bearer(student.token))
      .send({ ...validSubmission(`student/project-${i}`), projectName: `Project ${i}` });
    ids.push(res.body.data.id);
  }
  return { student, mentor, ids };
}

describe("RBAC on mentor routes", () => {
  it("401 without a token, 403 for a student", async () => {
    const { student } = await setup(0);
    expect((await api().get("/api/mentor/stats")).status).toBe(401);
    expect((await api().get("/api/mentor/stats").set(bearer(student.token))).status).toBe(403);
    expect((await api().get("/api/mentor/submissions").set(bearer(student.token))).status).toBe(403);
  });
});

describe("review", () => {
  it("approves with optional feedback", async () => {
    const { mentor, ids } = await setup();
    const res = await api()
      .patch(`/api/mentor/submissions/${ids[0]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "APPROVED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("APPROVED");
    expect(res.body.data.feedbacks).toHaveLength(1);
  });

  it("rejecting requires a comment of at least 10 characters", async () => {
    const { mentor, ids } = await setup();
    const url = `/api/mentor/submissions/${ids[0]}/review`;

    expect((await api().patch(url).set(bearer(mentor.token)).send({ decision: "REJECTED" })).status).toBe(400);
    expect(
      (await api().patch(url).set(bearer(mentor.token)).send({ decision: "REJECTED", comment: "bad" })).status,
    ).toBe(400);
  });

  it("a submission can only be reviewed once (409)", async () => {
    const { mentor, ids } = await setup();
    const url = `/api/mentor/submissions/${ids[0]}/review`;
    await api().patch(url).set(bearer(mentor.token)).send({ decision: "APPROVED" });

    const res = await api().patch(url).set(bearer(mentor.token)).send({ decision: "REJECTED", comment: "Changed my mind" });
    expect(res.status).toBe(409);
  });

  it("two mentors reviewing at the same time: one wins, the other gets 409", async () => {
    const { ids } = await setup();
    const m1 = await createMentor("m1@example.com");
    const m2 = await createMentor("m2@example.com");
    const url = `/api/mentor/submissions/${ids[0]}/review`;

    const results = await Promise.all([
      api().patch(url).set(bearer(m1.token)).send({ decision: "APPROVED" }),
      api().patch(url).set(bearer(m2.token)).send({ decision: "REJECTED", comment: "Live site is broken." }),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.feedback.count()).toBe(1); // no second, overwriting review
  });

  it("404 for an unknown submission", async () => {
    const { mentor } = await setup(0);
    const res = await api()
      .patch("/api/mentor/submissions/does-not-exist/review")
      .set(bearer(mentor.token))
      .send({ decision: "APPROVED" });
    expect(res.status).toBe(404);
  });
});

describe("submission details", () => {
  it("returns the full submission with its review history, newest first", async () => {
    const { student, mentor, ids } = await setup();
    const url = `/api/mentor/submissions/${ids[0]}`;
    await api()
      .patch(`${url}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "REJECTED", comment: "README is missing setup steps." });
    await api()
      .patch(`/api/submissions/${ids[0]}/resubmit`)
      .set(bearer(student.token))
      .send({ ...validSubmission("student/project-0"), description: "Added a README with setup steps." });
    await api().patch(`${url}/review`).set(bearer(mentor.token)).send({ decision: "APPROVED", comment: "Great now!" });

    const res = await api().get(url).set(bearer(mentor.token));
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe("Added a README with setup steps.");
    expect(res.body.data.student.email).toBe("student@example.com");
    expect(res.body.data.feedbacks.map((f: { decision: string }) => f.decision)).toEqual(["APPROVED", "REJECTED"]);
    expect(res.body.data.feedbacks[0].mentor.name).toBe("Test Mentor");
  });

  it("404 for unknown ids, 403 for students", async () => {
    const { student, mentor, ids } = await setup();
    expect((await api().get("/api/mentor/submissions/nope").set(bearer(mentor.token))).status).toBe(404);
    expect((await api().get(`/api/mentor/submissions/${ids[0]}`).set(bearer(student.token))).status).toBe(403);
  });
});

describe("list, filters, pagination and stats", () => {
  it("filters by status on the server and paginates", async () => {
    const { mentor, ids } = await setup(12);
    for (const id of ids.slice(0, 3)) {
      await api().patch(`/api/mentor/submissions/${id}/review`).set(bearer(mentor.token)).send({ decision: "APPROVED" });
    }

    const page1 = await api().get("/api/mentor/submissions?status=PENDING&limit=5&page=1").set(bearer(mentor.token));
    expect(page1.status).toBe(200);
    expect(page1.body.meta).toEqual({ page: 1, limit: 5, total: 9, totalPages: 2 });
    expect(page1.body.data.every((s: { status: string }) => s.status === "PENDING")).toBe(true);
    expect(page1.body.data[0].student.name).toBe("Test Student"); // joined, no N+1

    const page2 = await api().get("/api/mentor/submissions?status=PENDING&limit=5&page=2").set(bearer(mentor.token));
    expect(page2.body.data).toHaveLength(4);

    const approved = await api().get("/api/mentor/submissions?status=APPROVED").set(bearer(mentor.token));
    expect(approved.body.meta.total).toBe(3);
  });

  it("searches by project name, case-insensitive", async () => {
    const { mentor } = await setup(12);
    const res = await api().get("/api/mentor/submissions?search=project 1").set(bearer(mentor.token));
    // "Project 1", "Project 10", "Project 11"
    expect(res.body.meta.total).toBe(3);
  });

  it("rejects bad query params", async () => {
    const { mentor } = await setup(0);
    const res = await api().get("/api/mentor/submissions?status=FOO&limit=500").set(bearer(mentor.token));
    expect(res.status).toBe(400);
  });

  it("stats count each status", async () => {
    const { mentor, ids } = await setup(4);
    await api().patch(`/api/mentor/submissions/${ids[0]}/review`).set(bearer(mentor.token)).send({ decision: "APPROVED" });
    await api()
      .patch(`/api/mentor/submissions/${ids[1]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "REJECTED", comment: "Needs a README file." });

    const res = await api().get("/api/mentor/stats").set(bearer(mentor.token));
    expect(res.body.data).toEqual({ total: 4, PENDING: 2, APPROVED: 1, REJECTED: 1 });
  });
});
