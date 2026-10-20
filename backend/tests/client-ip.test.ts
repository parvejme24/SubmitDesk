import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { CLIENT_IP_HEADER, CLIENT_IP_SIGNATURE_HEADER, clientIp, signClientIp } from "../src/lib/client-ip.js";

const app = express().get("/ip", (req, res) => {
  res.json({ ip: clientIp(req) });
});

describe("clientIp (rate-limit key behind the frontend proxy)", () => {
  it("uses the forwarded IP when it is signed with the shared secret", async () => {
    const res = await request(app)
      .get("/ip")
      .set(CLIENT_IP_HEADER, "203.0.113.7")
      .set(CLIENT_IP_SIGNATURE_HEADER, signClientIp("203.0.113.7"));
    expect(res.body.ip).toBe("203.0.113.7");
  });

  it("ignores a forged IP (bad or missing signature)", async () => {
    const forged = await request(app)
      .get("/ip")
      .set(CLIENT_IP_HEADER, "203.0.113.7")
      .set(CLIENT_IP_SIGNATURE_HEADER, signClientIp("203.0.113.7", "wrong-secret"));
    const unsigned = await request(app).get("/ip").set(CLIENT_IP_HEADER, "203.0.113.7");

    expect(forged.body.ip).not.toBe("203.0.113.7");
    expect(unsigned.body.ip).not.toBe("203.0.113.7");
  });
});
