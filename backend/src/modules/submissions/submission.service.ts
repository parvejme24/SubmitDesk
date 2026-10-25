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
    select: { id: true, comment: true, decision: true, mark: true, createdAt: true, mentor: { select: { name: true } } },
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

/** Statuses a student may still change. An APPROVED project is final, so it's locked. */
const EDITABLE = ["PENDING", "REJECTED"] as const;

async function findOwned(studentId: string, submissionId: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new AppError(404, "Submission not found");
  if (submission.studentId !== studentId) throw new AppError(403, "You can only change your own submissions");
  if (submission.status === "APPROVED") throw new AppError(409, "Approved submissions are locked");
  return submission;
}

/**
 * Edit a PENDING or REJECTED submission. A PENDING one stays in the queue with the new content;
 * a REJECTED one goes back to PENDING (a resubmission) and its old reviews stay in the history.
 */
export async function updateSubmission(studentId: string, submissionId: string, data: CreateSubmissionInput) {
  const submission = await findOwned(studentId, submissionId);

  const repoUrlKey = normalizeRepoUrl(data.repoUrl);
  if (repoUrlKey !== submission.repoUrlKey) {
    const taken = await prisma.submission.findUnique({ where: { repoUrlKey }, select: { id: true } });
    if (taken) throw duplicateError();
  }

  // Conditional update: if a mentor approved it in the meantime, nothing matches → 409.
  const result = await prisma.submission.updateMany({
    where: { id: submissionId, studentId, status: { in: [...EDITABLE] } },
    data: { ...data, repoUrlKey, status: "PENDING", reviewedById: null, reviewedAt: null },
  });
  if (result.count === 0) throw new AppError(409, "This submission was just reviewed, refresh to see the result");

  return prisma.submission.findUnique({ where: { id: submissionId }, include: withLatestFeedback });
}

/** Delete a PENDING or REJECTED submission (its feedback rows cascade). Frees the repo URL again. */
export async function deleteSubmission(studentId: string, submissionId: string) {
  await findOwned(studentId, submissionId);

  const result = await prisma.submission.deleteMany({
    where: { id: submissionId, studentId, status: { in: [...EDITABLE] } },
  });
  if (result.count === 0) throw new AppError(409, "This submission was just reviewed, refresh to see the result");
}
