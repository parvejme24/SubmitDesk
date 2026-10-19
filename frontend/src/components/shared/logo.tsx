import { InboxIcon } from "lucide-react";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex shrink-0 items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-[0_6px_16px_-6px_oklch(0.55_0.19_281/0.7)] transition-transform group-hover:scale-105 group-hover:-rotate-6">
        <InboxIcon className="size-4" />
      </span>
      <span className="text-[1.05rem]">
        Submit<span className="text-gradient">Desk</span>
      </span>
    </Link>
  );
}
