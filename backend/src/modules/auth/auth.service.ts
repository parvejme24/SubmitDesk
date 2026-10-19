import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/jwt.js";
import { AppError } from "../../utils/app-error.js";
import type { LoginInput, SignupInput } from "./auth.schema.js";

// Never return passwordHash.
const publicUser = { id: true, name: true, email: true, role: true, createdAt: true } as const;

export async function signup(input: SignupInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw new AppError(409, "Email already registered", { email: ["Email already registered"] });

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: "STUDENT" },
    select: publicUser,
  });

  return { user, token: signToken({ sub: user.id, role: user.role }) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same message for unknown email and wrong password: don't reveal which one.
  const ok = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !ok) throw new AppError(401, "Invalid email or password");

  const { passwordHash: _omit, updatedAt: _u, ...safe } = user;
  return { user: safe, token: signToken({ sub: user.id, role: user.role }) };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) throw new AppError(401, "Account no longer exists");
  return user;
}
