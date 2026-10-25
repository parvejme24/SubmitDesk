import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentsDirectory } from "@/components/mentor/students-directory";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mentor workspace"
        title="Students"
        description="Every student, their submissions and their average mark."
      />
      {/* StudentsDirectory reads the URL (useSearchParams), so it renders behind a Suspense boundary */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <StudentsDirectory />
      </Suspense>
    </div>
  );
}
