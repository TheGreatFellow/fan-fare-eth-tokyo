"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { LockSimple, Pause, Play, Robot, User } from "@phosphor-icons/react";

// A worked drop: 5 units, 2 raffled to fans at 定価, 3 auctioned. Same rules as the contract.
const RESERVE = 3000;
const MAX = 16000;
const BIDDERS = [
  { id: "kaito", bid: 12000 },
  { id: "mika", bid: 3000 },
  { id: "ren", bid: 8500 },
  { id: "sora", bid: 5000 },
  { id: "yui", bid: 3200 },
  { id: "haru", bid: 15000 },
  { id: "nao", bid: 6000 },
  { id: "toma", bid: 2500 },
];
const FANS = new Set(["mika", "sora"]); // what the raffle drew; any bid at or above 定価 could have
const WINNERS = new Set(["haru", "kaito", "ren"]);
const CLEAR = 6000; // nao: the highest losing bid
const ELIGIBLE = BIDDERS.filter((b) => b.bid >= RESERVE).map((b) => b.id);

const STEPS = [
  { key: "Seal", jp: "封", text: "Eight fans each send one sealed bid. The bot farm tries fifty wallets, but it's one human, so World ID lets in one bid." },
  { key: "Reveal", jp: "開", text: "Bidding closes and everyone opens their envelope. Nobody could see a bid before this, so nobody could game it." },
  { key: "Raffle", jp: "抽", text: "Fan units go first: 2 are drawn at random among bids at or above the retail price (定価), and they pay retail. Bidding higher doesn't improve your odds." },
  { key: "Rank", jp: "順", text: "The other 3 units go to the 3 highest remaining bids." },
  { key: "Clear", jp: "価", text: "Every winner pays one price: the highest losing bid, ¥6,000. Haru bid ¥15,000 and still pays ¥6,000." },
  { key: "Settle", jp: "済", text: "The brand gets ¥24,000 instead of ¥15,000. Fans still paid retail. And no unit is left underpriced for a scalper to flip." },
];

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const pct = (n: number) => n / MAX;

export function Explainer() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [spin, setSpin] = useState<string | null>(null);
  const [raffled, setRaffled] = useState(false);

  // Autoplay while on screen.
  useEffect(() => {
    if (!inView || !playing || reduce) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), step === 2 ? 4600 : step === STEPS.length - 1 ? 6500 : 3800);
    return () => clearTimeout(t);
  }, [inView, playing, step, reduce]);

  // The raffle: a highlight runs through the eligible bids before landing on the winners.
  useEffect(() => {
    if (step !== 2 || reduce) return;
    let i = 0;
    const t = setInterval(() => setSpin(ELIGIBLE[i++ % ELIGIBLE.length]), 90);
    const stop = setTimeout(() => {
      clearInterval(t);
      setSpin(null);
      setRaffled(true);
    }, 1500);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
      setSpin(null);
      setRaffled(false);
    };
  }, [step, reduce]);

  const drawn = step > 2 || (step === 2 && (raffled || !!reduce));
  const order =
    step < 3
      ? BIDDERS
      : [...BIDDERS.filter((b) => FANS.has(b.id)), ...BIDDERS.filter((b) => !FANS.has(b.id)).sort((a, b) => b.bid - a.bid)];

  return (
    <div ref={ref} className="border border-line-strong bg-panel">
      {/* Step tabs double as the scrubber. */}
      <div className="flex items-stretch border-b border-line">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="grid w-12 shrink-0 place-items-center border-r border-line text-ink-2 hover:text-ink"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing && !reduce ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>
        <div className="grid flex-1 grid-cols-6">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => {
                setStep(i);
                setPlaying(false);
              }}
              className={`relative px-1 py-3 text-center transition-colors ${i === step ? "text-accent" : i < step ? "text-ink-2" : "text-ink-3"} hover:text-ink`}
            >
              <span className="font-jp text-lg">{s.jp}</span>
              <span className="ml-1.5 hidden font-mono text-xs uppercase tracking-[0.12em] sm:inline">{s.key}</span>
              {i === step && <motion.div layoutId="explainer-step" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,1fr)_17rem] md:p-8">
        <div className="relative">
          <AnimatePresence>
            {step === 0 && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: [0, 1, 1, 0.9], x: [40, 0, -6, 0] }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="mb-3 flex items-center gap-3 overflow-hidden border border-bad/60 bg-bad/10 px-3 py-2 font-mono text-sm text-bad"
              >
                <Robot size={18} weight="bold" /> bot-farm × 50 wallets
                <span className="ml-auto text-xs uppercase">rejected: one human</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
          <ul className="space-y-1.5">
            {order.map((b) => {
              const fan = FANS.has(b.id) && drawn;
              const below = b.bid < RESERVE && step >= 2;
              const won = WINNERS.has(b.id) && step >= 3;
              const color = fan ? "var(--fan)" : won ? "var(--accent)" : "var(--ink-3)";
              const lit = spin === b.id;
              const pays = fan ? RESERVE : won && step >= 4 ? CLEAR : null;
              return (
                <motion.li key={b.id} layout transition={{ type: "spring", stiffness: 220, damping: 28 }} className="grid grid-cols-[4.5rem_minmax(0,1fr)_6.5rem] items-center gap-3">
                  <span className={`flex items-center gap-1.5 font-mono text-sm ${lit ? "text-fan" : "text-ink-2"}`}>
                    <User size={14} /> {b.id}
                  </span>
                  <div className={`relative h-9 overflow-hidden transition-[outline-color] ${lit ? "outline outline-2 outline-fan" : "outline-0"}`}>
                    {/* Sealed: warning stripes over the whole lane. */}
                    <motion.div className="hazard absolute inset-0" initial={false} animate={{ opacity: step === 0 ? 1 : 0 }} transition={{ duration: 0.4 }} />
                    {/* The bid itself. */}
                    <motion.div
                      className="absolute inset-y-0 left-0 w-full origin-left"
                      initial={false}
                      animate={{ scaleX: step === 0 ? 0 : pct(b.bid), backgroundColor: color, opacity: below || (step >= 4 && !won && !fan) ? 0.28 : pays ? 0.35 : 0.85 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                    {/* What they actually pay: solid, over the faded bid. */}
                    <motion.div
                      className="absolute inset-y-0 left-0 w-full origin-left"
                      style={{ backgroundColor: color }}
                      initial={false}
                      animate={{ scaleX: pays ? pct(pays) : 0 }}
                      transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
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
                        {pays !== null && <span className="block text-xs" style={{ color }}>pays {yen(pays)}</span>}
                        {below && <span className="block text-xs text-ink-3">below retail</span>}
                      </>
                    )}
                  </span>
                </motion.li>
              );
            })}
          </ul>
            {/* Price lines over the lanes. */}
            <div className="pointer-events-none absolute inset-y-0 right-[7.25rem] left-[5.25rem]">
              <Line show={step >= 2} x={pct(RESERVE)} color="var(--fan)" label="retail (定価)" dashed />
              <Line show={step >= 4} x={pct(CLEAR)} color="var(--accent)" label="clearing price" from={1} />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
              <div className="flex items-baseline gap-3">
                <span className="font-jp text-5xl text-accent">{STEPS[step].jp}</span>
                <span className="font-display text-3xl uppercase tracking-wide">{STEPS[step].key}</span>
              </div>
              <p className="mt-3 leading-relaxed text-ink-2">{STEPS[step].text}</p>
            </motion.div>
          </AnimatePresence>
          <div className="space-y-2 font-mono text-xs text-ink-3">
            <Legend color="var(--fan)" label="fan raffle, pays retail (定価)" />
            <Legend color="var(--accent)" label="auction winner, pays clearing price" />
            <Legend color="var(--ink-3)" label="didn't win, full refund" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {step === STEPS.length - 1 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-line">
            <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
              <Tally label="Fans at retail" value="2 × ¥3,000" />
              <Tally label="Auction winners" value="3 × ¥6,000" />
              <Tally label="Brand receives" value="¥24,000" sub="vs ¥15,000 all at retail" accent />
              <Tally label="Left for scalpers" value="¥0" sub="price already = market" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Line({ show, x, color, label, dashed, from = 0 }: { show: boolean; x: number; color: string; label: string; dashed?: boolean; from?: number }) {
  return (
    <motion.div
      className="absolute inset-y-0 left-0 w-full"
      initial={false}
      animate={{ x: `${(show ? x : from) * 100}%`, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`absolute -top-1 -bottom-1 left-0 border-l-2 ${dashed ? "border-dashed" : ""}`} style={{ borderColor: color }} />
      <div className="absolute -bottom-6 left-0 -translate-x-1/2 whitespace-nowrap font-mono text-[11px]" style={{ color }}>
        {label}
      </div>
    </motion.div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-5" style={{ background: color }} />
      {label}
    </div>
  );
}

function Tally({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-panel-2 p-4">
      <div className="hud">{label}</div>
      <div className={`mt-1 font-display text-2xl tabular ${accent ? "text-fan" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-ink-3">{sub}</div>}
    </div>
  );
}
