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
  it("approves with a mark and no feedback", async () => {
    const { mentor, ids } = await setup();
    const res = await api()
      .patch(`/api/mentor/submissions/${ids[0]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "APPROVED", mark: 92 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("APPROVED");
    expect(res.body.data.feedbacks).toHaveLength(1);
    expect(res.body.data.feedbacks[0].mark).toBe(92);
    expect(res.body.data.feedbacks[0].comment).toBeNull();
  });

  it("rejects with a mark; feedback is optional", async () => {
    const { mentor, ids } = await setup();
    const res = await api()
      .patch(`/api/mentor/submissions/${ids[0]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "REJECTED", mark: 40 });

    expect(res.status).toBe(200);
    expect(res.body.data.feedbacks[0]).toMatchObject({ decision: "REJECTED", mark: 40 });
  });

  it.each([
    ["below 0", { mark: -1 }],
    ["above 100", { mark: 101 }],
    ["not a whole number", { mark: 72.5 }],
    ["a string", { mark: "90" }],
  ])("a mark must be a whole number 0–100: %s → 400", async (_, extra) => {
    const { mentor, ids } = await setup();
    const res = await api()
      .patch(`/api/mentor/submissions/${ids[0]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "APPROVED", ...extra });

    expect(res.status).toBe(400);
    expect(res.body.errors.mark).toBeDefined();
  });

  it("students see their mark and feedback", async () => {
    const { mentor, student, ids } = await setup();
    await api()
      .patch(`/api/mentor/submissions/${ids[0]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "APPROVED", mark: 0, comment: "Well done overall." });

    const res = await api().get("/api/submissions/me").set(bearer(student.token));
    const reviewed = res.body.data.find((s: { id: string }) => s.id === ids[0]);
    expect(reviewed.feedbacks[0]).toMatchObject({ mark: 0, comment: "Well done overall." });
  });

  it("a submission can only be reviewed once (409)", async () => {
    const { mentor, ids } = await setup();
    const url = `/api/mentor/submissions/${ids[0]}/review`;
    await api().patch(url).set(bearer(mentor.token)).send({ decision: "APPROVED", mark: 80 });

    const res = await api().patch(url).set(bearer(mentor.token)).send({ decision: "REJECTED", mark: 80, comment: "Changed my mind" });
    expect(res.status).toBe(409);
  });

  it("two mentors reviewing at the same time: one wins, the other gets 409", async () => {
    const { ids } = await setup();
    const m1 = await createMentor("m1@example.com");
    const m2 = await createMentor("m2@example.com");
    const url = `/api/mentor/submissions/${ids[0]}/review`;

    const results = await Promise.all([
      api().patch(url).set(bearer(m1.token)).send({ decision: "APPROVED", mark: 80 }),
      api().patch(url).set(bearer(m2.token)).send({ decision: "REJECTED", mark: 80, comment: "Live site is broken." }),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.feedback.count()).toBe(1); // no second, overwriting review
  });

  it("404 for an unknown submission", async () => {
    const { mentor } = await setup(0);
    const res = await api()
      .patch("/api/mentor/submissions/does-not-exist/review")
      .set(bearer(mentor.token))
      .send({ decision: "APPROVED", mark: 80 });
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
      .send({ decision: "REJECTED", mark: 80, comment: "README is missing setup steps." });
    await api()
      .patch(`/api/submissions/${ids[0]}`)
      .set(bearer(student.token))
      .send({ ...validSubmission("student/project-0"), description: "Added a README with setup steps." });
    await api().patch(`${url}/review`).set(bearer(mentor.token)).send({ decision: "APPROVED", mark: 80, comment: "Great now!" });

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
      await api().patch(`/api/mentor/submissions/${id}/review`).set(bearer(mentor.token)).send({ decision: "APPROVED", mark: 80 });
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
    await api().patch(`/api/mentor/submissions/${ids[0]}/review`).set(bearer(mentor.token)).send({ decision: "APPROVED", mark: 80 });
    await api()
      .patch(`/api/mentor/submissions/${ids[1]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "REJECTED", mark: 80, comment: "Needs a README file." });

    const res = await api().get("/api/mentor/stats").set(bearer(mentor.token));
    expect(res.body.data).toEqual({ total: 4, PENDING: 2, APPROVED: 1, REJECTED: 1 });
  });
});

describe("grade (step 2: mark and feedback after the decision)", () => {
  const review = (token: string, id: string, body: object) =>
    api().patch(`/api/mentor/submissions/${id}/review`).set(bearer(token)).send(body);
  const grade = (token: string, id: string, body: object) =>
    api().patch(`/api/mentor/submissions/${id}/grade`).set(bearer(token)).send(body);

  it("approve first, then add the mark and feedback", async () => {
    const { mentor, student, ids } = await setup();
    const approved = await review(mentor.token, ids[0], { decision: "APPROVED" });
    expect(approved.status).toBe(200);
    expect(approved.body.data.feedbacks[0].mark).toBeNull();

    const res = await grade(mentor.token, ids[0], { mark: 88, comment: "Clean code and a clear README." });
    expect(res.status).toBe(200);
    expect(res.body.data.feedbacks[0]).toMatchObject({ mark: 88, comment: "Clean code and a clear README." });
    expect(await prisma.feedback.count()).toBe(1); // updates the review, doesn't add one

    const mine = await api().get("/api/submissions/me").set(bearer(student.token));
    expect(mine.body.data.find((s: { id: string }) => s.id === ids[0]).feedbacks[0].mark).toBe(88);
  });

  it("can change the mark later, and an empty comment clears the feedback", async () => {
    const { mentor, ids } = await setup();
    await review(mentor.token, ids[0], { decision: "REJECTED", mark: 40, comment: "Broken on mobile." });
    const res = await grade(mentor.token, ids[0], { mark: 55, comment: "" });
    expect(res.status).toBe(200);
    expect(res.body.data.feedbacks[0]).toMatchObject({ mark: 55, comment: null });
  });

  it("a pending submission can't be graded (409)", async () => {
    const { mentor, ids } = await setup();
    expect((await grade(mentor.token, ids[0], { mark: 90 })).status).toBe(409);
  });

  it("the mark is required and must be 0–100 (400)", async () => {
    const { mentor, ids } = await setup();
    await review(mentor.token, ids[0], { decision: "APPROVED" });
    expect((await grade(mentor.token, ids[0], {})).status).toBe(400);
    expect((await grade(mentor.token, ids[0], { mark: 150 })).status).toBe(400);
  });

  it("students can't grade (403), unknown id is 404", async () => {
    const { mentor, student, ids } = await setup();
    await review(mentor.token, ids[0], { decision: "APPROVED" });
    expect((await grade(student.token, ids[0], { mark: 100 })).status).toBe(403);
    expect((await grade(mentor.token, "nope", { mark: 100 })).status).toBe(404);
  });
});

describe("students (mentor)", () => {
  it("lists students with counts and the average of their current marks", async () => {
    const { mentor, student, ids } = await setup(3);
    await createStudent("zoe@example.com"); // no submissions
    const review = (id: string, body: object) =>
      api().patch(`/api/mentor/submissions/${id}/review`).set(bearer(mentor.token)).send(body);
    await review(ids[0], { decision: "APPROVED", mark: 90 });
    await review(ids[1], { decision: "REJECTED", mark: 41 });

    const res = await api().get("/api/mentor/students").set(bearer(mentor.token));
    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ total: 2, page: 1 });
    const row = res.body.data.find((s: { id: string }) => s.id === student.user.id);
    expect(row).toMatchObject({
      counts: { total: 3, PENDING: 1, APPROVED: 1, REJECTED: 1 },
      averageMark: 65.5,
      markedCount: 2,
    });
    expect(row.passwordHash).toBeUndefined();
    const zoe = res.body.data.find((s: { email: string }) => s.email === "zoe@example.com");
    expect(zoe).toMatchObject({ counts: { total: 0 }, averageMark: null });
  });

  it("searches by name or email and never lists mentors", async () => {
    const { mentor } = await setup(0);
    await createStudent("zoe@example.com");
    const search = (q: string) => api().get(`/api/mentor/students?search=${q}`).set(bearer(mentor.token));

    expect((await search("ZOE")).body.data.map((s: { email: string }) => s.email)).toEqual(["zoe@example.com"]);
    expect((await search("mentor")).body.data).toHaveLength(0);
  });

  it("shows one student with all submissions; mentors and unknown ids are 404", async () => {
    const { mentor, student, ids } = await setup(2);
    await api()
      .patch(`/api/mentor/submissions/${ids[0]}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "APPROVED", mark: 77, comment: "Nice." });

    const res = await api().get(`/api/mentor/students/${student.user.id}`).set(bearer(mentor.token));
    expect(res.status).toBe(200);
    expect(res.body.data.submissions).toHaveLength(2);
    expect(res.body.data).toMatchObject({ averageMark: 77, counts: { total: 2, APPROVED: 1, PENDING: 1 } });

    const mentorRow = await prisma.user.findFirst({ where: { role: "MENTOR" } });
    expect((await api().get(`/api/mentor/students/${mentorRow!.id}`).set(bearer(mentor.token))).status).toBe(404);
    expect((await api().get("/api/mentor/students/nope").set(bearer(mentor.token))).status).toBe(404);
  });

  it("students can't use it (403)", async () => {
    const { student } = await setup(0);
    expect((await api().get("/api/mentor/students").set(bearer(student.token))).status).toBe(403);
  });
});
