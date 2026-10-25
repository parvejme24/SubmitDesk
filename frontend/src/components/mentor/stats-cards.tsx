"use client";

import { CheckCircle2Icon, ClockIcon, LayersIcon, XCircleIcon } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber, Stagger, staggerChild } from "@/components/motion/primitives";
import { QueryError } from "@/components/shared/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-mentor";
import { cn } from "@/lib/utils";
import type { StatusFilter } from "@/types";

const items = [
  {
    key: "total",
    filter: "ALL",
    label: "Total",
    Icon: LayersIcon,
    tile: "from-indigo-500 to-violet-500",
    bar: "bg-indigo-500",
  },
  {
    key: "PENDING",
    filter: "PENDING",
    label: "Pending",
    Icon: ClockIcon,
    tile: "from-amber-400 to-orange-500",
    bar: "bg-amber-500",
  },
  {
    key: "APPROVED",
    filter: "APPROVED",
    label: "Approved",
    Icon: CheckCircle2Icon,
    tile: "from-emerald-400 to-teal-500",
    bar: "bg-emerald-500",
  },
  {
    key: "REJECTED",
    filter: "REJECTED",
    label: "Rejected",
    Icon: XCircleIcon,
    tile: "from-rose-400 to-pink-500",
    bar: "bg-rose-500",
  },
] as const;

/** Each card is also a shortcut: clicking it applies that status filter to the table below. */
export function StatsCards({ active, onSelect }: { active: StatusFilter; onSelect: (s: StatusFilter) => void }) {
  const { data, isPending, isError, error, refetch } = useStats();

  if (isError) return <QueryError message={error.message} onRetry={() => refetch()} />;

  return (
    <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ key, filter, label, Icon, tile, bar }) => {
        const value = data?.[key] ?? 0;
        const share = data && data.total > 0 ? Math.round((value / data.total) * 100) : 0;
        const selected = active === filter;
        return (
          <motion.button
            key={key}
            type="button"
            variants={staggerChild}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => onSelect(filter)}
            aria-pressed={selected}
            aria-label={`${label}: ${value}. Show ${filter === "ALL" ? "all" : label.toLowerCase()} projects`}
            className={cn(
              "relative overflow-hidden rounded-2xl glass p-4 text-left transition-shadow outline-none hover:shadow-xl focus-visible:ring-3 focus-visible:ring-ring/60 sm:p-5",
              selected && "ring-2 ring-primary/60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
                {isPending ? (
                  <Skeleton className="mt-2 h-8 w-12" />
                ) : (
                  <AnimatedNumber
                    value={value}
                    className="mt-1 block text-3xl font-semibold tracking-tight tabular-nums"
                  />
                )}
              </div>
              <span
                aria-hidden
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg",
                  tile,
                )}
              >
                <Icon className="size-5" />
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <motion.div
                className={cn("h-full rounded-full", bar)}
                initial={{ width: 0 }}
                animate={{ width: isPending ? 0 : `${key === "total" ? 100 : share}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {key === "total" ? "All submissions" : `${share}% of total`}
            </p>
          </motion.button>
        );
      })}
    </Stagger>
  );
}

/** Nudge shown while projects are waiting; one click jumps to the pending queue. */
export function PendingBanner({ active, onShow }: { active: StatusFilter; onShow: () => void }) {
  const { data } = useStats();
  const pending = data?.PENDING ?? 0;
  if (pending === 0 || active === "PENDING") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-2.5 text-sm">
        <ClockIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
        <span>
          <span className="font-semibold">
            {pending} {pending === 1 ? "project is" : "projects are"} waiting
          </span>{" "}
          <span className="text-muted-foreground">for a review.</span>
        </span>
      </p>
      <button
        type="button"
        onClick={onShow}
        className="self-start rounded-lg px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-500/30 transition-colors outline-none hover:bg-amber-500/12 focus-visible:ring-3 focus-visible:ring-ring/60 sm:self-auto dark:text-amber-300"
      >
        Review pending
      </button>
    </motion.div>
  );
}
