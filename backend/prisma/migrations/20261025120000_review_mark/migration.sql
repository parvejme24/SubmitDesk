-- AlterTable: a mark out of 100 on each review (null for reviews made before marks existed)
ALTER TABLE "feedbacks" ADD COLUMN "mark" INTEGER;

-- Prisma can't express range checks, so the 0–100 rule is also enforced by the database
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_mark_range" CHECK ("mark" IS NULL OR "mark" BETWEEN 0 AND 100);
