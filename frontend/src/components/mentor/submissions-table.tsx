"use client";

import { CalendarIcon, CheckIcon, ExternalLinkIcon, FolderGit2Icon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { easeOut } from "@/components/motion/primitives";
import { StatusBadge, statusStyles } from "@/components/shared/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MentorSubmission } from "@/types";
import type { ReviewTarget } from "./review-dialog";

const MotionRow = motion.create(TableRow);

const linkClass = "inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline";

type Props = { items: MentorSubmission[]; onReview: (t: NonNullable<ReviewTarget>) => void };

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function StudentCell({ student }: { student: MentorSubmission["student"] }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
        {initials(student.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{student.name}</p>
        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
      </div>
    </div>
  );
}

function Actions({ s, onReview, full }: { s: MentorSubmission; onReview: Props["onReview"]; full?: boolean }) {
  if (s.status !== "PENDING") {
    return (
      <span className="text-xs text-muted-foreground">
        Reviewed{s.reviewedBy ? ` by ${s.reviewedBy.name}` : ""}
        {s.reviewedAt ? ` · ${formatDate(s.reviewedAt)}` : ""}
      </span>
    );
  }
  return (
    <div className={cn("flex gap-2", full ? "w-full" : "justify-end")}>
      <Button
        size="sm"
        className={cn(full && "flex-1")}
        onClick={() => onReview({ submission: s, decision: "APPROVED" })}
      >
        <CheckIcon />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className={cn(full && "flex-1")}
        onClick={() => onReview({ submission: s, decision: "REJECTED" })}
      >
        <XIcon />
        Reject
      </Button>
    </div>
  );
}

/** Table on tablets/desktops, card list on phones. */
export function SubmissionsTable({ items, onReview }: Props) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl glass md:block">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="border-b border-border/60 hover:bg-transparent">
                <TableHead className="pl-5">Project</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Links</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="pr-5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false} mode="popLayout">
                {items.map((s, i) => (
                  <MotionRow
                    key={s.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut, delay: i * 0.025 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="border-border/50 hover:bg-primary/4"
                  >
                    <TableCell className="max-w-56 py-3.5 pl-5">
                      <p className="truncate font-medium" title={s.projectName}>
                        {s.projectName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={s.description}>
                        {s.description}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-52">
                      <StudentCell student={s.student} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <a href={s.repoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          <FolderGit2Icon className="size-3.5" />
                          Repo
                        </a>
                        <a href={s.liveUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          <ExternalLinkIcon className="size-3.5" />
                          Live
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" title={formatDateTime(s.createdAt)}>
                      {formatDate(s.createdAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Actions s={s} onReview={onReview} />
                    </TableCell>
                  </MotionRow>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((s, i) => (
            <motion.article
              key={s.id}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut, delay: i * 0.03 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="relative overflow-hidden rounded-2xl glass p-4"
            >
              <div className={cn("absolute inset-y-0 left-0 w-1 bg-linear-to-b", statusStyles[s.status].accent)} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{s.projectName}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="size-3" />
                    {formatDate(s.createdAt)}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-3">
                <StudentCell student={s.student} />
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={s.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
                >
                  <FolderGit2Icon />
                  Repo
                </a>
                <a
                  href={s.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
                >
                  <ExternalLinkIcon />
                  Live
                </a>
              </div>
              <div className="mt-3 border-t border-border/60 pt-3">
                <Actions s={s} onReview={onReview} full />
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
