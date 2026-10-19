import { FadeIn } from "@/components/motion/primitives";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh place-items-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <FadeIn className="flex w-full max-w-sm flex-col items-center gap-6">
        <Logo href="/login" />
        {children}
      </FadeIn>
    </div>
  );
}
