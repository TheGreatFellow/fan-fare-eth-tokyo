"use client";

import { useId } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

/** The physical item on sale: a boxed collector figure behind a foil plate, tilting toward the
 *  pointer. Motion values only, so pointer movement never re-renders React. */
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(157,123,255,0.28),transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--line-strong)_1px,transparent_1px),linear-gradient(90deg,var(--line-strong)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute inset-x-0 top-0 h-7 border-b border-line-strong hazard" />

        <div className="absolute inset-0 flex flex-col p-5 pt-11">
          <div className="flex items-start justify-between">
            <span className="hud !text-ink-2">Limited edition</span>
            <span className="hud tabular !text-accent">
              No.{serial}/{edition}
            </span>
          </div>
          <BoxedFigure className="mx-auto my-2 min-h-0 w-[82%] flex-1" />
          <div className="flex items-end justify-between">
            <div>
              <div className="hud">定価</div>
              <div className="font-display text-3xl tabular">¥3,000</div>
            </div>
            <div className="text-right">
              <div className="hud !text-fan">Physical item</div>
              <div className="hud">ships on claim</div>
            </div>
          </div>
        </div>

        {/* Foil sheen over the whole plate, following the tilt. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-color-dodge"
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

/** A blocky bear figure with holographic chrome, standing in a windowed collector box. */
function BoxedFigure({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const holo = `holo-${id}`;
  const glass = `glass-${id}`;
  const edge = "rgba(255,255,255,0.45)";
  return (
    <svg viewBox="0 0 200 236" className={className} role="img" aria-label="A holographic bear figure in its collector box">
      <defs>
        {/* The chrome shifts slowly across the figure. */}
        <linearGradient id={holo} gradientUnits="userSpaceOnUse" x1="50" y1="50" x2="150" y2="190" spreadMethod="reflect">
          <stop offset="0" stopColor="#9d7bff" />
          <stop offset="0.25" stopColor="#5ee7ff" />
          <stop offset="0.5" stopColor="#8fe34f" />
          <stop offset="0.75" stopColor="#ffd36b" />
          <stop offset="1" stopColor="#ff5b1f" />
          {!reduce && <animateTransform attributeName="gradientTransform" type="translate" values="0 0; 100 140; 0 0" dur="7s" repeatCount="indefinite" />}
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.58" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Box: hang tab, carton, window. */}
      <path d="M78 26 L84 8 H116 L122 26 Z" fill="#1d1d25" stroke="var(--line-strong)" />
      <rect x="92" y="13" width="16" height="6" rx="3" fill="var(--bg)" />
      <rect x="16" y="26" width="168" height="206" rx="4" fill="#15151b" stroke="var(--line-strong)" />
      <rect x="16" y="26" width="168" height="10" fill="var(--accent)" opacity="0.9" />
      <rect x="30" y="46" width="140" height="150" rx="3" fill="#0c0c11" stroke="rgba(255,255,255,0.14)" />

      {/* The figure, bobbing slightly on its display peg. */}
      <g transform="translate(100 127) scale(1.1) translate(-100 -120)">
      <g className="figure-float">
        <ellipse cx="100" cy="186" rx="34" ry="4" fill="#000" opacity="0.5" />
        <g fill={`url(#${holo})`} stroke={edge} strokeWidth="0.8">
          <circle cx="77" cy="62" r="9" />
          <circle cx="123" cy="62" r="9" />
          <rect x="68" y="58" width="64" height="46" rx="13" />
          <rect x="60" y="108" width="13" height="36" rx="5" transform="rotate(8 66 108)" />
          <rect x="127" y="108" width="13" height="36" rx="5" transform="rotate(-8 134 108)" />
          <path d="M75 106 H125 L120 148 H80 Z" strokeLinejoin="round" />
          <rect x="81" y="148" width="18" height="28" rx="3" />
          <rect x="101" y="148" width="18" height="28" rx="3" />
          <rect x="78" y="174" width="22" height="8" rx="3" />
          <rect x="100" y="174" width="22" height="8" rx="3" />
        </g>
        {/* Specular highlight on the head. */}
        <rect x="74" y="62" width="30" height="8" rx="4" fill="#fff" opacity="0.28" />
      </g>
      </g>

      {/* Window plastic. */}
      <rect x="30" y="46" width="140" height="150" rx="3" fill={`url(#${glass})`} />

      {/* Box label. */}
      <text x="30" y="215" fill="var(--ink)" className="font-display" fontSize="14" letterSpacing="1.2">
        COLLECTOR FIGURE
      </text>
      <text x="164" y="60" fill="var(--accent)" className="font-mono" fontSize="9" textAnchor="end">
        400%
      </text>
      <text x="30" y="228" fill="var(--ink-3)" className="font-mono" fontSize="7" letterSpacing="1">
        HOLOGRAPHIC CHROME
      </text>
      <text x="170" y="229" fill="var(--ink-2)" className="font-jp" fontSize="12" textAnchor="end">
        限定
      </text>
    </svg>
  );
}
