import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const encoder = new TextEncoder();

/** HMAC-SHA256 hex, same as the backend's signClientIp (lib/client-ip.ts). */
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * /api is rewritten to the Express backend (next.config.ts). Behind that hop the backend
 * only sees this server's IP, so forward the visitor's IP, signed, for per-visitor rate limits.
 */
async function forwardClientIp(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.delete("x-client-ip"); // never pass through a value sent by the browser
  headers.delete("x-client-ip-signature");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
  if (ip && process.env.JWT_SECRET) {
    headers.set("x-client-ip", ip);
    headers.set("x-client-ip-signature", await sign(ip, process.env.JWT_SECRET));
  }
  return NextResponse.next({ request: { headers } });
}

/**
 * Route protection. This is only UX: the real security is the backend's
 * authenticate + authorize middleware. Hiding a page is not access control.
 */
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) return forwardClientIp(req);

  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  let role: string | null = null;
  if (token && process.env.JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      role = typeof payload.role === "string" ? payload.role : null;
    } catch {
      role = null; // expired or tampered token → treat as logged out
    }
  }

  const home = role === "MENTOR" ? "/mentor" : "/student";
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));

  if (!role) {
    if (isAuthPage || pathname === "/") return NextResponse.next(); // "/" is the public landing page
    const res = to("/login");
    if (token) res.cookies.delete("token"); // clear a stale cookie
    return res;
  }

  if (isAuthPage || pathname === "/") return to(home);
  if (pathname.startsWith("/mentor") && role !== "MENTOR") return to("/student");
  if (pathname.startsWith("/student") && role !== "STUDENT") return to("/mentor");

  return NextResponse.next();
}

// /api always runs it (to forward the visitor IP). Router prefetches of pages skip the proxy (a redirected prefetch just 404s in the background).
// Real navigations always run it, and page shells hold no data: that comes from the protected API.
// Matcher values must be static literals, so the `missing` list is repeated.
export const config = {
  matcher: [
    "/api/:path*",
    {
      source: "/",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    {
      source: "/student/:path*",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    {
      source: "/mentor/:path*",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    {
      source: "/login",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    {
      source: "/signup",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
