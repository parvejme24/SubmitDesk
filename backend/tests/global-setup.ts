import { execSync } from "node:child_process";
import { userInfo } from "node:os";

const url = process.env.TEST_DATABASE_URL ?? `postgresql://${userInfo().username}@localhost:5432/submitdesk_test`;

/** Applies migrations to the test database once before all tests. */
export default function setup() {
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error(`Refusing to run tests: database name must contain "test" (got ${new URL(url).pathname})`);
  }
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url },
  });
}
