import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection. This is only UX: the real security is the backend's
 * authenticate + authorize middleware. Hiding a page is not access control.
 */
export async function proxy(req: NextRequest) {
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
    if (isAuthPage) return NextResponse.next();
    const res = to("/login");
    if (token) res.cookies.delete("token"); // clear a stale cookie
    return res;
  }

  if (isAuthPage || pathname === "/") return to(home);
  if (pathname.startsWith("/mentor") && role !== "MENTOR") return to("/student");
  if (pathname.startsWith("/student") && role !== "STUDENT") return to("/mentor");

  return NextResponse.next();
}

// Router prefetches skip the proxy (a redirected prefetch just 404s in the background).
// Real navigations always run it, and page shells hold no data: that comes from the protected API.
// Matcher values must be static literals, so the `missing` list is repeated.
export const config = {
  matcher: [
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
