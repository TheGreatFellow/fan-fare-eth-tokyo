"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import { DropCard } from "@/components/drop-card";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const up = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease },
  });
  return (
    <section className="relative overflow-hidden">
      {/* Giant outlined 公平 ("fair") behind everything. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[-6vw] -translate-y-1/2 select-none font-jp text-[38vw] leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,91,31,0.14)] md:text-[26vw]"
        initial={reduce ? false : { opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease }}
      >
        公平
      </motion.div>
      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-12 px-4 py-12 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:px-8 md:py-16">
        <div>
          <motion.div {...up(0)} className="hud !text-accent">
            Proof-of-Fan Clearing
          </motion.div>
          <motion.h1 {...up(0.08)} className="mt-5 font-display text-[clamp(3.2rem,8vw,6.5rem)] uppercase leading-[0.92] tracking-wide">
            Fans pay <span className="font-jp normal-case text-fan">定価</span>.
            <br />
            Scalpers get <span className="text-accent">nothing</span>.
          </motion.h1>
          <motion.p {...up(0.18)} className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2">
            Limited drops with one sealed bid per verified human, fan units raffled at 定価, and one fair price for the rest.
          </motion.p>
          <motion.div {...up(0.28)} className="mt-9 flex flex-wrap gap-3">
            <Link href="/auction" className="btn btn-primary group text-base">
              Enter the drop <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#how" className="btn btn-ghost text-base">
              How it works <ArrowDown size={18} />
            </a>
          </motion.div>
        </div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 40, rotate: 4 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease }}
          className="mx-auto w-full max-w-[22rem]"
        >
          <DropCard />
        </motion.div>
      </div>
    </section>
  );
}
