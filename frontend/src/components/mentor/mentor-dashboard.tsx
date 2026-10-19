"use client";

import { SearchIcon } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryError } from "@/components/shared/query-error";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { useMentorSubmissions } from "@/hooks/use-mentor";
import type { ListParams, StatusFilter as Status } from "@/types";
import { Pagination } from "./pagination";
import { ReviewDialog, type ReviewTarget } from "./review-dialog";
import { StatsCards } from "./stats-cards";
import { StatusFilter } from "./status-filter";
import { SubmissionsTable } from "./submissions-table";

const STATUSES: Status[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];
const PAGE_SIZE = 10;

const emptyMessages: Record<Status, string> = {
  ALL: "No submissions yet",
  PENDING: "No pending projects. You're all caught up!",
  APPROVED: "No approved projects yet",
  REJECTED: "No rejected projects",
};

/** Filters, search and page live in the URL: refresh keeps the view, links are shareable, back works. */
function useListParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params: ListParams = useMemo(() => {
    const status = searchParams.get("status")?.toUpperCase() as Status;
    const page = Number(searchParams.get("page"));
    return {
      status: STATUSES.includes(status) ? status : "ALL",
      page: Number.isInteger(page) && page > 0 ? page : 1,
      search: searchParams.get("search") ?? "",
      sort: searchParams.get("sort") === "oldest" ? "oldest" : "newest",
      limit: PAGE_SIZE,
    };
  }, [searchParams]);

  const update = (patch: Partial<ListParams>) => {
    const next = { ...params, ...patch };
    // Changing anything other than the page resets back to page 1.
    if (!("page" in patch)) next.page = 1;
    const qs = new URLSearchParams();
    if (next.status !== "ALL") qs.set("status", next.status);
    if (next.search) qs.set("search", next.search);
    if (next.sort !== "newest") qs.set("sort", next.sort);
    if (next.page > 1) qs.set("page", String(next.page));
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return [params, update] as const;
}

export function MentorDashboard() {
  const [params, update] = useListParams();
  const [searchInput, setSearchInput] = useState(params.search);
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>(null);

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useMentorSubmissions(params);

  // Push the debounced search into the URL.
  useEffect(() => {
    if (debouncedSearch !== params.search) update({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Page beyond the last one (e.g. after reviews shrink a filtered list) → jump to the last page.
  useEffect(() => {
    if (data && data.meta.total > 0 && params.page > data.meta.totalPages) update({ page: data.meta.totalPages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, params.page]);

  return (
    <div className="space-y-6">
      <StatsCards />

      <div className="flex flex-col gap-3 rounded-2xl glass p-2 md:flex-row md:items-center md:justify-between">
        <StatusFilter value={params.status} onChange={(status) => update({ status })} />
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search project name..."
              aria-label="Search by project name"
              className="pl-9"
              maxLength={100}
            />
          </div>
          <Select value={params.sort} onValueChange={(v) => update({ sort: v as ListParams["sort"] })}>
            <SelectTrigger className="w-28 sm:w-32" aria-label="Sort order">
              <SelectValue>{params.sort === "newest" ? "Newest" : "Oldest"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
          title={params.search ? `No projects match "${params.search}"` : emptyMessages[params.status]}
          description={params.search ? "Try a different search term." : undefined}
        />
      ) : (
        <div className="space-y-4">
          <motion.div
            animate={{ opacity: isPlaceholderData ? 0.55 : 1, filter: isPlaceholderData ? "blur(1.5px)" : "blur(0px)" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <SubmissionsTable items={data.data} onReview={setReviewTarget} />
          </motion.div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Pagination meta={data.meta} onPageChange={(page) => update({ page })} />
            </div>
            {isFetching && <Spinner className="text-muted-foreground" />}
          </div>
        </div>
      )}

      <ReviewDialog target={reviewTarget} onClose={() => setReviewTarget(null)} />
    </div>
  );
}
