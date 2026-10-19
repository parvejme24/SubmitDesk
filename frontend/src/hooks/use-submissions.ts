"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { SubmissionValues } from "@/schemas/submission";
import type { ApiResponse, Submission } from "@/types";

export function useMySubmissions() {
  return useQuery({
    queryKey: qk.mySubmissions,
    queryFn: () => api<ApiResponse<Submission[]>>("/submissions/me").then((r) => r.data),
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SubmissionValues) =>
      api<ApiResponse<Submission>>("/submissions", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mySubmissions }),
  });
}

export function useResubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SubmissionValues }) =>
      api<ApiResponse<Submission>>(`/submissions/${id}/resubmit`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mySubmissions }),
  });
}
