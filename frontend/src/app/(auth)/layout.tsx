import { CheckCircle2Icon, GraduationCapIcon, ShieldCheckIcon } from "lucide-react";
import { FadeIn } from "@/components/motion/primitives";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const roles = [
  {
    icon: GraduationCapIcon,
    title: "Students",
    text: "Submit projects, track their status and read mentor feedback.",
    tile: "from-indigo-500 to-violet-500",
  },
  {
    icon: ShieldCheckIcon,
    title: "Mentors",
    text: "Review submissions, filter by status and approve or reject.",
    tile: "from-emerald-400 to-teal-500",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel: desktop only, purely informational */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
        <Logo href="/" />
        <FadeIn className="max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-balance">
              One desk for every <span className="text-gradient">project review.</span>
            </h2>
            <p className="text-muted-foreground">Log in with your role and pick up where you left off.</p>
          </div>
          <ul className="space-y-3">
            {roles.map((r) => (
              <li key={r.title} className="flex gap-4 rounded-2xl glass p-4">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg ${r.tile}`}
                >
                  <r.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </FadeIn>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2Icon className="size-4 text-primary" aria-hidden />
          Sign in with one click as a mentor or a student.
        </p>
      </aside>

      <main
        id="main"
        tabIndex={-1}
        className="relative grid place-items-center px-4 py-16 outline-none lg:border-l lg:border-border/60"
      >
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <FadeIn className="flex w-full max-w-sm flex-col items-center gap-6">
          <div className="lg:hidden">
            <Logo href="/" />
          </div>
          {children}
        </FadeIn>
      </main>
    </div>
  );
}
