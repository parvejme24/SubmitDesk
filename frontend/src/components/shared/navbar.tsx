"use client";

import {
  FilePlus2Icon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LogOutIcon,
  MailIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useLogout, useMe } from "@/hooks/use-auth";
import type { User } from "@/types";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavLink = { href: string; label: string; icon: LucideIcon };

// Defined here (not passed from a Server Component) because icons are functions.
const LINKS: Record<"student" | "mentor", NavLink[]> = {
  student: [
    { href: "/student", label: "My submissions", icon: LayoutGridIcon },
    { href: "/student/submit", label: "Submit project", icon: FilePlus2Icon },
  ],
  mentor: [
    { href: "/mentor", label: "Review dashboard", icon: LayoutDashboardIcon },
    { href: "/mentor/students", label: "Students", icon: UsersIcon },
  ],
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function Navbar({ area }: { area: "student" | "mentor" }) {
  const links = LINKS[area];
  const { data: user, isPending } = useMe();
  const pathname = usePathname();

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 px-3 pt-3 sm:px-4"
      >
        {/* 3 columns: logo | centered menu | actions */}
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl glass-strong px-3 sm:px-4">
          <div className="justify-self-start">
            <Logo href={user?.role === "MENTOR" ? "/mentor" : "/student"} />
          </div>

          <nav aria-label="Main" className="hidden h-full items-center gap-6 sm:flex">
            {links.map((l) => (
              <NavItem key={l.href} link={l} active={pathname === l.href} />
            ))}
          </nav>

          <div className="col-start-3 flex items-center gap-2 justify-self-end sm:gap-3">
            <ThemeToggle />
            {isPending ? <Skeleton className="size-9 rounded-full" /> : user ? <UserMenu user={user} /> : null}
          </div>
        </div>
      </motion.header>

      {/* Phone: bottom tab bar, easy to reach with a thumb */}
      {links.length > 1 && (
        <nav aria-label="Main" className="fixed inset-x-3 bottom-3 z-40 flex h-16 rounded-2xl glass-strong pb-[env(safe-area-inset-bottom)] sm:hidden">
          {links.map((l) => (
            <NavItem key={l.href} link={l} active={pathname === l.href} mobile />
          ))}
        </nav>
      )}
    </>
  );
}

/** Plain menu item; the active one gets an underline that slides between items. */
function NavItem({ link, active, mobile }: { link: NavLink; active: boolean; mobile?: boolean }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-full items-center text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground",
        mobile && "flex-1 flex-col justify-center gap-1 text-xs",
        active && "text-foreground",
      )}
    >
      {mobile && <Icon className={cn("size-5 transition-colors duration-300", active && "text-primary")} />}
      {link.label}
      {active && (
        <motion.span
          layoutId={mobile ? "nav-underline-mobile" : "nav-underline"}
          className={cn(
            "absolute rounded-full bg-gradient-primary",
            mobile ? "inset-x-6 top-0 h-0.5" : "inset-x-0 bottom-0 h-0.5",
          )}
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
        />
      )}
    </Link>
  );
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-white shadow-md ring-2 ring-white/70 dark:ring-white/10",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

function UserMenu({ user }: { user: User }) {
  const logout = useLogout();
  const role = user.role === "MENTOR" ? "Mentor" : "Student";
  const home = user.role === "MENTOR" ? "/mentor" : "/student";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        title={user.name}
        className="flex cursor-pointer rounded-full transition-transform outline-none hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:ring-3 data-popup-open:ring-primary/30"
      >
        <Avatar name={user.name} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-72 p-2">
        <div className="flex items-center gap-3 rounded-lg bg-primary/6 p-3">
          <Avatar name={user.name} className="size-11 text-sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <Badge className="mt-1 h-5 bg-primary/12 text-primary">{role}</Badge>
          </div>
        </div>
        <p className="flex items-center gap-2 px-3 pt-2.5 pb-1 text-xs text-muted-foreground">
          <MailIcon className="size-3.5 shrink-0" />
          <span className="truncate">{user.email}</span>
        </p>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem render={<Link href={home} />} className="cursor-pointer gap-2.5 py-2">
          <LayoutDashboardIcon />
          {user.role === "MENTOR" ? "Review dashboard" : "My submissions"}
        </DropdownMenuItem>
        {user.role === "MENTOR" && (
          <DropdownMenuItem render={<Link href="/mentor/students" />} className="cursor-pointer gap-2.5 py-2">
            <UsersIcon />
            Students
          </DropdownMenuItem>
        )}
        {user.role === "STUDENT" && (
          <DropdownMenuItem render={<Link href="/student/submit" />} className="cursor-pointer gap-2.5 py-2">
            <FilePlus2Icon />
            Submit a project
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="cursor-pointer gap-2.5 py-2"
        >
          {logout.isPending ? <Spinner /> : <LogOutIcon />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
