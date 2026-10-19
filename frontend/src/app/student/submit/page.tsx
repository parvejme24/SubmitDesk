import { CheckIcon, ClockIcon, LightbulbIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SubmissionForm } from "@/components/student/submission-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Submit a project" };

const checklist = [
  "Your repository is public on GitHub",
  "The live site loads on mobile and desktop",
  "Your README explains how to run the project",
  "Both links start with https://",
];

// Server Component shell: static title and tips. Only the form is a Client Component,
// because it needs state, events and react-hook-form.
export default function SubmitPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="New submission"
        title="Submit a project"
        description="Share your GitHub repository and live site with a mentor."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="glass-strong">
          <CardContent>
            <SubmissionForm />
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LightbulbIcon className="size-4 text-primary" />
                Before you submit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <CheckIcon className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex gap-3 text-sm">
              <ClockIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
              <p className="text-muted-foreground">
                Each repository can be submitted <span className="font-medium text-foreground">once</span>, and you can
                submit up to <span className="font-medium text-foreground">5 projects per hour</span>.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
