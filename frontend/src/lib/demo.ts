import type { Role } from "@/types";

// Public demo accounts, created by backend/prisma/seed.ts. Safe to ship: they exist only for demos.
export const DEMO_ACCOUNTS: { role: Role; label: string; email: string; password: string }[] = [
  { role: "MENTOR", label: "Mentor", email: "mentor.demo@submitdesk.dev", password: "Demo@12345" },
  { role: "STUDENT", label: "Student", email: "student.demo@submitdesk.dev", password: "Demo@12345" },
];
