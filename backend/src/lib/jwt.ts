import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type Role = "STUDENT" | "MENTOR";
export type JwtPayload = { sub: string; role: Role };

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
