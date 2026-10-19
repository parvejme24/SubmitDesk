"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { LoginValues, SignupValues } from "@/schemas/auth";
import type { ApiResponse, User } from "@/types";

type AuthResponse = ApiResponse<{ user: User; token: string }>;

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api<ApiResponse<User>>("/auth/me").then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginValues) =>
      api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: ({ data }) => qc.setQueryData(qk.me, data.user),
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SignupValues) =>
      api<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: ({ data }) => qc.setQueryData(qk.me, data.user),
  });
}

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    // Navigate first; SessionWatcher clears the cache once the login page is shown.
    onSuccess: () => {
      router.replace("/login");
      router.refresh();
    },
    onError: () => toast.error("Could not log out, please try again"),
  });
}
