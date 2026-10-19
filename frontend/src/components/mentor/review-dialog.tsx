"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useReview } from "@/hooks/use-mentor";
import { reviewSchema, type ReviewValues } from "@/schemas/review";
import type { MentorSubmission } from "@/types";

export type ReviewTarget = { submission: MentorSubmission; decision: ReviewValues["decision"] } | null;

export function ReviewDialog({ target, onClose }: { target: ReviewTarget; onClose: () => void }) {
  const review = useReview();
  const isReject = target?.decision === "REJECTED";

  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { decision: "APPROVED", comment: "" },
  });

  useEffect(() => {
    if (target) form.reset({ decision: target.decision, comment: "" });
  }, [target, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!target) return;
    review.mutate(
      { id: target.submission.id, ...values },
      {
        onSettled: (_d, error) =>
          (!error || [404, 409].includes((error as { status?: number }).status ?? 0)) && onClose(),
      },
    );
  });

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && !review.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{isReject ? "Reject project" : "Approve project"}</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{target?.submission.projectName}</span> by{" "}
              {target?.submission.student.name}
            </DialogDescription>
          </DialogHeader>

          <Controller
            name="comment"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="comment">
                  Feedback {isReject ? <span className="text-destructive">*</span> : "(optional)"}
                </FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="comment"
                  rows={4}
                  autoFocus
                  placeholder={isReject ? "Explain what needs to be fixed..." : "Nice work! Anything to add?"}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

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
