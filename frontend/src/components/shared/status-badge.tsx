import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/types";

export const statusStyles: Record<
  SubmissionStatus,
  { label: string; badge: string; accent: string; Icon: typeof ClockIcon }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300",
    accent: "from-amber-400 to-orange-400",
    Icon: ClockIcon,
  },
  APPROVED: {
    label: "Approved",
    badge: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300",
    accent: "from-emerald-400 to-teal-400",
    Icon: CheckCircle2Icon,
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-rose-500/12 text-rose-700 ring-1 ring-rose-500/25 dark:text-rose-300",
    accent: "from-rose-400 to-pink-400",
    Icon: XCircleIcon,
  },
};

export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  const { label, badge, Icon } = statusStyles[status];
  return (
    <Badge className={cn("h-6 px-2.5", badge, className)}>
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  );
}
