import { z } from "zod";

// Mirrors backend/src/modules/reviews/review.schema.ts. The mark input is text, so it's
// checked as a string first and then turned into a number for the API.
const markNumber = z.coerce
  .number<string>({ error: "Enter a number" })
  .int("Use a whole number")
  .min(0, "The mark can't be below 0")
  .max(100, "The mark can't be above 100");

const comment = z.string().trim().max(500, "Keep feedback under 500 characters").optional();

// Step 1: approve or reject. Mark and feedback are optional here and can be added later.
export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  mark: z
    .string()
    .trim()
    .transform((s) => s || undefined)
    .pipe(markNumber.optional()),
  comment,
});

// Step 2: add or change the mark (required) and feedback of a reviewed submission.
export const gradeSchema = z.object({
  mark: z.string().trim().min(1, "Give a mark from 0 to 100").pipe(markNumber),
  comment,
});

export type ReviewInput = z.input<typeof reviewSchema>;
export type ReviewValues = z.output<typeof reviewSchema>;
export type GradeInput = z.input<typeof gradeSchema>;
export type GradeValues = z.output<typeof gradeSchema>;
