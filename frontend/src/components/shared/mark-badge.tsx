import { cn } from "@/lib/utils";

export const MARK_MAX = 100;

/** Tone by band; the number itself always carries the meaning, so color is only a hint. */
const tone = (mark: number) =>
  mark >= 80
    ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
    : mark >= 50
      ? "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300"
      : "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300";

/** "85/100". Renders nothing for reviews made before marks existed. */
export function MarkBadge({ mark, className }: { mark: number | null | undefined; className?: string }) {
  if (mark == null) return null;
  return (
    <span
      title={`Mark: ${mark} out of ${MARK_MAX}`}
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold tabular-nums ring-1",
        tone(mark),
        className,
      )}
    >
      <span className="sr-only">Mark: </span>
      {mark}
      <span className="font-normal opacity-70">/{MARK_MAX}</span>
    </span>
  );
}
