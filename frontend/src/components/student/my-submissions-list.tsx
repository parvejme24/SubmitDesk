"use client";

import { CalendarIcon, ExternalLinkIcon, FolderGit2Icon, MessageSquareIcon, PlusIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { AnimatedNumber, Stagger, StaggerItem } from "@/components/motion/primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { MARK_MAX } from "@/components/shared/mark-badge";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge, statusStyles } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMySubmissions } from "@/hooks/use-submissions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/types";
import { SubmissionActions } from "./submission-actions";

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

/** Submitted → In review → Decision. Text labels carry the meaning, so it never relies on color alone. */
function ReviewProgress({ status }: { status: SubmissionStatus }) {
  const decided = status !== "PENDING";
  const steps = [
    { label: "Submitted", state: "done" },
    { label: "In review", state: decided ? "done" : "current" },
    { label: decided ? statusStyles[status].label : "Decision", state: decided ? "done" : "todo" },
  ] as const;
  const finalTone = status === "REJECTED" ? "bg-rose-500" : "bg-emerald-500";

  return (
    <ol className="mt-4 flex items-center gap-2" aria-label="Review progress">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={step.label} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <span
                aria-hidden
                className={cn(
                  "size-2.5 rounded-full",
                  step.state === "done" && (isLast ? finalTone : "bg-primary"),
                  step.state === "current" && "animate-pulse bg-amber-500 ring-4 ring-amber-500/20",
                  step.state === "todo" && "bg-muted-foreground/30",
                )}
              />
              <span className={cn(step.state === "todo" ? "text-muted-foreground" : "font-medium")}>{step.label}</span>
              {step.state === "current" && <span className="sr-only">(current step)</span>}
            </span>
            {!isLast && (
              <span
                aria-hidden
                className={cn("h-px flex-1", steps[i + 1].state === "todo" ? "bg-border" : "bg-primary/40")}
              />
            )}
          </li>
        );
      })}
    </ol>
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

      <ReviewProgress status={s.status} />

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

      {/* Result of the latest review. Hidden while PENDING (after a resubmit the old review is history). */}
      {s.status !== "PENDING" && feedback && (feedback.mark != null || feedback.comment) && (
        <section
          aria-label="Review result"
          className={cn(
            "mt-4 flex gap-4 rounded-xl p-3 text-sm",
            s.status === "REJECTED" ? "bg-rose-500/8" : "bg-emerald-500/8",
          )}
        >
          {feedback.mark != null && (
            <div className="shrink-0 text-center">
              <p className="text-xs text-muted-foreground">Mark</p>
              <p className="text-2xl leading-tight font-semibold tabular-nums">
                {feedback.mark}
                <span className="text-sm font-normal text-muted-foreground">/{MARK_MAX}</span>
              </p>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <MessageSquareIcon className="size-3.5" aria-hidden />
              Mentor feedback{feedback.mentor?.name ? ` · ${feedback.mentor.name}` : ""}
            </p>
            <p className={cn("break-words", feedback.comment ? "text-muted-foreground" : "text-muted-foreground/70 italic")}>
              {feedback.comment ?? "No written feedback."}
            </p>
          </div>
        </section>
      )}

      <div className="mt-4 flex justify-end border-t border-border/60 pt-3">
        <SubmissionActions submission={s} />
      </div>
    </motion.article>
  );
}
