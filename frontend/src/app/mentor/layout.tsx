import { Navbar } from "@/components/shared/navbar";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar area="mentor" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-12 sm:px-6">{children}</main>
    </>
  );
}
