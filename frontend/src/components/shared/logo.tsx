import Link from "next/link";
import { cn } from "@/lib/utils";

/** The SubmitDesk mark: a check dropping into an inbox tray (submit → reviewed). Same drawing as app/icon.svg. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("size-4", className)}>
      <path
        d="M3 13.5h4.2l1.6 2.6h6.4l1.6-2.6H21v4.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18z"
        fill="currentColor"
        fillOpacity="0.28"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="m7.8 7.4 3 3 5.6-6.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="SubmitDesk home"
      className="group flex shrink-0 items-center gap-2 font-semibold tracking-tight"
    >
      <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-primary text-white shadow-[0_6px_16px_-6px_oklch(0.55_0.19_281/0.7)] ring-1 ring-white/25 transition-transform group-hover:scale-105 group-hover:-rotate-6">
        {/* soft top highlight for depth */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/25 to-transparent" />
        <LogoMark className="relative size-[1.15rem] transition-transform duration-300 group-hover:translate-y-px" />
      </span>
      <span className="text-[1.05rem]">
        Submit<span className="text-gradient">Desk</span>
      </span>
    </Link>
  );
}
