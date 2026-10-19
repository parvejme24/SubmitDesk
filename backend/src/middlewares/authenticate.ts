import type { RequestHandler } from "express";
import { verifyToken } from "../lib/jwt.js";
import { AppError } from "../utils/app-error.js";

// AuthN: who are you?
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token: string | undefined = req.cookies?.token ?? bearer;

  if (!token) throw new AppError(401, "Please log in");

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    throw new AppError(401, "Session expired, please log in again");
  }
  next();
};
