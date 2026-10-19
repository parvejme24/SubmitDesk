import { z } from "zod";

// Mirrors backend/src/modules/submissions/submission.schema.ts
const httpsUrl = z
  .string()
  .trim()
  .min(1, "Required")
  .pipe(z.url("Must be a valid URL"))
  .refine((u) => u.startsWith("https://"), "Must start with https://");

export const DESCRIPTION_MAX = 1000;

export const submissionSchema = z.object({
  projectName: z.string().trim().min(3, "Project name must be at least 3 characters").max(100),
  repoUrl: httpsUrl.refine(
    (u) => /^https:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+?(\.git)?\/?$/i.test(u),
    "Must be a GitHub repository URL like https://github.com/user/repo",
  ),
  liveUrl: httpsUrl,
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`),
});

export type SubmissionValues = z.infer<typeof submissionSchema>;
export const submissionFields = ["projectName", "repoUrl", "liveUrl", "description"] as const;
