import type { Role } from "@/types";

// One-click sign-in accounts, created by backend/prisma/seed.ts so reviewers can try both roles.
export const QUICK_ACCOUNTS: { role: Role; name: string; email: string; password: string }[] = [
  { role: "MENTOR", name: "Tanvir Ahmed", email: "tanvir.ahmed@submitdesk.dev", password: "SubmitDesk@2026" },
  { role: "STUDENT", name: "Nadia Islam", email: "nadia.islam@submitdesk.dev", password: "SubmitDesk@2026" },
];
