"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Robot, Storefront, User, Wallet } from "@phosphor-icons/react";

/** Runs `steps` on a loop while the element is on screen. Returns the current step. */
function useLoop(steps: number[], ref: React.RefObject<Element | null>) {
  const reduce = useReducedMotion();
  const inView = useInView(ref, { amount: 0.4 });
  const [i, setI] = useState(reduce ? steps.length - 1 : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const t = setTimeout(() => setI((x) => (x + 1) % steps.length), steps[i]);
    return () => clearTimeout(t);
  }, [i, inView, reduce, steps]);
  return i;
}

// ---- The problem: a first-come drop sells out to bots, then reappears at 10x. ----
const SLOTS = 12;
const HUMANS = new Set([3, 9]); // the two fans who got through
const RESALE = [28000, 31500, 36000, 29800, 42000, 33000, 30500, 38800, 27500, 35000, 32000, 40000];
const SELLOUT_STEPS = [900, 1800, 1600, 3800];

export function Sellout() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(SELLOUT_STEPS, ref); // 0 open, 1 rush, 2 sold out, 3 resale
  return (
    <div ref={ref} className="border border-line-strong bg-panel p-5">
      <div className="mb-4 flex items-center justify-between font-mono text-sm">
        <span className="text-ink-2">Limited drop · 12 units · 定価 ¥3,000</span>
        <span className={step >= 1 ? "text-bad" : "text-fan"}>{step === 0 ? "00:00 opens" : step === 1 ? "00:28" : "SOLD OUT 00:30"}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {Array.from({ length: SLOTS }, (_, i) => {
          const human = HUMANS.has(i);
          const filled = step >= 1;
          return (
            <div key={i} className="relative aspect-square overflow-hidden border border-line bg-panel-2">
              <motion.div
                className={`absolute inset-0 grid place-items-center ${human ? "bg-fan/15 text-fan" : "bg-bad/15 text-bad"}`}
                initial={false}
                animate={{ opacity: filled ? 1 : 0, scale: filled ? 1 : 0.6 }}
                transition={{ delay: filled ? i * 0.07 : 0, type: "spring", stiffness: 400, damping: 22 }}
              >
                {human ? <User size={26} weight="bold" /> : <Robot size={26} weight="bold" />}
              </motion.div>
              <motion.div
                className="absolute inset-x-0 bottom-0 bg-bg/85 py-0.5 text-center font-mono text-[11px] tabular"
                initial={false}
                animate={{ opacity: step === 3 && !human ? 1 : 0, y: step === 3 && !human ? 0 : 12 }}
                transition={{ delay: step === 3 ? i * 0.05 : 0 }}
              >
                <span className="text-bad">¥{RESALE[i].toLocaleString("ja-JP")}</span>
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-6 font-mono text-sm">
        <AnimatePresence mode="wait">
          {step >= 2 && (
            <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={step === 3 ? "text-bad" : "text-ink-2"}>
              {step === 2 ? "10 of 12 units went to bots. 2 fans got through." : "An hour later, on Mercari: 10x the price."}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---- The gap between 定価 and the market price, and who collects it. ----
const GAP_STEPS = [3800, 3800];

export function Gap() {
  const ref = useRef<HTMLDivElement>(null);
  const fair = useLoop(GAP_STEPS, ref) === 1;
  return (
    <div ref={ref} className="border border-line-strong bg-panel p-5 md:p-7">
      <div className="mb-6 flex gap-1 font-mono text-xs uppercase tracking-[0.12em]">
        <span className={`px-3 py-1.5 transition-colors ${!fair ? "bg-bad/20 text-bad" : "text-ink-3"}`}>Today</span>
        <span className={`px-3 py-1.5 transition-colors ${fair ? "bg-accent/20 text-accent" : "text-ink-3"}`}>Fair Drop</span>
      </div>
      <div className="flex h-24 w-full">
        <div className="flex basis-[12%] flex-col justify-center bg-fan/80 px-2 text-accent-ink">
          <span className="font-mono text-[11px] font-semibold">定価</span>
          <span className="font-display text-lg">¥3k</span>
        </div>
        <motion.div className="relative flex-1 overflow-hidden" initial={false} animate={{ backgroundColor: fair ? "rgba(255,91,31,0.85)" : "rgba(255,77,94,0.25)" }} transition={{ duration: 0.6 }}>
          <div className={`absolute inset-0 ${fair ? "" : "hazard"}`} />
          <AnimatePresence mode="wait">
            <motion.div key={String(fair)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }} className={`relative flex h-full items-center gap-3 px-4 ${fair ? "text-accent-ink" : "text-bad"}`}>
              {fair ? <Storefront size={32} weight="bold" /> : <Robot size={32} weight="bold" />}
              <div>
                <div className="font-display text-2xl uppercase">{fair ? "To the maker" : "To the scalper"}</div>
                <div className="font-mono text-xs">the gap, up to ¥27,000 a unit</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-3">
        <span>¥0</span>
        <span>what fans will actually pay ≈ ¥30,000</span>
      </div>
    </div>
  );
}

// ---- Why personhood: one whale with 24 wallets vs one human, one bid. ----
const SYBIL_STEPS = [3600, 3600];

export function Sybil() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useLoop(SYBIL_STEPS, ref) === 1;
  return (
    <div ref={ref} className="border border-line-strong bg-panel p-5 md:p-7">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-ink-2">One person, many wallets</span>
        <span className={`border px-2.5 py-1 font-mono text-xs transition-colors ${on ? "border-human text-human" : "border-line text-ink-3"}`}>World ID {on ? "on" : "off"}</span>
      </div>
      <div className="mt-5 grid grid-cols-8 gap-2">
        {Array.from({ length: 24 }, (_, i) => (
          <motion.div
            key={i}
            className={`grid aspect-square place-items-center border ${i === 0 && on ? "border-human bg-human/15 text-human" : "border-line text-bad"}`}
            initial={false}
            animate={{ opacity: on && i > 0 ? 0.12 : 1, scale: on && i > 0 ? 0.8 : 1 }}
            transition={{ delay: on ? (i % 8) * 0.03 + Math.floor(i / 8) * 0.05 : 0, duration: 0.35 }}
          >
            <Wallet size={18} />
          </motion.div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={String(on)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 min-h-12 text-ink-2">
          {on ? "One human, one bid. Every bidder wants at most one unit, so bidding your true value is the winning move for everyone." : "24 raffle entries for one person, plus 23 extra bids placed low on purpose to drag the price down for everyone."}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ---- On Uniswap v4: the path a bid takes. ----
const NODES = [
  { name: "Your wallet", sub: "one execute() call" },
  { name: "Universal Router", sub: "V4_SWAP, unchanged" },
  { name: "PoolManager", sub: "Uniswap v4 core" },
  { name: "AuctionDrop hook", sub: "beforeSwap" },
];

export function SwapFlow() {
  const reduce = useReducedMotion();
  return (
    <div className="border border-line-strong bg-panel p-5 md:p-7">
      <div className="relative grid gap-3 md:grid-cols-4 md:gap-6">
        {!reduce && (
          <div className="pointer-events-none absolute top-1/2 right-[12%] left-[12%] hidden h-px bg-line-strong md:block">
            <motion.div className="absolute -top-1 left-0 h-2 w-full" initial={{ x: "-10%" }} animate={{ x: "100%" }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
              <div className="h-2 w-10 bg-accent shadow-[0_0_16px_rgba(255,91,31,0.8)]" />
            </motion.div>
          </div>
        )}
        {NODES.map((n, i) => (
          <div key={n.name} className={`relative border p-4 ${i === 3 ? "border-accent bg-accent/10" : "border-line bg-panel-2"}`}>
            <div className="font-display text-xl uppercase tracking-wide">{n.name}</div>
            <div className="mt-1 font-mono text-xs text-ink-3">{n.sub}</div>
            {i < 3 && <ArrowRight size={16} className="absolute -bottom-3 left-1/2 rotate-90 text-ink-3 md:hidden" />}
          </div>
        ))}
      </div>
      <ul className="mt-6 grid gap-x-8 gap-y-2 text-ink-2 md:grid-cols-2">
        {[
          "Checks the World ID voucher bound to your wallet",
          "Takes your whole deposit as ERC-6909 claims",
          "Stores your sealed commitment, never the amount",
          "Nets the swap to zero, so no ordinary trade gets through",
        ].map((t) => (
          <li key={t} className="flex gap-2">
            <span className="text-accent">→</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
