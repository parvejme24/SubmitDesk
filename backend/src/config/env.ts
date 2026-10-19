import "dotenv/config";
import { z } from "zod";

// Treat blank values in .env (e.g. `PORT=`) as "not set" so defaults apply.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema);

const envSchema = z.object({
  PORT: optional(z.coerce.number().int().positive().default(5050)), // not 5000: macOS AirPlay uses it
  NODE_ENV: optional(z.enum(["development", "production", "test"]).default("development")),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: optional(z.string().default("1d")),
  CLIENT_URL: z.url("CLIENT_URL must be a valid URL"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
