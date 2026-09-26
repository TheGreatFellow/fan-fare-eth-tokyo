"use client";

import { motion } from "motion/react";
import { PHASES } from "@/lib/use-auction";

const STEPS = [
  { jp: "入札", en: "Sealed bidding" },
  { jp: "開封", en: "Reveal" },
  { jp: "確定", en: "Settled" },
];

/** Where the auction is. During the reveal, a bar fills until the maker may settle. */
export function PhaseTrack({ phase, revealLeft, revealTotal }: { phase: (typeof PHASES)[number]; revealLeft: number; revealTotal: number }) {
  const at = PHASES.indexOf(phase);
  return (
    <ol className="grid grid-cols-3 gap-1.5">
      {STEPS.map((s, i) => {
        const done = i < at;
        const live = i === at;
        return (
          <li key={s.en} className={`relative overflow-hidden border px-3 py-2.5 ${live ? "border-accent bg-accent/10" : "border-line bg-panel"}`}>
            {live && i === 1 && revealTotal > 0 && (
              <motion.div
                className="absolute inset-y-0 left-0 w-full origin-left bg-accent/15"
                initial={false}
                animate={{ scaleX: 1 - revealLeft / revealTotal }}
                transition={{ duration: 1, ease: "linear" }}
              />
            )}
            <div className="relative flex items-baseline gap-2">
              <span className={`font-jp text-lg ${live ? "text-accent" : done ? "text-ink-2" : "text-ink-3"}`}>{s.jp}</span>
              <span className={`truncate text-xs ${live ? "text-ink" : "text-ink-3"}`}>{s.en}</span>
            </div>
            {live && i === 1 && (
              <div className="relative mt-0.5 font-mono text-xs tabular text-ink-2">{revealLeft > 0 ? `settle unlocks in ${revealLeft}s` : "settle unlocked"}</div>
            )}
            {live && i !== 1 && <div className="relative mt-0.5 font-mono text-xs text-ink-2">{i === 0 ? "open now" : "final"}</div>}
            {done && <div className="relative mt-0.5 font-mono text-xs text-ink-3">done</div>}
          </li>
        );
      })}
    </ol>
  );
}
