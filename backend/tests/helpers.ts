import bcrypt from "bcryptjs";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const api = () => request(app);

export const validSubmission = (repo = "student/todo-app") => ({
  projectName: "Todo App",
  repoUrl: `https://github.com/${repo}`,
  liveUrl: "https://todo-app.vercel.app",
  description: "A todo app built with React, with filters and local storage.",
});

/** Signs up a student through the API and returns its bearer token. */
export async function createStudent(email = "student@example.com") {
  const res = await api().post("/api/auth/signup").send({ name: "Test Student", email, password: "Password1" });
  return { token: res.body.data.token as string, user: res.body.data.user as { id: string } };
}

/** Mentors can't sign up, so they are created directly in the database. */
export async function createMentor(email = "mentor@example.com") {
  await prisma.user.create({
    data: { name: "Test Mentor", email, passwordHash: await bcrypt.hash("Mentor@12345", 4), role: "MENTOR" },
  });
  const res = await api().post("/api/auth/login").send({ email, password: "Mentor@12345" });
  return { token: res.body.data.token as string };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
