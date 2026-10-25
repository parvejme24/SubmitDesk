"use client";

import { ChevronRightIcon, SearchIcon } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkBadge } from "@/components/shared/mark-badge";
import { QueryError } from "@/components/shared/query-error";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useStudents } from "@/hooks/use-mentor";
import { formatDate } from "@/lib/format";
import type { StatusCounts, StudentListParams, StudentSummary } from "@/types";
import { Pagination } from "./pagination";
import { StudentDialog } from "./student-dialog";

const PAGE_SIZE = 10;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Search and page live in the URL, like the review dashboard. */
function useListParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params: StudentListParams = useMemo(() => {
    const page = Number(searchParams.get("page"));
    return {
      page: Number.isInteger(page) && page > 0 ? page : 1,
      search: searchParams.get("search") ?? "",
      limit: PAGE_SIZE,
    };
  }, [searchParams]);

  const update = (patch: Partial<StudentListParams>) => {
    const next = { ...params, ...patch };
    if (!("page" in patch)) next.page = 1;
    const qs = new URLSearchParams();
    if (next.search) qs.set("search", next.search);
    if (next.page > 1) qs.set("page", String(next.page));
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return [params, update] as const;
}

/** "3 total · 1 pending · 1 approved · 1 rejected" as small dots + numbers. */
export function CountsLine({ counts }: { counts: StatusCounts }) {
  const parts = [
    { label: "pending", value: counts.PENDING, dot: "bg-amber-500" },
    { label: "approved", value: counts.APPROVED, dot: "bg-emerald-500" },
    { label: "rejected", value: counts.REJECTED, dot: "bg-rose-500" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{counts.total} total</span>
      {parts.map((p) => (
        <span key={p.label} className="flex items-center gap-1">
          <span aria-hidden className={`size-1.5 rounded-full ${p.dot}`} />
          {p.value} {p.label}
        </span>
      ))}
    </div>
  );
}

function Average({ s }: { s: StudentSummary }) {
  if (s.averageMark == null) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-2">
      <MarkBadge mark={s.averageMark} />
      <span className="text-xs text-muted-foreground">
        from {s.markedCount} {s.markedCount === 1 ? "mark" : "marks"}
      </span>
    </span>
  );
}

export function StudentsDirectory() {
  const [params, update] = useListParams();
  const [searchInput, setSearchInput] = useState(params.search);
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useStudents(params);

  useEffect(() => {
    if (debouncedSearch !== params.search) update({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass p-2">
        <div className="relative md:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search students by name or email"
            className="pl-9"
            maxLength={100}
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {data && !isPlaceholderData ? `${data.meta.total} students found, page ${data.meta.page} of ${data.meta.totalPages}` : ""}
      </p>

      {isError ? (
        <QueryError message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          title={params.search ? `No students match "${params.search}"` : "No students yet"}
          description={params.search ? "Try a different name or email." : "Students appear here once they sign up."}
        />
      ) : (
        <div className="space-y-4">
          <motion.div animate={{ opacity: isPlaceholderData ? 0.55 : 1 }} transition={{ duration: 0.2 }}>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl glass md:block">
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                  <caption className="sr-only">Students with their submissions and average mark</caption>
                  <TableHeader>
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="pl-5">Student</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Average mark</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="pr-5 text-right">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((s) => (
                      <TableRow key={s.id} className="border-border/50 hover:bg-primary/4">
                        <TableCell className="max-w-64 py-3.5 pl-5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                              {initials(s.name)}
                            </span>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setOpenId(s.id)}
                                className="block max-w-full truncate text-left font-medium underline-offset-4 hover:text-primary hover:underline"
                              >
                                {s.name}
                              </button>
                              <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <CountsLine counts={s.counts} />
                        </TableCell>
                        <TableCell>
                          <Average s={s} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                        <TableCell className="pr-5 text-right">
                          <button
                            type="button"
                            onClick={() => setOpenId(s.id)}
                            aria-label={`Open ${s.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/8 hover:text-foreground"
                          >
                            <ChevronRightIcon className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Phone cards */}
            <ul className="grid gap-3 md:hidden">
              {data.data.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(s.id)}
                    className="flex w-full items-start gap-3 rounded-2xl glass p-4 text-left"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                      {initials(s.name)}
                    </span>
                    <span className="min-w-0 flex-1 space-y-2">
                      <span className="block">
                        <span className="block truncate font-semibold">{s.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{s.email}</span>
                      </span>
                      <CountsLine counts={s.counts} />
                      <Average s={s} />
                    </span>
                    <ChevronRightIcon className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Pagination meta={data.meta} onPageChange={(page) => update({ page })} />
            </div>
            {isFetching && <Spinner className="text-muted-foreground" />}
          </div>
        </div>
      )}

      <StudentDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
