"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";

const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401;

const isAuthPath = (path: string) => path.startsWith("/login") || path.startsWith("/signup");

/**
 * Any 401 from a query or an authenticated mutation means the session is gone → back to login.
 * The cache is cleared only once we are on an auth page: clearing it while dashboard components
 * are still mounted would make them refetch (and 401) again in a loop.
 */
function SessionWatcher() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthPath(pathname)) qc.clear();
  }, [pathname, qc]);

  useEffect(() => {
    let redirecting = false;
    const onError = (error: unknown) => {
      if (redirecting || !isUnauthorized(error) || isAuthPath(window.location.pathname)) return;
      redirecting = true;
      void qc.cancelQueries();
      router.replace("/login");
    };

    const unsubQueries = qc.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") onError(event.action.error);
    });
    const unsubMutations = qc.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") onError(event.action.error);
    });

    return () => {
      unsubQueries();
      unsubMutations();
    };
  }, [qc, router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Don't retry client errors (401/403/404...); retry once on network/server errors.
            retry: (count, error) =>
              count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {/* Animations turn off for users who ask their OS for reduced motion */}
      <MotionConfig reducedMotion="user">
        <SessionWatcher />
        {children}
        <Toaster richColors position="top-right" />
      </MotionConfig>
    </QueryClientProvider>
  );
}
