"use client";

import { useState } from "react";
import Link from "next/link";
import { useBlockNumber } from "wagmi";
import { sepolia } from "wagmi/chains";
import { AnimatePresence, motion } from "motion/react";
import { ArrowSquareOut, Coins, Eye, Gavel, HandCoins, LockSimple, Shuffle, Users, Warning } from "@phosphor-icons/react";
import { AUCTION_ADDRESS } from "@/lib/auction";
import { OUTCOME, YEN_FOR_RESERVE, auction, same, short, useActingWallet, useAuction, useNow, useSend, yen } from "@/lib/use-auction";
import { Brand, WalletBar } from "@/components/chrome";
import { AlertModal, type Alert } from "@/components/modal";

const ease = [0.16, 1, 0.3, 1] as const;

export default function AdminPage() {
  const wallet = useActingWallet();
  const a = useAuction();
  const now = useNow();
  const { data: block } = useBlockNumber({ chainId: sepolia.id, watch: true });
  const [alert, setAlert] = useState<Alert>(null);
  const { busy, send } = useSend((title, text) => setAlert({ tone: "bad", title, text }), () => (a.ready ? a.refetch() : Promise.resolve()));

  const isMaker = a.ready && same(wallet.address, a.maker);

  return (
    <div className="min-h-[100dvh] bg-[#08080a] [background-image:linear-gradient(rgba(255,91,31,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,91,31,0.05)_1px,transparent_1px)] [background-size:40px_40px]">
      {/* Status bar: who is acting, which chain, live block. */}
      <header className="sticky top-0 z-40 border-b border-accent/30 bg-[#08080a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Brand />
            <span className="hidden border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.2em] text-accent sm:inline">Brand console 管制</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-ink-3 lg:inline">
              SEPOLIA <span className="tabular text-ink-2">#{block?.toString() ?? "…"}</span>
            </span>
            <WalletBar wallet={wallet} maker={a.ready ? a.maker : undefined} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        {!a.ready ? (
          <div className="h-96 animate-pulse border border-line bg-panel" />
        ) : !wallet.isConnected || !isMaker ? (
          <Gate connected={wallet.isConnected} maker={a.maker} />
        ) : (
          <Console a={a} now={now} busy={busy} onAction={(fn, label) => void send(label, (w) => w({ ...auction, functionName: fn, chainId: sepolia.id, account: wallet.address }))} />
        )}
      </main>
      <AlertModal alert={alert} onClose={() => setAlert(null)} />
    </div>
  );
}

function Gate({ connected, maker }: { connected: boolean; maker: string }) {
  return (
    <div className="mx-auto max-w-lg border border-accent/40 bg-panel p-8 text-center">
      <LockSimple size={40} className="mx-auto text-accent" />
      <div className="mt-4 font-jp text-4xl text-accent">権限なし</div>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-wide">Brand access only</h1>
      <p className="mt-3 text-ink-2">
        {connected ? "The acting wallet isn't this drop's brand wallet. Pick the brand account in the wallet menu above, or add it with +." : "Connect the brand wallet to run this drop."}
      </p>
      <p className="mt-4 font-mono text-sm text-ink-3">brand wallet {short(maker)}</p>
      <Link href="/auction" className="btn btn-ghost mt-6">
        Go to the drop page
      </Link>
    </div>
  );
}

type Ready = Extract<ReturnType<typeof useAuction>, { ready: true }>;

function Console({ a, now, busy, onAction }: { a: Ready; now: number; busy: string | null; onAction: (fn: "closeBidding" | "settle" | "withdraw", label: string) => void }) {
  const { rows, toYen, reserve, clearing, fanWinners, auctionWinners, makerFunds, supply, fanUnits } = a;
  const revealed = rows.filter((r) => r.revealed).length;
  const escrow = rows.reduce((s, r) => s + (r.claimed ? 0n : r.deposit), 0n);
  const total = Number(a.minReveal);
  const left = Math.max(0, Math.ceil((a.settleAt - now) / 1000));
  const gap = auctionWinners * (clearing - reserve);
  const step = a.phase === "Bidding" ? 0 : a.phase === "Reveal" ? 1 : 2;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        {/* Pipeline: the three phases with the one control that moves the drop forward. */}
        <section className="border border-line-strong bg-panel">
          <div className="grid grid-cols-3 border-b border-line">
            {["入札 Bidding", "開封 Reveal", "確定 Settled"].map((label, i) => (
              <div key={label} className={`relative px-4 py-3 font-mono text-xs uppercase tracking-[0.15em] ${i === step ? "text-accent" : i < step ? "text-ink-2" : "text-ink-3"}`}>
                {i === step && <motion.div layoutId="phase" className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                {label}
              </div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={a.phase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease }} className="grid items-center gap-6 p-6 md:grid-cols-[auto_minmax(0,1fr)]">
              {a.phase === "Bidding" && (
                <>
                  <Big value={rows.length} label="sealed bids" />
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-wide">Bidding is open</h2>
                    <p className="mt-1 max-w-[55ch] text-ink-2">Close it whenever you like. Closing early gives you no edge: you can&apos;t see the bids either. Bidders then get at least {total}s to reveal.</p>
                    <button className="btn btn-primary mt-4" disabled={!!busy || rows.length === 0} onClick={() => onAction("closeBidding", "Closing bidding…")}>
                      <Gavel size={18} weight="bold" /> {busy ?? (rows.length ? "Close bidding" : "Waiting for the first bid")}
                    </button>
                  </div>
                </>
              )}
              {a.phase === "Reveal" && (
                <>
                  <Ring left={left} total={total} />
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-wide">Bidders are revealing</h2>
                    <p className="mt-1 max-w-[55ch] text-ink-2">
                      <span className="tabular text-ink">{revealed} of {rows.length}</span> opened. Settling runs the fan raffle, then clears the auction. Bids still sealed at that moment forfeit their deposit.
                    </p>
                    <button className="btn btn-primary mt-4" disabled={!!busy || left > 0} onClick={() => onAction("settle", "Settling…")}>
                      <Shuffle size={18} weight="bold" /> {busy ?? (left > 0 ? `Settle unlocks in ${left}s` : "Settle: raffle, then clear")}
                    </button>
                  </div>
                </>
              )}
              {a.phase === "Settled" && (
                <>
                  <Big value={yen(toYen(auctionWinners > 0n ? clearing : reserve))} label="clearing price" />
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-wide">Settled</h2>
                    <p className="mt-1 max-w-[55ch] text-ink-2">
                      {fanWinners.toString()} fan unit{fanWinners === 1n ? "" : "s"} at the retail price (定価), {auctionWinners.toString()} at the clearing price. Bidders claim their units and refunds themselves.
                    </p>
                    <button className="btn btn-primary mt-4" disabled={!!busy || makerFunds === 0n} onClick={() => onAction("withdraw", "Withdrawing…")}>
                      <HandCoins size={18} weight="bold" /> {busy ?? (makerFunds > 0n ? `Withdraw ${yen(toYen(makerFunds))}` : "Proceeds withdrawn")}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Readouts. */}
        <section className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          <Readout icon={<Users size={18} />} label="Bidders" value={rows.length.toString()} />
          <Readout icon={<Eye size={18} />} label="Revealed" value={`${revealed}/${rows.length}`} />
          <Readout icon={<LockSimple size={18} />} label="Escrow held" value={yen(toYen(escrow))} />
          <Readout icon={<Coins size={18} />} label="Above retail" value={a.phase === "Settled" ? yen(toYen(gap)) : "at settle"} accent={a.phase === "Settled"} />
        </section>

        {/* Roster. The maker sees what the chain shows: no amounts until bidders open them. */}
        <section className="border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-ink-2">Bid roster</h3>
            <span className="font-mono text-xs text-ink-3">{a.phase === "Settled" ? "final" : "live, 4s"}</span>
          </div>
          {rows.length === 0 ? (
            <p className="p-6 text-center text-ink-3">No bids yet. Share the drop page at /auction.</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((r, i) => {
                const outcome = a.phase !== "Settled" ? null : !r.revealed ? ["forfeit", "text-bad"] : r.outcome === OUTCOME.fan ? ["fan, retail", "text-fan"] : r.outcome === OUTCOME.auction ? ["won", "text-accent"] : ["lost", "text-ink-3"];
                return (
                  <motion.li key={r.bidder} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-2.5 font-mono text-sm">
                    <span className="text-ink-3 tabular">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate text-ink-2">{short(r.bidder)}</span>
                    <span className="tabular">
                      {r.revealed ? yen(toYen(r.amount)) : <span className="inline-flex items-center gap-1.5 text-accent"><LockSimple size={14} weight="bold" /> sealed</span>}
                    </span>
                    <span className={`w-20 text-right text-xs uppercase ${outcome?.[1] ?? "text-ink-3"}`}>{outcome?.[0] ?? (r.revealed ? "opened" : "")}</span>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Drop configuration: fixed at deploy. */}
      <aside className="space-y-4">
        <div className="border border-line bg-panel p-5">
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-ink-2">Drop config</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Cfg k="Units" v={supply.toString()} />
            <Cfg k="Fan units (raffle)" v={fanUnits.toString()} />
            <Cfg k="Retail price (定価)" v={yen(YEN_FOR_RESERVE)} />
            <Cfg k="Min reveal" v={`${total}s`} />
            <Cfg k="One bid per" v="World ID" />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-ink-3">Set at deploy; the hook enforces them. Redeploy to change.</p>
        </div>
        <div className="border border-line bg-panel p-5">
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-ink-2">Contract</h3>
          <a href={`https://sepolia.etherscan.io/address/${AUCTION_ADDRESS}`} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 font-mono text-sm text-ink hover:text-accent">
            {short(AUCTION_ADDRESS)} <ArrowSquareOut size={14} />
          </a>
          <p className="mt-2 text-xs text-ink-3">Uniswap v4 hook on Sepolia. Bids arrive as swaps through the Universal Router.</p>
        </div>
        {a.phase === "Reveal" && rows.length > revealed && (
          <div className="flex gap-3 border border-bad/50 bg-bad/10 p-4 text-sm text-ink-2">
            <Warning size={20} className="shrink-0 text-bad" />
            {rows.length - revealed} bid{rows.length - revealed === 1 ? " is" : "s are"} still sealed. Give bidders time before you settle.
          </div>
        )}
      </aside>
    </div>
  );
}

function Big({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="grid min-w-36 place-items-center border border-accent/40 bg-accent/5 px-6 py-5 text-center">
      <div className="font-display text-5xl tabular text-accent">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-ink-3">{label}</div>
    </div>
  );
}

/** Reveal countdown. strokeDashoffset is compositor-cheap enough at one update per second. */
function Ring({ left, total }: { left: number; total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-36 w-36 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="6" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke="var(--accent)" strokeWidth="6" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: total ? c * (left / total) : 0 }} transition={{ duration: 1, ease: "linear" }} />
      </svg>
      <div className="text-center">
        <div className="font-display text-4xl tabular">{left}s</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{left ? "until settle" : "ready"}</div>
      </div>
    </div>
  );
}

function Readout({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-panel p-4">
      <div className="flex items-center gap-2 text-ink-3">
        {icon}
        <span className="font-mono text-[11px] uppercase tracking-[0.15em]">{label}</span>
      </div>
      <div className={`mt-2 font-display text-3xl tabular ${accent ? "text-fan" : ""}`}>{value}</div>
    </div>
  );
}

function Cfg({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-3">{k}</dt>
      <dd className="font-mono">{v}</dd>
    </div>
  );
}
