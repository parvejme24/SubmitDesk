import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  FilterIcon,
  FolderGit2Icon,
  GraduationCapIcon,
  MessageSquareTextIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/primitives";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

// proxy.ts sends logged-in users straight to their dashboard, so only visitors see this page.

type Role = {
  title: string;
  icon: LucideIcon;
  tile: string;
  points: string[];
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
};

const roles: Role[] = [
  {
    title: "For students",
    icon: GraduationCapIcon,
    tile: "from-indigo-500 to-violet-500",
    points: [
      "Submit your GitHub repo and live site in one form",
      "Follow each project from pending to a decision",
      "Read mentor feedback and resubmit after a fix",
    ],
    primary: { href: "/signup", label: "Create student account" },
    secondary: { href: "/login", label: "Student log in" },
  },
  {
    title: "For mentors",
    icon: ShieldCheckIcon,
    tile: "from-emerald-400 to-teal-500",
    points: [
      "See every submission in one paginated table",
      "Filter by status and search by project name",
      "Approve or reject with written feedback",
    ],
    primary: { href: "/login", label: "Mentor log in" },
  },
];

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: SendIcon, title: "Submit", text: "A student shares the project name, repo, live link and a short description." },
  { icon: MessageSquareTextIcon, title: "Review", text: "A mentor opens the details, checks the links and leaves feedback." },
  { icon: CheckCircle2Icon, title: "Decide", text: "The project is approved, or rejected with a reason so it can be fixed." },
];

const features: { icon: LucideIcon; label: string }[] = [
  { icon: FolderGit2Icon, label: "One repo, one submission" },
  { icon: FilterIcon, label: "Server-side filters" },
  { icon: BarChart3Icon, label: "Live review stats" },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl glass-strong px-3 sm:px-4">
          <Logo href="/" />
          <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Log in
            </Link>
            <Link href="/signup" className={buttonVariants({ className: "hidden sm:inline-flex" })}>
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pt-14 pb-16 outline-none sm:px-6 sm:pt-20">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary">
            <SparklesIcon className="size-3.5" aria-hidden />
            Project reviews, without the spreadsheet
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Submit projects. <span className="text-gradient">Get real feedback.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
            SubmitDesk connects students and mentors: one place to hand in a project, review it, and see the decision.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "h-11 px-5" })}>
              Get started as a student
              <ArrowRightIcon aria-hidden />
            </Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline", className: "h-11 px-5" })}>
              Log in
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="size-4 text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </FadeIn>

        <section aria-labelledby="roles-heading" className="mt-20">
          <h2 id="roles-heading" className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Pick your role
          </h2>
          <Stagger className="mt-8 grid gap-4 md:grid-cols-2">
            {roles.map((r) => (
              <StaggerItem key={r.title} className="flex flex-col rounded-3xl glass p-6 sm:p-8">
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg ${r.tile}`}
                >
                  <r.icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{r.title}</h3>
                <ul className="mt-4 flex-1 space-y-3">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm text-muted-foreground sm:text-base">
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary sm:mt-1" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link href={r.primary.href} className={buttonVariants({ size: "lg", className: "sm:flex-1" })}>
                    {r.primary.label}
                  </Link>
                  {r.secondary && (
                    <Link
                      href={r.secondary.href}
                      className={buttonVariants({ size: "lg", variant: "outline", className: "sm:flex-1" })}
                    >
                      {r.secondary.label}
                    </Link>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section aria-labelledby="how-heading" className="mt-20">
          <h2 id="how-heading" className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <StaggerItem key={s.title} className="rounded-2xl glass p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">
        SubmitDesk · Project submissions and mentor reviews
      </footer>
    </div>
  );
}
