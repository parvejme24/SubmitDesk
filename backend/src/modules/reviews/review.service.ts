import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { GradeInput, ListQuery, ReviewInput } from "./review.schema.js";

export async function listSubmissions(q: ListQuery) {
  const where: Prisma.SubmissionWhereInput = {
    ...(q.status !== "ALL" && { status: q.status }),
    ...(q.search && { projectName: { contains: q.search, mode: "insensitive" } }),
  };

  // Run both in parallel; relationLoadStrategy "join" loads student/reviewer/feedback in the
  // same SQL query (LATERAL JOINs) instead of one extra query per relation.
  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      relationLoadStrategy: "join",
      where,
      orderBy: [{ createdAt: q.sort === "newest" ? "desc" : "asc" }, { id: "asc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        // One joined query → no N+1
        student: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } },
        feedbacks: { orderBy: { createdAt: "desc" }, take: 1, select: { comment: true, decision: true, mark: true } },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items,
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

/** One submission with its student and full review history (newest first). */
export async function getSubmission(id: string) {
  const submission = await prisma.submission.findUnique({
    relationLoadStrategy: "join",
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
      feedbacks: {
        orderBy: { createdAt: "desc" },
        select: { id: true, comment: true, decision: true, mark: true, createdAt: true, mentor: { select: { name: true } } },
      },
    },
  });
  if (!submission) throw new AppError(404, "Submission not found");
  return submission;
}

export async function getStats() {
  const grouped = await prisma.submission.groupBy({ by: ["status"], _count: { _all: true } });
  const stats = { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const g of grouped) {
    stats[g.status] = g._count._all;
    stats.total += g._count._all;
  }
  return stats;
}

export async function reviewSubmission(mentorId: string, id: string, input: ReviewInput) {
  return prisma.$transaction(async (tx) => {
    // Conditional update: only succeeds if still PENDING. Two mentors clicking at once →
    // only one row matches; the other gets 409 instead of silently overwriting.
    const result = await tx.submission.updateMany({
      where: { id, status: "PENDING" },
      data: { status: input.decision, reviewedById: mentorId, reviewedAt: new Date() },
    });

    if (result.count === 0) {
      const exists = await tx.submission.findUnique({ where: { id }, select: { status: true } });
      if (!exists) throw new AppError(404, "Submission not found");
      throw new AppError(409, `This submission is already ${exists.status.toLowerCase()}`);
    }

    await tx.feedback.create({
      data: { submissionId: id, mentorId, decision: input.decision, mark: input.mark, comment: input.comment },
    });

    return tx.submission.findUnique({
      where: { id },
      include: {
        reviewedBy: { select: { id: true, name: true } },
        feedbacks: { orderBy: { createdAt: "desc" } },
      },
    });
  });
}

/**
 * Add or change the mark and feedback of the latest review. Only for a reviewed (APPROVED or
 * REJECTED) submission: a PENDING one has to be approved or rejected first.
 */
export async function gradeSubmission(id: string, input: GradeInput) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { status: true, feedbacks: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } } },
  });
  if (!submission) throw new AppError(404, "Submission not found");
  const latest = submission.feedbacks[0];
  if (submission.status === "PENDING" || !latest) {
    throw new AppError(409, "Approve or reject this submission before giving a mark");
  }

  // Conditional on the status, so a student resubmitting at the same moment doesn't get
  // their old review re-graded while it's back in the queue.
  const result = await prisma.feedback.updateMany({
    where: { id: latest.id, submission: { status: { in: ["APPROVED", "REJECTED"] } } },
    data: { mark: input.mark, comment: input.comment ?? null },
  });
  if (result.count === 0) throw new AppError(409, "This submission was just resubmitted, refresh to see it");

  return getSubmission(id);
}
