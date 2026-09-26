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

/** A section title in the anime title-card style: a big kanji behind a condensed headline. */
export function TitleCard({ kanji, title, children }: { kanji: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="relative">
      <div aria-hidden className="pointer-events-none absolute -top-10 -left-2 select-none font-jp text-[clamp(6rem,16vw,12rem)] leading-none text-white/[0.04]">
        {kanji}
      </div>
      <h2 className="relative max-w-[18ch] font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.95] tracking-wide">{title}</h2>
      {children && <div className="relative mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-2">{children}</div>}
    </Reveal>
  );
}
