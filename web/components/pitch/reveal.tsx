"use client";

import { motion, useReducedMotion } from "motion/react";

/** Fades a block up as it enters the viewport, once. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** A section title in the anime title-card style: a big kanji behind a condensed headline.
 *  `compact` is for sections that must fit on one screen with their visual. */
export function TitleCard({ kanji, title, children, compact }: { kanji: string; title: React.ReactNode; children?: React.ReactNode; compact?: boolean }) {
  return (
    <Reveal className="relative">
      <div aria-hidden className="pointer-events-none absolute -top-10 -left-2 select-none font-jp text-[clamp(6rem,16vw,12rem)] leading-none text-white/[0.04]">
        {kanji}
      </div>
      <h2 className={`relative font-display uppercase leading-[0.95] tracking-wide ${compact ? "max-w-[30ch] text-[clamp(2rem,4vw,3.25rem)]" : "max-w-[18ch] text-[clamp(2.5rem,6vw,4.5rem)]"}`}>{title}</h2>
      {children && <div className={`relative leading-relaxed text-ink-2 ${compact ? "mt-3 max-w-[80ch]" : "mt-5 max-w-[62ch] text-lg"}`}>{children}</div>}
    </Reveal>
  );
}
