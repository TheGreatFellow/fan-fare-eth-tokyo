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
          <Keychain className="mx-auto my-2 min-h-0 w-[88%] flex-1" />
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

// The Neon Genesis Evangelion wordmark, from Wikimedia Commons (CC0):
// https://commons.wikimedia.org/wiki/File:Neon_Genesis_Evangelion_-_Logo.svg
// Paths unchanged; the backdrop takes the holographic fill instead of its red-to-yellow gradient.
const NGE_BACKDROP =
  "m406.23 148.676 8.157-13.328 14.59-.783 5.179 8zM77.441 122.793l74.996 20.246 4.17 8.418-10.502 9.668 5.915 15.166 15.583-.834 2.919 7.166-64.417 18.502 15.583-21.916s20.588.418 20.588-.834c0-1.25-3.753-11.336-3.753-11.336s-2.502-3.412-1.251-5.914 5.005-4.246 2.085-5.498-5.421 1.252-9.251 1.252-16-3.754-16-3.754-.911-5.916-4.247-6.332c-3.336-.418-17.668-2.502-17.668-2.502zm101.498 66.502c0-1.25-27.753-65.668-27.753-65.668l14.672 8.834 2.996 8.834 16.834 3.83-6.749-12.664-8.417-6.255-17.668-54.332s.341-3.336 3.336-.417c2.996 2.919 19.413 21.004 19.413 21.004l16.834 53.914 7.166 1.252-4.664-15.583 25.251 30.331.417 12.248h31.583l-13.081 16.416-4.587 1.252-.417 14.748-3.875 4.697-.94-25.41 4.396-.941 6.747-4.865-19.612 1.104s0 11.912-.47 14.582c-.47 2.672-3.761 11.77-3.761 11.77l-13.962-51.77-29.179-1.723 9.097 21.648c-.002 0-3.607 14.416-3.607 13.164m54.59-34.969 22.276 3.455s5.485 6.582 5.485 7.209-20.545 1.104-20.545 1.104zm14.119 32.469s34.037-16 34.978-15.373c.94.627 4.709 2.828 4.709 2.828l-27.769 19.762zm-27.455-30.902-24.313-25.567 1.411-7.06 23.373 23.217zm.47-13.955-23.53-21.963v-5.963l11.455.313 12.702 16.313zm53.179 23.208c-.157-.471-3.925-4.074-3.925-4.074l-9.411-94.59 4.082-7.216 16.313 10.194-.47 64.164s36.858-2.671 37.329-2.828c.47-.157 3.926-43.134 3.926-43.134l16.94 30.59-6.59 45.329-8.471 10.828-6.433-7.531 2.045-15.059s8.94-3.455 8.94-3.926-1.262-4.074-1.262-4.074l-9.41 4.074.47-6.433-6.582.478-20.865 67.918-.156-50.037 9.724-14.277-3.448-7.686-2.358-.156-1.254 4.866-11.76-.471.313 8.314c0-.001-7.53 15.208-7.687 14.737m70.277-35.447 11.604 14.903-7.06 27.918-33.254 42.672-8.471 2.82 29.963-50.193zm15.529 24.783c1.411 0 19.762-.156 19.762-.156l7.843-6.59 24-61.172 18.664-14.12 5.18.47-3.135 5.336-.626 4.858-29.18 65.723-10.351 6.59 2.351 2.986 6.276-4.082 17.568-.94-3.77 6.434-24.939 9.254 1.41 6.59-10.508 8.939-6.902 13.807-10.978 11.133.783-5.648 14.119-32.312-8.783.312-1.889 6.275-9.724 5.023 2.202 3.291-22.903 18.82-9.731.635 29.179-33.262s4.395-17.881 4.082-18.194m49.098 14.432 56-26.037 11.604.314-60.858 33.566z";
const NGE_LETTERS = [
  "M97.818 100.5h49.768v3.319h-3.758L154.172 131l11.535-27.358h-4.819V100.5h21.172v3.142h-3.535L165.53 136.5h-13.172l-12.949-32.681h-2.521v8.177h-3.005v-5.349s-.483-2.828-4.065-2.828h-16.354v13.655h12.949c1.944 0 2.875-3.888 2.875-3.888h1.944v11.004h-2.521s-.177-3.888-2.651-3.888h-12.949v12.772s14.056-.354 17.061-.354 4.595-4.949 4.595-4.949h2.298v8.328H97.818v-3.025h4.949v-29.479h-5.125zm70.717 36v-2.849h2.875s.707-.837 2.121-4.242 12.112-28.909 12.112-28.909H197l13.349 32.975H213v-30.009h-3.889V100.5h20.949l12.818 31.03v-27.711h-4.289V100.5h12.996v3.672h-4.819v29.302h3.228v3.025h-21.702l-11.935-29.323v24.707s.753 1.767 1.637 1.767 2.828.177 2.828.177v2.672h-27.535v-2.849h4.065l-10.475-27.358-10.344 24s.046 2.828 1.46 2.828h3.182v3.379h-12.64z",
  "M265.818 101.121c7.726 0 11.712 3.405 11.712 3.405s1.944.53 2.474-.354 2.875-3.672 2.875-3.672h3.888v13.439h-8.707v-6.409s-4.772-3.358-9.237-3.358-8.707 2.297-8.707 8.707v16.177s2.344 5.302 7.293 5.302 7.47-2.298 8-3.182 0-9.768 0-9.768h-4.465v-3.228h15.823v18.32h-2.828v-3.088c0-.946-.93-2.697-3.228-2.554-1.868.117-4.595 6.551-13.479 6.551s-19.051-6.279-19.051-12.112c0-5.832.177-11.181.177-11.181s.93-12.995 17.46-12.995zm61.833-.621h18.168v3.849h-1.638s-1.414-.53-1.414 1.414v28.596h12.642s2.298-3.535 2.651-5.479c.354-1.944 1.414-3.582 1.414-3.582h2.521l-1.638 11.203h-32.354v-2.496h3.758V104.35h-4.111zm35.582 3.142V100.5H381v3.849h-2.65s-1.414-.53-1.414 1.414-.047 27.358-.047 27.358.508 1.15 1.265 1.15h3.847v2.854h-20.125v-2.875H365s1.375-.375 1.375-1.375V105.5s-.5-1.25-1.25-1.25-1.892-.608-1.892-.608z",
  "M400.125 104.125c-6.75 0-7.75 6.5-7.75 6.5v18.5c0 2 1.409 5.125 8.534 5.125s8.341-5.125 8.341-5.125V111.5c0-5-3.25-7.375-9.125-7.375m-.375-2.25c9 0 20.5 3.875 20.5 17.25s-10.75 17.8-20.5 17.8S381 132.875 381 120.5s5.875-18.625 18.75-18.625",
  "m287.982 100.5 39.074.007-.005 11.488h-3.004v-5.349s-.484-2.828-4.065-2.828h-16.354v13.655h12.949c1.943 0 2.874-3.888 2.874-3.888h1.944v11.004h-2.521s-.177-3.888-2.651-3.888h-12.948v12.772s14.056-.354 17.061-.354c3.004 0 4.595-4.949 4.595-4.949h2.298v8.328h-39.246v-3.025h4.948v-29.479h-4.994zm135.095 31.757V103.81h-3.888v-2.965h20.948l12.818 31.03v-26.218c0-1-.851-1.493-.851-1.493h-3.438v-3.319h12.995v3.389h-3.968s-.851.424-.851 1.612v27.974h3.228v3.025h-21.7l-11.935-29.323v24.707s.754 1.768 1.637 1.768c.884 0 2.828.176 2.828.176v2.672h-11.661v-2.849l2.084-.096c1.396 0 1.754-1.643 1.754-1.643z",
];

/** The physical item: a chrome keychain with a holographic enamel Evangelion tag, hung in a
 *  clear blister pack so it reads as retail merch, not a digital collectible. */
function Keychain({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const holo = `holo-${id}`;
  const metal = `metal-${id}`;
  const glass = `glass-${id}`;
  const clip = `nge-${id}`;
  return (
    <svg viewBox="0 0 200 236" className={className} role="img" aria-label="A holographic Evangelion metal keychain in its retail pack">
      <defs>
        <linearGradient id={holo} gradientUnits="userSpaceOnUse" x1="20" y1="90" x2="180" y2="170" spreadMethod="reflect">
          <stop offset="0" stopColor="#9d7bff" />
          <stop offset="0.25" stopColor="#5ee7ff" />
          <stop offset="0.5" stopColor="#8fe34f" />
          <stop offset="0.75" stopColor="#ffd36b" />
          <stop offset="1" stopColor="#ff5b1f" />
          {!reduce && <animateTransform attributeName="gradientTransform" type="translate" values="0 0; 160 60; 0 0" dur="6s" repeatCount="indefinite" />}
        </linearGradient>
        <linearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f7" />
          <stop offset="0.3" stopColor="#9a9aa6" />
          <stop offset="0.5" stopColor="#f8f8fb" />
          <stop offset="0.72" stopColor="#6e6e7a" />
          <stop offset="1" stopColor="#d9d9e0" />
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.02" />
        </linearGradient>
        <clipPath id={clip}>
          <path d={NGE_BACKDROP} />
        </clipPath>
      </defs>

      {/* Retail pack: hang slot, blister bubble. */}
      <rect x="82" y="3" width="36" height="8" rx="4" fill="var(--bg)" stroke="var(--line-strong)" />
      <rect x="10" y="20" width="180" height="170" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" />

      {/* The keychain swings gently from its ring. */}
      <g className="keychain-swing">
        <circle cx="100" cy="42" r="13" fill="none" stroke={`url(#${metal})`} strokeWidth="4" />
        {[58, 66, 74].map((y, i) => (
          <ellipse key={y} cx="100" cy={y} rx={i % 2 ? 2.6 : 4} ry={i % 2 ? 5 : 4.4} fill="none" stroke={`url(#${metal})`} strokeWidth="2" />
        ))}
        <rect x="87" y="76" width="26" height="22" rx="9" fill={`url(#${metal})`} />
        <circle cx="100" cy="84" r="4" fill="#0c0c11" />
        {/* Chrome frame, dark enamel, holographic wordmark. */}
        <rect x="14" y="92" width="172" height="80" rx="12" fill={`url(#${metal})`} />
        <rect x="20" y="98" width="160" height="68" rx="8" fill="#15151c" />
        <rect x="20" y="98" width="160" height="68" rx="8" fill={`url(#${holo})`} opacity="0.18" />
        <g transform="translate(-2.4 81.5) scale(0.37)">
          <rect x="77.44" y="59.1" width="398.88" height="158.48" fill={`url(#${holo})`} clipPath={`url(#${clip})`} />
          {NGE_LETTERS.map((d) => (
            <path key={d.slice(0, 12)} d={d} fill="#f6f6f9" stroke="#0c0c11" strokeWidth="1.5" fillRule="evenodd" />
          ))}
        </g>
        <rect x="14" y="92" width="172" height="80" rx="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
      </g>

      {/* Blister plastic over everything. */}
      <rect x="10" y="20" width="180" height="170" rx="16" fill={`url(#${glass})`} />

      <text x="12" y="210" fill="var(--ink)" className="font-display" fontSize="15" letterSpacing="1.2">
        METAL KEYCHAIN
      </text>
      <text x="12" y="224" fill="var(--ink-3)" className="font-mono" fontSize="7" letterSpacing="1">
        HOLOGRAPHIC ENAMEL, 60 MM
      </text>
      <text x="188" y="222" fill="var(--ink-2)" className="font-jp" fontSize="13" textAnchor="end">
        限定
      </text>
    </svg>
  );
}
