import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Greeting } from "@/components/shared/greeting";
import { PageHeader } from "@/components/shared/page-header";
import { MySubmissionsList } from "@/components/student/my-submissions-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "My submissions" };

export default function StudentHome() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<Greeting fallback="Student portal" />}
        title="My submissions"
        description="Track the review status of your projects."
        action={
          <Link href="/student/submit" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
            <PlusIcon />
            New submission
          </Link>
        }
      />
      <MySubmissionsList />
    </div>
  );
}
