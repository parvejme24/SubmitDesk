"use client";

import { CheckCircle2Icon, ClockIcon, LayersIcon, XCircleIcon } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber, Stagger, StaggerItem } from "@/components/motion/primitives";
import { QueryError } from "@/components/shared/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-mentor";
import { cn } from "@/lib/utils";

const items = [
  { key: "total", label: "Total", Icon: LayersIcon, tile: "from-indigo-500 to-violet-500", bar: "bg-indigo-500" },
  { key: "PENDING", label: "Pending", Icon: ClockIcon, tile: "from-amber-400 to-orange-500", bar: "bg-amber-500" },
  {
    key: "APPROVED",
    label: "Approved",
    Icon: CheckCircle2Icon,
    tile: "from-emerald-400 to-teal-500",
    bar: "bg-emerald-500",
  },
  { key: "REJECTED", label: "Rejected", Icon: XCircleIcon, tile: "from-rose-400 to-pink-500", bar: "bg-rose-500" },
] as const;

export function StatsCards() {
  const { data, isPending, isError, error, refetch } = useStats();

  if (isError) return <QueryError message={error.message} onRetry={() => refetch()} />;

  return (
    <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ key, label, Icon, tile, bar }) => {
        const value = data?.[key] ?? 0;
        const share = data && data.total > 0 ? Math.round((value / data.total) * 100) : 0;
        return (
          <StaggerItem
            key={key}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative overflow-hidden rounded-2xl glass p-4 transition-shadow hover:shadow-xl sm:p-5"
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
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg",
                  tile,
                )}
              >
                <Icon className="size-5" />
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
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
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
