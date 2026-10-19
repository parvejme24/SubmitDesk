"use client";

import { motion } from "motion/react";

const blobs = [
  {
    color: "var(--blob-1)",
    className: "-top-40 -left-32 size-[34rem]",
    x: [0, 60, -20, 0],
    y: [0, 40, 80, 0],
    duration: 26,
  },
  {
    color: "var(--blob-2)",
    className: "top-1/4 -right-40 size-[30rem]",
    x: [0, -50, 20, 0],
    y: [0, 60, -30, 0],
    duration: 30,
  },
  {
    color: "var(--blob-3)",
    className: "-bottom-48 left-1/4 size-[32rem]",
    x: [0, 40, -40, 0],
    y: [0, -50, 10, 0],
    duration: 34,
  },
  { color: "var(--blob-4)", className: "top-2/3 -left-24 size-[22rem]", x: [0, 30, 0], y: [0, -30, 0], duration: 22 },
];

/** Soft, slowly drifting gradient blobs behind every page. Purely decorative. */
export function AppBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${b.className}`}
          style={{ background: `radial-gradient(circle at center, ${b.color}, transparent 70%)` }}
          animate={{ x: b.x, y: b.y }}
          transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* faint dot grid for texture */}
      <div className="absolute inset-0 bg-[radial-gradient(oklch(0.5_0.05_272/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
    </div>
  );
}
