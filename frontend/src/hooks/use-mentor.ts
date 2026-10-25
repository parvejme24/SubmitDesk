"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { GradeValues, ReviewValues } from "@/schemas/review";
import type {
  ApiResponse,
  ListParams,
  MentorSubmission,
  PageMeta,
  Stats,
  StudentDetail,
  StudentListParams,
  StudentSummary,
} from "@/types";

export function useMentorSubmissions(params: ListParams) {
  return useQuery({
    queryKey: qk.mentorList(params),
    queryFn: () => {
      const qs = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        status: params.status,
        sort: params.sort,
        ...(params.search && { search: params.search }),
      });
      return api<ApiResponse<MentorSubmission[], PageMeta>>(`/mentor/submissions?${qs}`);
    },
    placeholderData: keepPreviousData, // no flicker between pages / filters
  });
}

export function useMentorSubmission(id: string | null) {
  return useQuery({
    queryKey: qk.mentorDetail(id ?? ""),
    queryFn: () => api<ApiResponse<MentorSubmission>>(`/mentor/submissions/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useStats() {
  return useQuery({
    queryKey: qk.stats,
    queryFn: () => api<ApiResponse<Stats>>("/mentor/stats").then((r) => r.data),
  });
}

export function useReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: ReviewValues & { id: string }) =>
      api(`/mentor/submissions/${id}/review`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.mentor }); // refreshes table AND stats
      toast.success(vars.decision === "APPROVED" ? "Project approved" : "Project rejected");
    },
    onError: (e: ApiError) => {
      if (e.status === 409 || e.status === 404) qc.invalidateQueries({ queryKey: qk.mentor }); // someone else reviewed
      toast.error(e.message);
    },
  });
}

/** Step 2: add or change the mark and feedback of a reviewed submission. */
export function useGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: GradeValues & { id: string }) =>
      api(`/mentor/submissions/${id}/grade`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.mentor }); // table, details and student pages
      toast.success("Mark and feedback saved");
    },
    onError: (e: ApiError) => {
      if (e.status === 409 || e.status === 404) qc.invalidateQueries({ queryKey: qk.mentor });
      toast.error(e.message);
    },
  });
}

export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: qk.students(params),
    queryFn: () => {
      const qs = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        ...(params.search && { search: params.search }),
      });
      return api<ApiResponse<StudentSummary[], PageMeta>>(`/mentor/students?${qs}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: qk.student(id ?? ""),
    queryFn: () => api<ApiResponse<StudentDetail>>(`/mentor/students/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
