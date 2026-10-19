import { prisma } from "../../lib/prisma.js";
import { normalizeRepoUrl } from "../../lib/normalize-url.js";
import { AppError } from "../../utils/app-error.js";
import type { CreateSubmissionInput } from "./submission.schema.js";

const duplicateError = () =>
  new AppError(409, "This repository has already been submitted", {
    repoUrl: ["This repository has already been submitted"],
  });

const withLatestFeedback = {
  feedbacks: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { id: true, comment: true, decision: true, createdAt: true, mentor: { select: { name: true } } },
  },
} as const;

export async function createSubmission(studentId: string, data: CreateSubmissionInput) {
  const repoUrlKey = normalizeRepoUrl(data.repoUrl);

  // Friendly early check. The real guarantee is the @unique constraint (P2002 → 409 on a race).
  const existing = await prisma.submission.findUnique({ where: { repoUrlKey }, select: { id: true } });
  if (existing) throw duplicateError();

  return prisma.submission.create({
    data: { ...data, repoUrlKey, studentId },
  });
}

export function getMySubmissions(studentId: string) {
  return prisma.submission.findMany({
    relationLoadStrategy: "join",
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: withLatestFeedback,
  });
}

export async function resubmit(studentId: string, submissionId: string, data: CreateSubmissionInput) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new AppError(404, "Submission not found");
  if (submission.studentId !== studentId) throw new AppError(403, "You can only edit your own submissions");
  if (submission.status !== "REJECTED") {
    throw new AppError(400, "Only rejected submissions can be resubmitted");
  }

  const repoUrlKey = normalizeRepoUrl(data.repoUrl);
  if (repoUrlKey !== submission.repoUrlKey) {
    const taken = await prisma.submission.findUnique({ where: { repoUrlKey }, select: { id: true } });
    if (taken) throw duplicateError();
  }

  // Conditional update: guards against a double resubmit racing with itself.
  const result = await prisma.submission.updateMany({
    where: { id: submissionId, studentId, status: "REJECTED" },
    data: { ...data, repoUrlKey, status: "PENDING", reviewedById: null, reviewedAt: null },
  });
  if (result.count === 0) throw new AppError(409, "This submission was already resubmitted");

  return prisma.submission.findUnique({ where: { id: submissionId }, include: withLatestFeedback });
}
