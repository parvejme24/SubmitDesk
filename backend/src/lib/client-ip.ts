import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { env } from "../config/env.js";

/**
 * The frontend proxies /api to this server. On Vercel the incoming IP is then the
 * frontend's server, not the visitor (Vercel overwrites X-Forwarded-For), so all users
 * would share one rate-limit bucket. The frontend therefore forwards the visitor's IP
 * in these headers, signed with the shared JWT_SECRET so it can't be faked.
 */
export const CLIENT_IP_HEADER = "x-client-ip";
export const CLIENT_IP_SIGNATURE_HEADER = "x-client-ip-signature";

export const signClientIp = (ip: string, secret = env.JWT_SECRET) =>
  createHmac("sha256", secret).update(ip).digest("hex");

/** The visitor's IP: the signed forwarded one if valid, otherwise the connection IP. */
export function clientIp(req: Request): string {
  const ip = req.get(CLIENT_IP_HEADER);
  const signature = req.get(CLIENT_IP_SIGNATURE_HEADER);

  if (ip && signature) {
    const expected = Buffer.from(signClientIp(ip));
    const given = Buffer.from(signature);
    if (given.length === expected.length && timingSafeEqual(given, expected)) return ip;
  }
  return req.ip ?? "unknown";
}
