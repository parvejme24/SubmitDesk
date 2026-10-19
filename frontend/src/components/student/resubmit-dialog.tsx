"use client";

import { RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Submission } from "@/types";
import { SubmissionForm } from "./submission-form";

export function ResubmitDialog({ submission }: { submission: Submission }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <RotateCcwIcon />
        Fix & resubmit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resubmit project</DialogTitle>
            <DialogDescription>
              Update your project based on the feedback. It goes back to pending review.
            </DialogDescription>
          </DialogHeader>
          {open && <SubmissionForm resubmit={submission} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
