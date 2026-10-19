import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";

if (!/test/i.test(new URL(process.env.DATABASE_URL!).pathname)) {
  throw new Error("Refusing to run tests against a non-test database");
}

// Every test starts from an empty database.
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "feedbacks", "submissions", "users" CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});
