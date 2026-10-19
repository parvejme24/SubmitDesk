"use client";

import { CalendarIcon, ExternalLinkIcon, FolderGit2Icon, MessageSquareIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { AnimatedNumber, Stagger, StaggerItem } from "@/components/motion/primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge, statusStyles } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMySubmissions } from "@/hooks/use-submissions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/types";
import { ResubmitDialog } from "./resubmit-dialog";

const STATUSES: SubmissionStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export function MySubmissionsList() {
  const { data, isPending, isError, error, refetch } = useMySubmissions();

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {STATUSES.map((s) => (
            <Skeleton key={s} className="h-20 rounded-2xl" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) return <QueryError message={error.message} onRetry={() => refetch()} />;

  if (data.length === 0) {
    return (
      <EmptyState
        title="No submissions yet"
        description="Submit your first project to get feedback from a mentor."
        action={
          <Link href="/student/submit" className={buttonVariants({ size: "lg" })}>
            <PlusIcon />
            Submit a project
          </Link>
        }
      />
    );
  }

  const counts = STATUSES.map((s) => ({ status: s, count: data.filter((d) => d.status === s).length }));

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-3 gap-2 sm:gap-3">
        {counts.map(({ status, count }) => {
          const { label, Icon } = statusStyles[status];
          return (
            <StaggerItem key={status} className="rounded-2xl glass p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
                <Icon className="hidden size-4 text-muted-foreground sm:block" />
              </div>
              <AnimatedNumber value={count} className="mt-1 block text-2xl font-semibold tabular-nums" />
            </StaggerItem>
          );
        })}
      </Stagger>

      <Stagger className="grid gap-4">
        {data.map((s) => (
          <StaggerItem key={s.id} layout>
            <SubmissionCard submission={s} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

function SubmissionCard({ submission: s }: { submission: Submission }) {
  const feedback = s.feedbacks[0];

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-2xl glass p-4 transition-shadow hover:shadow-lg sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold sm:text-lg">{s.projectName}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            Submitted {formatDate(s.createdAt)}
          </p>
        </div>
        <StatusBadge status={s.status} className="self-start" />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={s.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FolderGit2Icon />
          Repository
        </a>
        <a
          href={s.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ExternalLinkIcon />
          Live site
        </a>
      </div>

      {s.status !== "PENDING" && feedback?.comment && (
        <div
          className={cn(
            "mt-4 rounded-xl p-3 text-sm",
            s.status === "REJECTED" ? "bg-rose-500/8" : "bg-emerald-500/8",
          )}
        >
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <MessageSquareIcon className="size-3.5" />
            Mentor feedback{feedback.mentor?.name ? ` · ${feedback.mentor.name}` : ""}
          </p>
          <p className="text-muted-foreground">{feedback.comment}</p>
        </div>
      )}

      {s.status === "REJECTED" && (
        <div className="mt-4 flex justify-end">
          <ResubmitDialog submission={s} />
        </div>
      )}
    </motion.article>
  );
}
