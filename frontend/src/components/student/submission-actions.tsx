"use client";

import { LockIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteSubmission } from "@/hooks/use-submissions";
import type { Submission } from "@/types";
import { SubmissionForm } from "./submission-form";

/** Edit + delete for a student's own submission. APPROVED projects are final, so they're locked. */
export function SubmissionActions({ submission }: { submission: Submission }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (submission.status === "APPROVED") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LockIcon className="size-3.5" aria-hidden />
        Approved projects are locked
      </p>
    );
  }

  const rejected = submission.status === "REJECTED";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setDeleting(true)}
        aria-label={`Delete ${submission.projectName}`}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2Icon />
        Delete
      </Button>
      <Button
        size="sm"
        variant={rejected ? "default" : "outline"}
        onClick={() => setEditing(true)}
        aria-label={`${rejected ? "Fix and resubmit" : "Edit"} ${submission.projectName}`}
      >
        {rejected ? <RotateCcwIcon /> : <PencilIcon />}
        {rejected ? "Fix & resubmit" : "Edit"}
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{rejected ? "Resubmit project" : "Edit project"}</DialogTitle>
            <DialogDescription>
              {rejected ? "It goes back to pending review." : "It stays in the review queue."}
            </DialogDescription>
          </DialogHeader>
          {editing && <SubmissionForm editing={submission} onDone={() => setEditing(false)} />}
        </DialogContent>
      </Dialog>

      <DeleteDialog submission={submission} open={deleting} onOpenChange={setDeleting} />
    </div>
  );
}

function DeleteDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const remove = useDeleteSubmission();

  const confirm = () =>
    remove.mutate(submission.id, {
      onSuccess: () => {
        toast.success("Submission deleted");
        onOpenChange(false);
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !remove.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this submission?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{submission.projectName}</span> and its review history will
            be removed for good. You can submit the same repository again later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending ? <Spinner /> : <Trash2Icon />}
            {remove.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
