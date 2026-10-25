import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).default("ALL"),
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((s) => s || undefined),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

const mark = z
  .number({ error: "Give a mark from 0 to 100" })
  .int("The mark must be a whole number")
  .min(0, "The mark can't be below 0")
  .max(100, "The mark can't be above 100");

const comment = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((s) => s || undefined);

// Step 1: approve or reject. The mark and feedback can come now or later (step 2, /grade).
export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  mark: mark.optional(),
  comment,
});

// Step 2: add or change the mark (out of 100) and feedback of a reviewed submission.
// An empty comment clears the feedback.
export const gradeSchema = z.object({ mark, comment });

export type ListQuery = z.infer<typeof listQuerySchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
