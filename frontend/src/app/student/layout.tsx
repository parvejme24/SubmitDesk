import { Navbar } from "@/components/shared/navbar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar area="student" />
      {/* extra bottom padding on phones for the bottom tab bar */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-28 sm:px-6 sm:pb-12">{children}</main>
    </>
  );
}
