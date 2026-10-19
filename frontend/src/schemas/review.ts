import { z } from "zod";

// Mirrors backend/src/modules/reviews/review.schema.ts
export const reviewSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVED"), comment: z.string().trim().max(500).optional() }),
  z.object({
    decision: z.literal("REJECTED"),
    comment: z
      .string({ error: "Please explain why the project is rejected" })
      .trim()
      .min(10, "Please explain why (at least 10 characters)")
      .max(500),
  }),
]);

export type ReviewValues = z.infer<typeof reviewSchema>;
