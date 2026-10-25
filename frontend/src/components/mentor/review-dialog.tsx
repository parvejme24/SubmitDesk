"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm, type Control, type FieldValues, type Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useGrade, useReview } from "@/hooks/use-mentor";
import {
  gradeSchema,
  reviewSchema,
  type GradeInput,
  type GradeValues,
  type ReviewInput,
  type ReviewValues,
} from "@/schemas/review";
import type { MentorSubmission } from "@/types";

export type ReviewTarget = { submission: MentorSubmission; decision: ReviewValues["decision"] } | null;

/** Close on success, and also on 404/409 (someone else changed it; the list refetches). */
const closeAfter = (onClose: () => void) => (_d: unknown, error: unknown) =>
  (!error || [404, 409].includes((error as { status?: number }).status ?? 0)) && onClose();

/** Mark (out of 100) + feedback inputs, shared by both dialogs. */
function MarkFields<T extends FieldValues & { mark: string; comment?: string }, Out extends FieldValues>({
  control,
  markRequired,
  rejected,
}: {
  control: Control<T, unknown, Out>;
  markRequired: boolean;
  rejected: boolean;
}) {
  return (
    <>
      <Controller
        name={"mark" as Path<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="mark">
              Mark {!markRequired && <span className="font-normal text-muted-foreground">(optional)</span>}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                {...field}
                value={field.value ?? ""}
                id="mark"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                required={markRequired}
                autoFocus
                placeholder="—"
                aria-invalid={fieldState.invalid}
                aria-describedby="mark-hint"
                className="w-24 text-lg font-semibold tabular-nums"
              />
              <span className="text-sm text-muted-foreground" aria-hidden>
                / 100
              </span>
            </div>
            {!fieldState.invalid && (
              <FieldDescription id="mark-hint">
                {markRequired ? "A whole number from 0 to 100." : "0 to 100. You can also add it later."}
              </FieldDescription>
            )}
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <Controller
        name={"comment" as Path<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="comment">
              Feedback <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ""}
              id="comment"
              rows={4}
              placeholder={rejected ? "What needs to be fixed?" : "Anything the student should know?"}
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </>
  );
}

/** Step 1: approve or reject, optionally with a mark and feedback right away. */
export function ReviewDialog({ target, onClose }: { target: ReviewTarget; onClose: () => void }) {
  const review = useReview();
  const isReject = target?.decision === "REJECTED";

  const form = useForm<ReviewInput, unknown, ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { decision: "APPROVED", mark: "", comment: "" },
  });

  useEffect(() => {
    if (target) form.reset({ decision: target.decision, mark: "", comment: "" });
  }, [target, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!target) return;
    review.mutate(
      { id: target.submission.id, ...values, comment: values.comment || undefined },
      { onSettled: closeAfter(onClose) },
    );
  });

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && !review.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{isReject ? "Reject project" : "Approve project"}</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{target?.submission.projectName}</span> by{" "}
              {target?.submission.student.name}
            </DialogDescription>
          </DialogHeader>

          <MarkFields control={form.control} markRequired={false} rejected={isReject} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={review.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant={isReject ? "destructive" : "default"} disabled={review.isPending}>
              {review.isPending && <Spinner />}
              {isReject ? "Reject" : "Approve"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Step 2: add or change the mark and feedback of an approved or rejected submission. */
export function GradeDialog({ target, onClose }: { target: MentorSubmission | null; onClose: () => void }) {
  const grade = useGrade();
  const latest = target?.feedbacks[0];

  const form = useForm<GradeInput, unknown, GradeValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { mark: "", comment: "" },
  });

  useEffect(() => {
    if (target) form.reset({ mark: latest?.mark != null ? String(latest.mark) : "", comment: latest?.comment ?? "" });
  }, [target, latest, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!target) return;
    grade.mutate({ id: target.id, ...values }, { onSettled: closeAfter(onClose) });
  });

  const hasMark = latest?.mark != null;

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && !grade.isPending && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{hasMark ? "Edit mark & feedback" : "Add mark & feedback"}</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{target?.projectName}</span> by {target?.student.name} ·{" "}
              {target?.status === "APPROVED" ? "Approved" : "Rejected"}
            </DialogDescription>
          </DialogHeader>

          <MarkFields control={form.control} markRequired rejected={target?.status === "REJECTED"} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={grade.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={grade.isPending}>
              {grade.isPending && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
