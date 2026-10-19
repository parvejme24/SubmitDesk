import type { Metadata } from "next";
import { Suspense } from "react";
import { MentorDashboard } from "@/components/mentor/mentor-dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "./dashboard-skeleton";

export const metadata: Metadata = { title: "Mentor dashboard" };

export default function MentorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mentor workspace"
        title="Review dashboard"
        description="Approve or reject student project submissions."
      />
      {/* MentorDashboard reads the URL (useSearchParams), so it renders behind a Suspense boundary */}
      <Suspense fallback={<DashboardSkeleton />}>
        <MentorDashboard />
      </Suspense>
    </div>
  );
}
