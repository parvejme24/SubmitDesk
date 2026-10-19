"use client";

import { motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StatusFilter as Status } from "@/types";

const options: { value: Status; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function StatusFilter({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Status)} className="w-full md:w-auto">
      <TabsList className="w-full md:w-auto">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <TabsTrigger
              key={o.value}
              value={o.value}
              className="relative z-0 px-2 transition-colors duration-300 data-active:border-transparent data-active:bg-transparent data-active:text-white data-active:shadow-none sm:px-4 dark:data-active:border-transparent dark:data-active:bg-transparent dark:data-active:text-white"
            >
              {active && (
                // Shared layoutId → the pill glides from the old tab to the new one
                <motion.span
                  layoutId="status-tab-pill"
                  className="absolute inset-0 -z-10 rounded-lg bg-gradient-primary shadow-[0_6px_16px_-6px_oklch(0.55_0.19_281/0.65)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
                />
              )}
              <span className={active ? "text-white" : undefined}>{o.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
