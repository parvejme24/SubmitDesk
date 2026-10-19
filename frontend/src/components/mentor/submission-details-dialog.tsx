"use client";

import { CalendarIcon, CheckIcon, ExternalLinkIcon, FolderGit2Icon, MessageSquareIcon, XIcon } from "lucide-react";
import { motion } from "motion/react";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMentorSubmission } from "@/hooks/use-mentor";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MentorSubmission } from "@/types";
import type { ReviewTarget } from "./review-dialog";

type Props = {
  /** Row the mentor clicked; shown instantly while the full record loads. */
  preview: MentorSubmission | null;
  onClose: () => void;
  onReview: (t: NonNullable<ReviewTarget>) => void;
};

/** Everything about one submission: full description, links, student and review history. */
export function SubmissionDetailsDialog({ preview, onClose, onReview }: Props) {
  const { data, isPending, isError, error, refetch } = useMentorSubmission(preview?.id ?? null);
  const s = data ?? preview;

  const review = (decision: "APPROVED" | "REJECTED") => {
    if (!s) return;
    onClose();
    onReview({ submission: s, decision });
  };

  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] grid-cols-1 overflow-x-hidden overflow-y-auto *:min-w-0 sm:max-w-xl">
        {s && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <DialogTitle className="text-lg">{s.projectName}</DialogTitle>
                <StatusBadge status={s.status} />
              </div>
              <DialogDescription className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                Submitted {formatDateTime(s.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl bg-primary/6 p-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-white">
                  {s.student.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.student.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.student.email}</p>
                </div>
              </div>

              <section className="space-y-1.5">
                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</h4>
                <p className="text-sm leading-relaxed break-words whitespace-pre-line">{s.description}</p>
              </section>

              <div className="grid grid-cols-1 gap-2 *:min-w-0 sm:grid-cols-2">
                <a
                  href={s.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", className: "justify-start" })}
                >
                  <FolderGit2Icon />
                  <span className="truncate">{s.repoUrl.replace(/^https:\/\/(www\.)?/, "")}</span>
                </a>
                <a
                  href={s.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", className: "justify-start" })}
                >
                  <ExternalLinkIcon />
                  <span className="truncate">{s.liveUrl.replace(/^https:\/\//, "")}</span>
                </a>
              </div>

              <section className="space-y-2">
                <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Review history</h4>
                {isError ? (
                  <QueryError message={error.message} onRetry={() => refetch()} />
                ) : isPending ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : data.feedbacks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not reviewed yet.</p>
                ) : (
                  <ol className="relative space-y-3 border-l border-border pl-5">
                    {data.feedbacks.map((f, i) => (
                      <motion.li
                        key={f.id ?? i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative"
                      >
                        <span
                          className={cn(
                            "absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-(--glass-strong)",
                            f.decision === "APPROVED" ? "bg-emerald-500" : "bg-rose-500",
                          )}
                        />
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {f.decision === "APPROVED" ? "Approved" : "Rejected"}
                          </span>
                          {f.mentor?.name && <span>by {f.mentor.name}</span>}
                          {f.createdAt && <span>· {formatDateTime(f.createdAt)}</span>}
                        </div>
                        {f.comment && (
                          <p className="mt-1 flex gap-1.5 text-sm">
                            <MessageSquareIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            {f.comment}
                          </p>
                        )}
                      </motion.li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            {s.status === "PENDING" && (
              <DialogFooter>
                <Button variant="destructive" onClick={() => review("REJECTED")}>
                  <XIcon />
                  Reject
                </Button>
                <Button onClick={() => review("APPROVED")}>
                  <CheckIcon />
                  Approve
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
