"use client";

import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MentorError({ error, retry }: { error: unknown; retry: () => void }) {
  const message = error instanceof Error && error.message ? error.message : "The dashboard failed to load.";

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
      <AlertTriangleIcon className="size-8 text-destructive" />
      <div className="space-y-1">
        <h2 className="font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
