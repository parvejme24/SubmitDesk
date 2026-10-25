import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { StudentListQuery } from "./student.schema.js";

const studentFields = { id: true, name: true, email: true, createdAt: true } as const;

type SubmissionMarks = { status: "PENDING" | "APPROVED" | "REJECTED"; feedbacks: { mark: number | null }[] };

/**
 * Counts per status, plus the average of the current marks: the latest review's mark of each
 * reviewed submission (a PENDING resubmission's old mark doesn't count).
 */
function summarize(submissions: SubmissionMarks[]) {
  const counts = { total: submissions.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  const marks: number[] = [];
  for (const s of submissions) {
    counts[s.status]++;
    const mark = s.feedbacks[0]?.mark;
    if (s.status !== "PENDING" && mark != null) marks.push(mark);
  }
  const averageMark = marks.length ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10 : null;
  return { counts, averageMark, markedCount: marks.length };
}

const latestMark = { feedbacks: { orderBy: { createdAt: "desc" }, take: 1, select: { mark: true } } } as const;

export async function listStudents(q: StudentListQuery) {
  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    ...(q.search && {
      OR: [
        { name: { contains: q.search, mode: "insensitive" } },
        { email: { contains: q.search, mode: "insensitive" } },
      ],
    }),
  };

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      relationLoadStrategy: "join",
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      // One joined query for the whole page: each student's submissions with their latest mark
      select: { ...studentFields, submissions: { select: { status: true, ...latestMark } } },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: students.map(({ submissions, ...student }) => ({ ...student, ...summarize(submissions) })),
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

/** One student with every submission (newest first) and its latest review. */
export async function getStudent(id: string) {
  const student = await prisma.user.findFirst({
    relationLoadStrategy: "join",
    where: { id, role: "STUDENT" },
    select: {
      ...studentFields,
      submissions: {
        orderBy: { createdAt: "desc" },
        include: {
          feedbacks: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { comment: true, decision: true, mark: true, createdAt: true, mentor: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!student) throw new AppError(404, "Student not found");
  return { ...student, ...summarize(student.submissions) };
}
