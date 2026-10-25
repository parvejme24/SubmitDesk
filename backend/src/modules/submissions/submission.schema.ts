import { z } from "zod";

const httpsUrl = z
  .string()
  .trim()
  .pipe(z.url("Must be a valid URL"))
  .refine((u) => u.startsWith("https://"), "Must start with https://");

export const createSubmissionSchema = z.object({
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
    .max(1000, "Description must be at most 1000 characters"),
});

// An edit (or resubmission) sends the full form again.
export const updateSubmissionSchema = createSubmissionSchema;

export const idParamSchema = z.object({ id: z.string().min(1) });

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
