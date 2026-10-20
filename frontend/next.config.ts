import type { NextConfig } from "next";

// On Vercel, fail the build loudly instead of deploying a site whose /api or login is broken.
if (process.env.VERCEL) {
  for (const name of ["BACKEND_URL", "JWT_SECRET"]) {
    if (!process.env[name]) throw new Error(`Missing ${name}: set it in the Vercel project's Environment Variables.`);
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The browser only talks to this app's /api. The auth cookie stays first-party,
  // so proxy.ts can read it and there are no cross-site cookie problems.
  async rewrites() {
    // Default avoids :5000, which macOS uses for the AirPlay Receiver.
    const backend = process.env.BACKEND_URL || "http://localhost:5050";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
