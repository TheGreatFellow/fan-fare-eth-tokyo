"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, CheckCircle, LockSimple, Pause, Play, Trophy, User } from "@phosphor-icons/react";

// One item, four sealed bids. Highest bid wins; the winner pays the second-highest bid.
const MAX = 14000;
const BIDS = [
  { id: "ben", bid: 9000 },
  { id: "dai", bid: 5000 },
  { id: "aiko", bid: 12000 },
  { id: "chen", bid: 7500 },
];
const WINNER = "aiko";
const PRICE = 9000; // ben's bid, the second-highest
const STEPS = [
  { key: "Sealed", ms: 2200 },
  { key: "Open", ms: 2200 },
  { key: "Winner", ms: 2400 },
  { key: "Price", ms: 5200 },
];
const CAPTIONS = [
  "Four collectors seal one bid each for a single item. Nobody sees anyone else's.",
  "Bidding closes and the bids open.",
  "The highest bid wins: Aiko, at ¥12,000.",
  "But Aiko pays the second-highest bid, Ben's ¥9,000. The runner-up sets the price, not the winner.",
];
const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export function VickreyDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { amount: 0.4 });
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  // Autoplay while on screen; clicking a step pauses it so the presenter sets the pace.
  useEffect(() => {
    if (!inView || !playing || reduce) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEPS[step].ms);
    return () => clearTimeout(t);
  }, [inView, playing, reduce, step]);
  const order = step >= 2 ? [...BIDS].sort((a, b) => b.bid - a.bid) : BIDS;

  return (
    <div ref={ref} className="border border-line-strong bg-panel">
      <div className="flex items-stretch border-b border-line">
        <button onClick={() => setPlaying((p) => !p)} className="grid w-12 shrink-0 place-items-center border-r border-line text-ink-2 hover:text-ink" aria-label={playing ? "Pause" : "Play"}>
          {playing && !reduce ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>
        <div className="grid flex-1 grid-cols-4">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => {
                setStep(i);
                setPlaying(false);
              }}
              className={`relative py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:text-ink ${i === step ? "text-accent" : i < step ? "text-ink-2" : "text-ink-3"}`}
            >
              <span className="mr-1.5 text-ink-3">{i + 1}</span>
              {s.key}
              {i === step && <motion.div layoutId="vickrey-step" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 md:px-7">
        <div className="relative mb-7">
        <ul className="space-y-2">
          {order.map((b) => {
            const won = b.id === WINNER && step >= 2;
            return (
              <motion.li key={b.id} layout transition={{ type: "spring", stiffness: 240, damping: 28 }} className="grid grid-cols-[4rem_minmax(0,1fr)_6rem] items-center gap-3">
                <span className={`flex items-center gap-1.5 font-mono text-sm ${won ? "text-accent" : "text-ink-2"}`}>
                  {won ? <Trophy size={14} weight="fill" /> : <User size={14} />} {b.id}
                </span>
                <div className="relative h-9 overflow-hidden">
                  <motion.div className="hazard absolute inset-0" initial={false} animate={{ opacity: step === 0 ? 1 : 0 }} transition={{ duration: 0.4 }} />
                  <motion.div
                    className="absolute inset-y-0 left-0 w-full origin-left"
                    initial={false}
                    animate={{ scaleX: step === 0 ? 0 : b.bid / MAX, backgroundColor: won ? "var(--accent)" : "var(--ink-3)", opacity: won && step === 3 ? 0.3 : won ? 0.9 : 0.45 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                  {/* What the winner actually pays. */}
                  <motion.div
                    className="absolute inset-y-0 left-0 w-full origin-left bg-accent"
                    initial={false}
                    animate={{ scaleX: won && step === 3 ? PRICE / MAX : 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="font-mono text-sm leading-tight">
                  {step === 0 ? (
                    <span className="flex items-center gap-1.5 text-accent">
                      <LockSimple size={14} weight="bold" /> sealed
                    </span>
                  ) : (
                    <>
                      <span className="text-ink">{yen(b.bid)}</span>
                      {won && step === 3 && <span className="block text-xs text-accent">pays {yen(PRICE)}</span>}
                    </>
                  )}
                </span>
              </motion.li>
            );
          })}
        </ul>
        {/* The price line lands on the second-highest bid. */}
        <div className="pointer-events-none absolute inset-y-0 right-[6.75rem] left-[4.75rem]">
          <motion.div className="absolute inset-y-0 left-0 w-full" initial={false} animate={{ x: step === 3 ? `${(PRICE / MAX) * 100}%` : "100%", opacity: step === 3 ? 1 : 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <div className="absolute -top-1 -bottom-1 left-0 border-l-2 border-ink" />
            <div className="absolute -bottom-6 left-0 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-ink">price = 2nd-highest bid</div>
          </motion.div>
        </div>
        </div>
      </div>
      <div className="min-h-14 px-5 pb-5 md:px-7">
        <AnimatePresence mode="wait">
          <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-ink-2">
            {CAPTIONS[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** What each bidding strategy gets you under the second-price rule. */
export function Strategies() {
  const rows = [
    {
      icon: <CheckCircle size={24} weight="fill" className="text-fan" />,
      title: "Bid your true value",
      text: "The best move. You win whenever you value the item most, and you always pay less than you bid, because the price is the next bid down. Highest chance of winning, lowest possible payment.",
    },
    {
      icon: <ArrowDown size={24} weight="bold" className="text-bad" />,
      title: "Bid too low",
      text: "Doesn't lower the price you'd pay; it only lowers your chance of winning. You can lose an item you'd happily have paid the winning price for.",
    },
    {
      icon: <ArrowUp size={24} weight="bold" className="text-bad" />,
      title: "Bid too high",
      text: "Overbidding just to win is a gamble: if the runner-up also bids high, you pay their bid, which can be more than the item is worth to you.",
    },
  ];
  return (
    <ul className="divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <li key={r.title} className="flex gap-3.5 py-3.5">
          <div className="mt-0.5 shrink-0">{r.icon}</div>
          <div>
            <h3 className="font-display text-xl uppercase tracking-wide">{r.title}</h3>
            <p className="mt-0.5 text-[0.95rem] leading-relaxed text-ink-2">{r.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
