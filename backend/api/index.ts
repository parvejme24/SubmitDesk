// Vercel serverless entry. vercel.json rewrites every request here; Express routes it by the
// original URL (/api/...). A plain Node function is used instead of Vercel's Express preset,
// because that preset type-checks ESM imports as CommonJS and rejects packages like helmet.
export { default } from "../src/app.js";
