import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { ListQuery, ReviewInput } from "./review.schema.js";

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
        feedbacks: { orderBy: { createdAt: "desc" }, take: 1, select: { comment: true, decision: true } },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items,
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  };
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
      data: { submissionId: id, mentorId, decision: input.decision, comment: input.comment },
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
