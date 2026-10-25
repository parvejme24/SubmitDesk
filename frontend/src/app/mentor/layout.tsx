import { Navbar } from "@/components/shared/navbar";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar area="mentor" />
      <main id="main" tabIndex={-1} className="mx-auto outline-none w-full max-w-6xl flex-1 px-4 pt-8 pb-28 sm:px-6 sm:pb-12">{children}</main>
    </>
  );
}
