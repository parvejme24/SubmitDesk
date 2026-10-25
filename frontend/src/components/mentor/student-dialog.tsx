"use client";

import { ExternalLinkIcon, FolderGit2Icon, MailIcon } from "lucide-react";
import { MarkBadge } from "@/components/shared/mark-badge";
import { QueryError } from "@/components/shared/query-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudent } from "@/hooks/use-mentor";
import { formatDate } from "@/lib/format";
import { CountsLine } from "./students-directory";

const linkClass = "inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline";

/** One student: summary plus every submission with its current mark and feedback. */
export function StudentDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isPending, isError, error, refetch } = useStudent(id);

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] grid-cols-1 overflow-x-hidden overflow-y-auto *:min-w-0 sm:max-w-xl">
        {isError ? (
          <>
            <DialogTitle className="sr-only">Student</DialogTitle>
            <QueryError message={error.message} onRetry={() => refetch()} />
          </>
        ) : isPending || !data ? (
          <>
            <DialogTitle className="sr-only">Loading student</DialogTitle>
            <div className="space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 text-lg">{data.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <MailIcon className="size-3.5" aria-hidden />
                {data.email} · joined {formatDate(data.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 rounded-xl bg-primary/6 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Submissions</p>
                <div className="mt-1">
                  <CountsLine counts={data.counts} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average mark</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {data.averageMark ?? "—"}
                  {data.averageMark != null && <span className="text-sm font-normal text-muted-foreground">/100</span>}
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Projects</h4>
              {data.submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.submissions.map((s) => {
                    const latest = s.status !== "PENDING" ? s.feedbacks[0] : undefined;
                    return (
                      <li key={s.id} className="rounded-xl border border-border/60 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{s.projectName}</p>
                            <p className="text-xs text-muted-foreground">Submitted {formatDate(s.createdAt)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <MarkBadge mark={latest?.mark} />
                            <StatusBadge status={s.status} />
                          </div>
                        </div>
                        {latest?.comment && (
                          <p className="mt-2 text-sm wrap-break-word text-muted-foreground">“{latest.comment}”</p>
                        )}
                        <div className="mt-2 flex gap-3">
                          <a href={s.repoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                            <FolderGit2Icon className="size-3.5" aria-hidden />
                            Repo
                          </a>
                          <a href={s.liveUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                            <ExternalLinkIcon className="size-3.5" aria-hidden />
                            Live
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
