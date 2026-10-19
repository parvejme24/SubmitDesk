import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, bearer, createMentor, createStudent, validSubmission } from "./helpers.js";

describe("submissions (student)", () => {
  it("creates a PENDING submission", async () => {
    const { token } = await createStudent();
    const res = await api().post("/api/submissions").set(bearer(token)).send(validSubmission());

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.repoUrlKey).toBe("github.com/student/todo-app");
  });

  it("validates URLs and description", async () => {
    const { token } = await createStudent();
    const res = await api()
      .post("/api/submissions")
      .set(bearer(token))
      .send({ projectName: "X", repoUrl: "http://gitlab.com/a/b", liveUrl: "http://x.com", description: "short" });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(
      expect.arrayContaining(["projectName", "repoUrl", "liveUrl", "description"]),
    );
  });

  it.each([
    "https://github.com/student/todo-app.git",
    "https://github.com/student/todo-app/",
    "https://www.GitHub.com/Student/TODO-APP",
  ])("treats %s as a duplicate (409)", async (repoUrl) => {
    const { token } = await createStudent();
    await api().post("/api/submissions").set(bearer(token)).send(validSubmission());

    const res = await api().post("/api/submissions").set(bearer(token)).send({ ...validSubmission(), repoUrl });
    expect(res.status).toBe(409);
    expect(res.body.errors.repoUrl).toBeDefined();
  });

  it("blocks duplicates across different students", async () => {
    const a = await createStudent("a@example.com");
    const b = await createStudent("b@example.com");
    await api().post("/api/submissions").set(bearer(a.token)).send(validSubmission());

    const res = await api().post("/api/submissions").set(bearer(b.token)).send(validSubmission());
    expect(res.status).toBe(409);
  });

  it("the database constraint holds when two identical requests race", async () => {
    const { token } = await createStudent();
    const results = await Promise.all(
      [1, 2].map(() => api().post("/api/submissions").set(bearer(token)).send(validSubmission())),
    );

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.submission.count()).toBe(1);
  });

  it("students only see their own submissions", async () => {
    const a = await createStudent("a@example.com");
    const b = await createStudent("b@example.com");
    await api().post("/api/submissions").set(bearer(a.token)).send(validSubmission("a/one"));
    await api().post("/api/submissions").set(bearer(b.token)).send(validSubmission("b/two"));

    const res = await api().get("/api/submissions/me").set(bearer(a.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].repoUrl).toContain("a/one");
  });

  it("mentors can't use student routes (403)", async () => {
    const { token } = await createMentor();
    const res = await api().post("/api/submissions").set(bearer(token)).send(validSubmission());
    expect(res.status).toBe(403);
  });
});

describe("resubmit", () => {
  async function rejectedSubmission() {
    const student = await createStudent();
    const mentor = await createMentor();
    const created = await api().post("/api/submissions").set(bearer(student.token)).send(validSubmission());
    await api()
      .patch(`/api/mentor/submissions/${created.body.data.id}/review`)
      .set(bearer(mentor.token))
      .send({ decision: "REJECTED", comment: "README is missing setup steps." });
    return { student, id: created.body.data.id as string };
  }

  it("owner can fix a rejected project and it goes back to PENDING", async () => {
    const { student, id } = await rejectedSubmission();
    const res = await api()
      .patch(`/api/submissions/${id}/resubmit`)
      .set(bearer(student.token))
      .send({ ...validSubmission(), description: "Now with a README that explains the setup steps." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.reviewedAt).toBeNull();
  });

  it("another student can't resubmit it (403)", async () => {
    const { id } = await rejectedSubmission();
    const other = await createStudent("other@example.com");
    const res = await api().patch(`/api/submissions/${id}/resubmit`).set(bearer(other.token)).send(validSubmission());
    expect(res.status).toBe(403);
  });

  it("only rejected submissions can be resubmitted (400)", async () => {
    const { token } = await createStudent();
    const created = await api().post("/api/submissions").set(bearer(token)).send(validSubmission());
    const res = await api()
      .patch(`/api/submissions/${created.body.data.id}/resubmit`)
      .set(bearer(token))
      .send(validSubmission());
    expect(res.status).toBe(400);
  });
});
