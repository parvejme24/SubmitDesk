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

export const reviewSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("APPROVED"),
    comment: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((s) => s || undefined),
  }),
  z.object({
    decision: z.literal("REJECTED"),
    comment: z
      .string({ error: "Please explain why the project is rejected" })
      .trim()
      .min(10, "Please explain why (at least 10 characters)")
      .max(500),
  }),
]);

export type ListQuery = z.infer<typeof listQuerySchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
