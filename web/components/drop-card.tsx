"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

/** The collectible on sale: a foil trading-card style plate that tilts toward the pointer.
 *  Motion values only, so pointer movement never re-renders React. */
export function DropCard({ serial = "001", edition = "003", className = "" }: { serial?: string; edition?: string; className?: string }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 150, damping: 18 });
  const sy = useSpring(py, { stiffness: 150, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-14, 14]);
  const rotateX = useTransform(sy, [0, 1], [10, -10]);
  const sheenX = useTransform(sx, [0, 1], ["0%", "100%"]);

  return (
    <div
      className={`[perspective:1200px] ${className}`}
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="notch relative aspect-[5/7] w-full overflow-hidden border border-line-strong bg-panel-2 shadow-[0_40px_80px_-30px_rgba(255,91,31,0.35)]"
      >
        {/* Backdrop: a radar grid and a hot core, like a hangar readout. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,91,31,0.35),transparent_55%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--line-strong)_1px,transparent_1px),linear-gradient(90deg,var(--line-strong)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute inset-x-0 top-0 h-7 border-b border-line-strong hazard" />

        <div className="absolute inset-0 flex flex-col justify-between p-5 pt-11">
          <div className="flex items-start justify-between">
            <span className="hud !text-ink-2">Limited edition</span>
            <span className="hud tabular !text-accent">
              No.{serial}/{edition}
            </span>
          </div>
          <div className="text-center">
            <div className="font-jp text-[clamp(4.5rem,11vw,7.5rem)] leading-none text-ink [text-shadow:0_0_40px_rgba(255,91,31,0.45)]">限定</div>
            <div className="mt-3 font-display text-xl uppercase tracking-[0.2em] text-ink-2">Collector figure</div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="hud">定価</div>
              <div className="font-display text-3xl tabular">¥3,000</div>
            </div>
            <div className="font-jp text-4xl text-fan">公平</div>
          </div>
        </div>

        {/* Holographic foil sheen that follows the tilt. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-color-dodge opacity-40"
          style={{
            backgroundImage: "linear-gradient(115deg, transparent 20%, rgba(157,123,255,0.55) 38%, rgba(143,227,79,0.45) 50%, rgba(255,91,31,0.5) 62%, transparent 80%)",
            backgroundSize: "250% 250%",
            backgroundPositionX: sheenX,
          }}
        />
      </motion.div>
    </div>
  );
}
