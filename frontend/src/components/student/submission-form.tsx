"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSubmission, useUpdateSubmission } from "@/hooks/use-submissions";
import { ApiError, applyServerErrors } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DESCRIPTION_MAX, submissionFields, submissionSchema, type SubmissionValues } from "@/schemas/submission";
import type { Submission } from "@/types";

type Props = {
  /** When given, the form edits this submission (a REJECTED one is resubmitted for review). */
  editing?: Submission;
  onDone?: () => void;
};

const inputs: {
  name: "projectName" | "repoUrl" | "liveUrl";
  label: string;
  placeholder: string;
  hint?: string;
  url?: boolean;
}[] = [
  { name: "projectName", label: "Project name", placeholder: "Weather Dashboard" },
  {
    name: "repoUrl",
    label: "GitHub repository",
    placeholder: "https://github.com/username/repo",
    hint: "Each repository can be submitted once.",
    url: true,
  },
  { name: "liveUrl", label: "Live site", placeholder: "https://my-project.vercel.app", url: true },
];

export function SubmissionForm({ editing, onDone }: Props) {
  const router = useRouter();
  const create = useCreateSubmission();
  const update = useUpdateSubmission();
  const mutation = editing ? update : create;
  const resubmitting = editing?.status === "REJECTED";

  const form = useForm<SubmissionValues>({
    resolver: zodResolver(submissionSchema),
    mode: "onTouched",
    defaultValues: {
      projectName: editing?.projectName ?? "",
      repoUrl: editing?.repoUrl ?? "",
      liveUrl: editing?.liveUrl ?? "",
      description: editing?.description ?? "",
    },
  });

  const onError = (e: Error) => {
    if (!(e instanceof ApiError)) return toast.error(e.message);
    if (e.status === 409 && e.message.includes("repository")) {
      form.setError("repoUrl", { type: "server", message: e.message }, { shouldFocus: true });
      return;
    }
    if (e.status === 400 && applyServerErrors(e, form.setError, submissionFields)) return;
    toast.error(e.message); // 429 rate limit, 403, 409 already reviewed, 5xx...
  };

  const onSubmit = form.handleSubmit((values) => {
    if (editing) {
      update.mutate(
        { id: editing.id, values },
        {
          onSuccess: () => {
            toast.success(resubmitting ? "Project resubmitted for review" : "Submission updated");
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

  const label = mutation.isPending
    ? "Saving..."
    : resubmitting
      ? "Resubmit for review"
      : editing
        ? "Save changes"
        : "Submit project";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup>
        {inputs.map((config) => (
          <TextInput key={config.name} control={form.control} config={config} />
        ))}
        <DescriptionInput control={form.control} />
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {editing && (
          <Button type="button" variant="ghost" onClick={onDone} disabled={mutation.isPending}>
            Cancel
          </Button>
        )}
        {/* Disabled while pending → a double click can't create two submissions */}
        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
          {mutation.isPending && <Spinner />}
          {label}
        </Button>
      </div>
    </form>
  );
}

function TextInput({ control, config }: { control: Control<SubmissionValues>; config: (typeof inputs)[number] }) {
  const { name, label, placeholder, hint, url } = config;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...field}
            id={name}
            type={url ? "url" : "text"}
            inputMode={url ? "url" : undefined}
            required
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            aria-describedby={hint ? `${name}-hint` : undefined}
          />
          {hint && !fieldState.invalid && <FieldDescription id={`${name}-hint`}>{hint}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function DescriptionInput({ control }: { control: Control<SubmissionValues> }) {
  const length = useWatch({ control, name: "description" })?.trim().length ?? 0;
  return (
    <Controller
      name="description"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            {...field}
            id="description"
            rows={5}
            required
            placeholder="What does it do, and what did you build it with?"
            aria-invalid={fieldState.invalid}
            aria-describedby="description-hint"
          />
          {!fieldState.invalid && (
            <FieldDescription id="description-hint" className="flex justify-between gap-4">
              <span>At least 20 characters.</span>
              <span className={cn("tabular-nums", length > DESCRIPTION_MAX && "text-destructive")}>
                {length}/{DESCRIPTION_MAX}
              </span>
            </FieldDescription>
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
