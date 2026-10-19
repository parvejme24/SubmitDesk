"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { ReviewValues } from "@/schemas/review";
import type { ApiResponse, ListParams, MentorSubmission, PageMeta, Stats } from "@/types";

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
