import type { ListParams, StudentListParams } from "@/types";

export const qk = {
  me: ["me"] as const,
  mySubmissions: ["submissions", "me"] as const,
  mentor: ["mentor"] as const,
  stats: ["mentor", "stats"] as const,
  mentorList: (params: ListParams) => ["mentor", "submissions", params] as const,
  // under "mentor", so a review invalidates it too
  mentorDetail: (id: string) => ["mentor", "submission", id] as const,
  students: (params: StudentListParams) => ["mentor", "students", params] as const,
  student: (id: string) => ["mentor", "student", id] as const,
};
