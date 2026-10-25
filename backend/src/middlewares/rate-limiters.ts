import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";
import { clientIp } from "../lib/client-ip.js";

const json = (message: string) => ({ success: false, message });

// Per-visitor key (see lib/client-ip.ts). ipKeyGenerator groups IPv6 addresses by /56 subnet.
const byIp = (req: Parameters<typeof clientIp>[0]) => ipKeyGenerator(clientIp(req));

// Default store is in-memory: resets on restart and is not shared between instances.
// In production with several servers, use a Redis store instead.
export const globalLimiter = rateLimit({
  keyGenerator: byIp,
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: json("Too many requests, slow down"),
});

// Login: only FAILED attempts count (wrong password, unknown email). This still stops password
// guessing, but normal logins (including the one-click sign-in buttons) never lock anyone out.
export const loginLimiter = rateLimit({
  keyGenerator: byIp,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: json("Too many failed login attempts, try again in 15 minutes"),
});

// Signup: every attempt counts, so one IP can't mass-create accounts.
export const signupLimiter = rateLimit({
  keyGenerator: byIp,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: json("Too many sign-up attempts, try again in 15 minutes"),
});

// Must run AFTER authenticate so req.user exists → limit is per student, not per IP.
// Only successful submissions count, so a typo or a 409 doesn't eat the student's quota.
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  skipFailedRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  skip: () => env.NODE_ENV === "test",
  message: json("You can submit at most 5 projects per hour"),
});
