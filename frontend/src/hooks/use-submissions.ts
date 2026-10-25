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

/** Edit a PENDING or REJECTED submission; a REJECTED one goes back to PENDING. */
export function useUpdateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SubmissionValues }) =>
      api<ApiResponse<Submission>>(`/submissions/${id}`, { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mySubmissions }),
  });
}

export function useDeleteSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<ApiResponse<undefined>>(`/submissions/${id}`, { method: "DELETE" }),
    // Drop it from the list right away, then refetch to stay in sync with the server
    onSuccess: (_, id) => {
      qc.setQueryData<Submission[]>(qk.mySubmissions, (list) => list?.filter((s) => s.id !== id));
      return qc.invalidateQueries({ queryKey: qk.mySubmissions });
    },
  });
}
