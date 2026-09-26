"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";

// 3 units, five other bidders. No fan raffle here, just the auction part.
const OTHERS = [15000, 12000, 8500, 6000, 3200];
const UNITS = 3;
const MIN = 2000;
const MAX = 18000;
const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const at = (n: number) => `${((n - MIN) / (MAX - MIN)) * 100}%`;

/** You win if your bid is among the top UNITS; everyone pays the highest losing bid. */
function outcome(bid: number, value: number) {
  const higher = OTHERS.filter((o) => o >= bid).length; // ties go to the earlier bidder, not you
  const win = higher < UNITS;
  const all = [...OTHERS, bid].sort((a, b) => b - a);
  const price = all[UNITS]; // the highest losing bid
  return { win, price, surplus: win ? value - price : 0 };
}

export function TruthSlider() {
  const [value, setValue] = useState(10000);
  const [bid, setBid] = useState(7000);
  const you = outcome(bid, value);
  const honest = outcome(value, value);

  let tone: "good" | "bad" | "meh";
  let msg: string;
  if (you.win && you.price > value) {
    tone = "bad";
    msg = `You won, but you pay ${yen(you.price)} for something worth ${yen(value)} to you. Overbidding only ever costs you.`;
  } else if (!you.win && honest.surplus > 0) {
    tone = "bad";
    msg = `You lost a unit you'd happily have paid ${yen(honest.price)} for. Underbidding only ever costs you.`;
  } else if (bid === value) {
    tone = "good";
    msg = you.win ? `You win and pay ${yen(you.price)}, ${yen(value - you.price)} under what it's worth to you. Your bid set whether you won, not what you paid.` : "You lose, but only because 3 people valued it more than you. Nothing you could bid would have given you a better deal.";
  } else {
    tone = "meh";
    msg = "Same result as bidding your true value this time, but only by luck. Move the sliders to see it break.";
  }

  return (
    <div className="border border-line-strong bg-panel p-5 md:p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Slider label="What it's worth to you" value={value} onChange={setValue} color="var(--fan)" />
        <Slider label="What you bid" value={bid} onChange={setBid} color="var(--accent)" />
      </div>
      <button onClick={() => setBid(value)} className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
        Bid my true value
      </button>

      {/* Number line: other bids, your bid, your value, the price. */}
      <div className="relative mt-10 mb-14 h-16">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
        {OTHERS.map((o) => (
          <div key={o} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: at(o) }}>
            <div className="h-6 w-0.5 bg-ink-3" />
            <div className="absolute top-8 left-1/2 -translate-x-1/2 font-mono text-[11px] whitespace-nowrap text-ink-3">{yen(o)}</div>
          </div>
        ))}
        <Pin x={at(value)} color="var(--fan)" label="worth" top />
        <Pin x={at(bid)} color="var(--accent)" label="your bid" top />
        <motion.div className="pointer-events-none absolute inset-x-0 inset-y-[-8px]" initial={false} animate={{ x: at(you.price) }} transition={{ type: "spring", stiffness: 200, damping: 26 }}>
          <div className="absolute inset-y-0 left-0 border-l-2 border-dashed border-ink" />
          <div className="absolute -bottom-12 left-0 -translate-x-1/2 font-mono text-xs whitespace-nowrap text-ink">price {yen(you.price)}</div>
        </motion.div>
      </div>

      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <Cell label="Result" value={you.win ? "Win" : "No unit"} />
        <Cell label="You pay" value={you.win ? yen(you.price) : "¥0"} />
        <Cell label="Your gain" value={you.win ? `${you.surplus < 0 ? "-" : "+"}${yen(Math.abs(you.surplus))}` : "¥0"} tone={you.surplus < 0 ? "bad" : you.surplus > 0 ? "good" : undefined} />
      </div>
      <motion.div key={msg} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 flex gap-3 border p-4 ${tone === "good" ? "border-fan/50 bg-fan/10" : tone === "bad" ? "border-bad/50 bg-bad/10" : "border-line bg-panel-2"}`}>
        {tone === "good" ? <CheckCircle size={22} weight="fill" className="shrink-0 text-fan" /> : <WarningCircle size={22} weight="fill" className={`shrink-0 ${tone === "bad" ? "text-bad" : "text-ink-3"}`} />}
        <p className="text-ink-2">{msg}</p>
      </motion.div>
    </div>
  );
}

function Slider({ label, value, onChange, color }: { label: string; value: number; onChange: (n: number) => void; color: string }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="hud">{label}</span>
        <span className="font-display text-3xl tabular" style={{ color }}>
          {yen(value)}
        </span>
      </div>
      <input type="range" min={MIN} max={MAX} step={500} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full" style={{ accentColor: color }} />
    </label>
  );
}

function Pin({ x, color, label, top }: { x: string; color: string; label: string; top?: boolean }) {
  return (
    // Moves a full-width layer by x% of its own width (= the track), so only transform animates.
    <motion.div className="pointer-events-none absolute inset-x-0 top-1/2" initial={false} animate={{ x }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
      <div className="absolute left-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 bg-bg" style={{ borderColor: color }} />
      <div className={`absolute left-0 -translate-x-1/2 font-mono text-[11px] whitespace-nowrap ${top ? "-top-9" : "top-4"}`} style={{ color }}>
        {label}
      </div>
    </motion.div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="bg-panel-2 p-4">
      <div className="hud">{label}</div>
      <div className={`mt-1 font-display text-3xl tabular ${tone === "good" ? "text-fan" : tone === "bad" ? "text-bad" : ""}`}>{value}</div>
    </div>
  );
}
