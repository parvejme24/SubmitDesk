import type { Metadata } from "next";
import { SubmissionForm } from "@/components/student/submission-form";

export const metadata: Metadata = { title: "Submit a project" };

// Server Component shell: static heading only. The form is the Client Component.
export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Submit a project</h1>
        <p className="text-sm text-muted-foreground">
          A mentor will review it and leave feedback. Make sure the repository is public.
        </p>
      </div>
      <SubmissionForm />
    </div>
  );
}
