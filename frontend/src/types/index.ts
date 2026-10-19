export type Role = "STUDENT" | "MENTOR";
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type StatusFilter = "ALL" | SubmissionStatus;

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Feedback = {
  id?: string;
  comment: string | null;
  decision: SubmissionStatus;
  createdAt?: string;
  mentor?: { name: string };
};

export type Submission = {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: SubmissionStatus;
  studentId: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  feedbacks: Feedback[];
};

export type MentorSubmission = Submission & {
  student: { id: string; name: string; email: string };
  reviewedBy: { id: string; name: string } | null;
};

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

export type ApiResponse<T, M = undefined> = {
  success: true;
  message: string;
  data: T;
  meta: M;
};

export type Stats = { total: number; PENDING: number; APPROVED: number; REJECTED: number };

export type ListParams = {
  page: number;
  limit: number;
  status: StatusFilter;
  search: string;
  sort: "newest" | "oldest";
};
