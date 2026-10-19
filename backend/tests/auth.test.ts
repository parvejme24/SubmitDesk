import { describe, expect, it } from "vitest";
import { api, bearer, createStudent } from "./helpers.js";

describe("auth", () => {
  it("signup always creates a STUDENT, even if a role is sent", async () => {
    const res = await api()
      .post("/api/auth/signup")
      .send({ name: "Sneaky", email: "sneaky@example.com", password: "Password1", role: "MENTOR" });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("STUDENT");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/token=.*HttpOnly/);
  });

  it("rejects weak passwords with field errors", async () => {
    const res = await api().post("/api/auth/signup").send({ name: "A", email: "bad", password: "weak" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(expect.arrayContaining(["name", "email", "password"]));
  });

  it("rejects a duplicate email (case-insensitive) with 409", async () => {
    await createStudent("dup@example.com");
    const res = await api().post("/api/auth/signup").send({ name: "Dup", email: "DUP@example.com", password: "Password1" });
    expect(res.status).toBe(409);
    expect(res.body.errors.email).toBeDefined();
  });

  it("uses the same message for unknown email and wrong password", async () => {
    await createStudent("known@example.com");
    const wrongPassword = await api().post("/api/auth/login").send({ email: "known@example.com", password: "Nope1234" });
    const unknownEmail = await api().post("/api/auth/login").send({ email: "nobody@example.com", password: "Nope1234" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("GET /me needs a valid token", async () => {
    const { token } = await createStudent();
    expect((await api().get("/api/auth/me")).status).toBe(401);
    expect((await api().get("/api/auth/me").set(bearer("not.a.token"))).status).toBe(401);

    const res = await api().get("/api/auth/me").set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("student@example.com");
  });
});
