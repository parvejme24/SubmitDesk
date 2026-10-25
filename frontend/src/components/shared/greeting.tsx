"use client";

import { useMe } from "@/hooks/use-auth";

const partOfDay = (hour: number) => (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");

/** "Good morning, Ada" once the user is known; the fallback label until then. */
export function Greeting({ fallback }: { fallback: string }) {
  const { data: user } = useMe();
  if (!user) return <>{fallback}</>;
  return (
    <>
      {partOfDay(new Date().getHours())}, {user.name.split(" ")[0]}
    </>
  );
}
