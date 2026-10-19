"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSubmission, useResubmit } from "@/hooks/use-submissions";
import { ApiError, applyServerErrors } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DESCRIPTION_MAX, submissionFields, submissionSchema, type SubmissionValues } from "@/schemas/submission";
import type { Submission } from "@/types";

type Props = {
  /** When given, the form edits this rejected submission and resubmits it. */
  resubmit?: Submission;
  onDone?: () => void;
};

export function SubmissionForm({ resubmit, onDone }: Props) {
  const router = useRouter();
  const create = useCreateSubmission();
  const update = useResubmit();
  const mutation = resubmit ? update : create;

  const form = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema),
    mode: "onTouched",
    defaultValues: {
      projectName: resubmit?.projectName ?? "",
      repoUrl: resubmit?.repoUrl ?? "",
      liveUrl: resubmit?.liveUrl ?? "",
      description: resubmit?.description ?? "",
    },
  });

  const onError = (e: Error) => {
    if (!(e instanceof ApiError)) return toast.error(e.message);
    if (e.status === 409) {
      form.setError("repoUrl", { type: "server", message: "This repository has already been submitted" });
      return;
    }
    if (e.status === 400 && applyServerErrors(e, form.setError, submissionFields)) return;
    toast.error(e.message); // 429 rate limit, 403, 5xx...
  };

  const onSubmit = form.handleSubmit((values) => {
    if (resubmit) {
      update.mutate(
        { id: resubmit.id, values },
        {
          onSuccess: () => {
            toast.success("Project resubmitted for review");
            onDone?.();
          },
          onError,
        },
      );
    } else {
      create.mutate(values, {
        onSuccess: () => {
          toast.success("Project submitted! A mentor will review it soon.");
          form.reset();
          router.push("/student");
        },
        onError,
      });
    }
  });

  const descriptionLength = useWatch({ control: form.control, name: "description" })?.length ?? 0;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup>
        <Controller
          name="projectName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="projectName">Project name</FieldLabel>
              <Input {...field} id="projectName" placeholder="Weather Dashboard" aria-invalid={fieldState.invalid} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="repoUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="repoUrl">GitHub repository URL</FieldLabel>
              <Input
                {...field}
                id="repoUrl"
                type="url"
                inputMode="url"
                placeholder="https://github.com/username/repo"
                aria-invalid={fieldState.invalid}
              />
              {!fieldState.invalid && <FieldDescription>Each repository can only be submitted once.</FieldDescription>}
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="liveUrl"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="liveUrl">Live site URL</FieldLabel>
              <Input
                {...field}
                id="liveUrl"
                type="url"
                inputMode="url"
                placeholder="https://my-project.vercel.app"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-baseline justify-between">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <span
                  className={cn(
                    "text-xs tabular-nums text-muted-foreground",
                    descriptionLength > DESCRIPTION_MAX && "text-destructive",
                  )}
                >
                  {descriptionLength}/{DESCRIPTION_MAX}
                </span>
              </div>
              <Textarea
                {...field}
                id="description"
                rows={5}
                placeholder="What does the project do? Which features and technologies did you use?"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {resubmit && (
          <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
            Cancel
          </Button>
        )}
        {/* Disabled while pending → a double click can't create two submissions */}
        <Button type="submit" size="lg" disabled={mutation.isPending} className="w-full sm:w-auto">
          {mutation.isPending && <Spinner />}
          {mutation.isPending ? "Submitting..." : resubmit ? "Resubmit for review" : "Submit project"}
        </Button>
      </div>
    </form>
  );
}
