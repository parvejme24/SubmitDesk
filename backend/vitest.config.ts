import { userInfo } from "node:os";
import { defineConfig } from "vitest/config";

// Tests always use a separate local database (never the one in .env).
// Override with TEST_DATABASE_URL if your local Postgres needs credentials.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? `postgresql://${userInfo().username}@localhost:5432/submitdesk_test`;

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false, // all files share one database
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test", // also turns the rate limiters off
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
      JWT_EXPIRES_IN: "1h",
      CLIENT_URL: "http://localhost:3000",
    },
  },
});
