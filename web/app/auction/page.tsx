"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IDKitRequestWidget, proofOfHuman, type IDKitResult, type RpContext } from "@worldcoin/idkit";
import type { Hex } from "viem";
import { sepolia } from "wagmi/chains";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eye, EyeSlash, LockSimple, Package, ShieldCheck, Trophy } from "@phosphor-icons/react";
import { AUCTION_ADDRESS, AUCTION_DEPLOY_BLOCK, UNIVERSAL_ROUTER } from "@/lib/auction";
import { bidCall, commitmentOf, randomSecret, universalRouterAbi } from "@/lib/bid";
import {
  OUTCOME,
  YEN_FOR_RESERVE,
  auction,
  loadSaved,
  same,
  short,
  storeSaved,
  useActingWallet,
  useAuction,
  useNow,
  useSend,
  yen,
  type Row,
} from "@/lib/use-auction";
import { SiteNav, WalletBar } from "@/components/chrome";
import { AlertModal, type Alert } from "@/components/modal";
import { DropCard } from "@/components/drop-card";
import { PhaseTrack } from "@/components/phase-track";

const APP_ID = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`;
const ACTION = process.env.NEXT_PUBLIC_WORLD_ACTION as string;
const ENVIRONMENT = process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT as "production" | "staging" | "sandbox";
const TEST_BUYS = process.env.NEXT_PUBLIC_TEST_BUYS === "true";

type Signed = { voucher: { dropId: Hex; buyer: Hex; nullifierHash: string; deadline: string }; signature: Hex };

// Backend and World error codes, in words a bidder understands.
const REJECTIONS: Record<string, { title: string; text: string }> = {
  already_purchased: { title: "Already bid", text: "One bid per person. This World ID has already placed a bid in this drop." },
  max_verifications_reached: { title: "Already bid", text: "One bid per person. This World ID has already been used in this drop." },
  nullifier_replayed: { title: "Proof already used", text: "That verification was already used. Please verify again." },
  signal_mismatch: { title: "Wrong wallet", text: "That proof was made for a different wallet. Verify again with this wallet selected." },
  wrong_credential: { title: "Orb verification needed", text: "This drop needs an Orb-verified World ID." },
  rp_signature_expired: { title: "Request expired", text: "The verification request timed out. Please try again." },
  environment_not_allowed: { title: "Verification closed", text: "World ID test verification is closed for this app right now. The site owner needs to reopen it." },
};

const PRESETS = [3000, 6000, 10000, 15000];

export default function AuctionPage() {
  const wallet = useActingWallet();
  const address = wallet.address;
  const a = useAuction();
  const now = useNow();
  const [alert, setAlert] = useState<Alert>(null);
  const fail = (title: string, text: string) => setAlert({ tone: "bad", title, text });
  const { busy, setBusy, send } = useSend(fail, () => Promise.all([a.ready && a.refetch(), refetchOwned(), refetchSaved()]));

  const client = a.client;
  const phase = a.ready ? a.phase : undefined;
  const { data: owned = [], refetch: refetchOwned } = useQuery({
    queryKey: ["auction-owned", AUCTION_ADDRESS, address, a.ready && a.rows.filter((r) => r.claimed).length],
    enabled: !!client && !!address && phase === "Settled",
    queryFn: async () => {
      const logs = await client!.getContractEvents({ ...auction, eventName: "Transfer", args: { to: address }, fromBlock: AUCTION_DEPLOY_BLOCK });
      const ids = [...new Set(logs.map((l) => l.args.tokenId!))];
      const units = await Promise.all(
        ids.map(async (id) => {
          const owner = await client!.readContract({ ...auction, functionName: "ownerOf", args: [id] }).catch(() => null);
          if (!same(owner ?? undefined, address)) return null;
          return { id, paid: await client!.readContract({ ...auction, functionName: "paidFor", args: [id] }) };
        }),
      );
      return units.filter((u) => u !== null);
    },
  });
  const { data: saved, refetch: refetchSaved } = useQuery({ queryKey: ["saved-bid", AUCTION_ADDRESS, address], enabled: !!address, queryFn: () => loadSaved(address!) });

  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  // A ref too: IDKit's onSuccess closure is from the render before handleVerify stored the voucher.
  const signedRef = useRef<Signed | null>(null);
  const [signed, setSignedState] = useState<Signed | null>(null);
  const setSigned = (s: Signed | null) => {
    signedRef.current = s;
    setSignedState(s);
  };
  const [worldIdOn, setWorldIdOn] = useState(true);
  const [bidYen, setBidYen] = useState("");
  const [depositYen, setDepositYen] = useState("");
  const testMode = TEST_BUYS && !worldIdOn;

  if (!a.ready) return <Skeleton />;

  const { rows, reserve, clearing, auctionWinners, fanWinners, supply, fanUnits, toYen, fromYen } = a;
  const mine = rows.find((r) => same(r.bidder, address));
  const settleIn = Math.max(0, Math.ceil((a.settleAt - now) / 1000));
  const myAmount = saved ? BigInt(saved.amount) : mine?.revealed ? mine.amount : undefined;

  // Deposit defaults to the next ¥10,000 step strictly above the bid, so it never equals the bid.
  const bidNum = Number(bidYen);
  const autoDeposit = bidNum > 0 ? (Math.floor(bidNum / 10_000) + 1) * 10_000 : 0;
  const depositNum = depositYen === "" ? autoDeposit : Number(depositYen);
  const bidValid = bidNum >= YEN_FOR_RESERVE && depositNum >= bidNum;

  function resetForm() {
    setSigned(null);
    setBidYen("");
    setDepositYen("");
  }

  async function testBid() {
    setBusy("Getting a test voucher…");
    try {
      const res = await fetch("/api/test-voucher", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ buyer: address, drop: "auction" }) });
      if (!res.ok) throw new Error("Test mode is not enabled on the server.");
      await placeBid(await res.json());
    } catch (e) {
      fail("Test bid failed", e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  async function startVerify() {
    setBusy("Preparing verification…");
    try {
      const res = await fetch("/api/rp-context", { method: "POST" });
      if (!res.ok) throw new Error("Could not start World ID verification.");
      setRpContext(await res.json());
      setWidgetOpen(true);
    } catch (e) {
      fail("World ID unavailable", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleVerify(result: IDKitResult) {
    const res = await fetch("/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ buyer: address, result, drop: "auction" }) });
    const body = await res.json();
    if (!res.ok) {
      const r = REJECTIONS[body.code] ?? { title: "Verification failed", text: body.message ?? "World ID could not verify this proof." };
      setAlert({ tone: "bad", ...r });
      setWidgetOpen(false);
      throw new Error(body.code);
    }
    setSigned(body);
  }

  async function placeBid(voucher = signedRef.current) {
    if (!voucher || !address) return;
    const amount = fromYen(bidNum);
    const deposit = fromYen(depositNum);
    // Saved before sending: if the bid lands, the secret to open it must already be here.
    const secret = randomSecret();
    try {
      storeSaved(address, { amount: amount.toString(), secret });
    } catch {
      fail("Browser storage blocked", "This browser won't store your bid's secret, so the bid could never be revealed. Try another browser.");
      return;
    }
    const v = voucher.voucher;
    const call = bidCall(
      { dropId: v.dropId, buyer: v.buyer, nullifierHash: BigInt(v.nullifierHash), deadline: BigInt(v.deadline) },
      voucher.signature,
      commitmentOf(amount, secret, address),
      deposit,
    );
    const ok = await send("Confirm the sealed bid in your wallet…", (w) =>
      w({ address: UNIVERSAL_ROUTER, abi: universalRouterAbi, functionName: "execute", chainId: sepolia.id, account: address, ...call }),
    );
    if (ok) {
      setAlert({
        tone: "good",
        title: "Sealed",
        text: `Your ${yen(bidNum)} bid is locked in. Nobody can see it, not even the brand, until you reveal it after bidding closes.`,
      });
      resetForm();
    }
  }

  async function reveal() {
    const s = loadSaved(address!);
    if (!s) return;
    const ok = await send("Confirm the reveal in your wallet…", (w) =>
      w({ ...auction, functionName: "reveal", chainId: sepolia.id, account: address, args: [BigInt(s.amount), s.secret] }),
    );
    if (ok) setAlert({ tone: "good", title: "Revealed", text: `Your ${yen(toYen(BigInt(s.amount)))} bid is open. Results come when the brand settles.` });
  }

  async function claim() {
    const won = !!mine?.outcome;
    const ok = await send("Confirm in your wallet…", (w) => w({ ...auction, functionName: "claim", chainId: sepolia.id, account: address }));
    if (ok) setAlert({ tone: "good", title: won ? "Claimed" : "Refunded", text: won ? "Your receipt for the keychain is in your wallet, and the rest of your deposit is back. Redeem it with the brand to have the keychain shipped." : "Your full deposit is back in your wallet." });
  }

  // ---- The one action that matters right now, for this wallet. ----
  let action: React.ReactNode;
  if (!wallet.isConnected || wallet.wrongChain) action = <p className="text-ink-2">Connect a wallet on Sepolia to take part.</p>;
  else if (phase === "Bidding" && mine)
    action = (
      <Callout icon={<LockSimple size={22} weight="bold" />} title="Your sealed bid is in">
        {myAmount !== undefined ? `You bid ${yen(toYen(myAmount))}. ` : ""}Come back to reveal it when the brand closes bidding.
      </Callout>
    );
  else if (phase === "Bidding")
    action = (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="hud mb-1.5 block">Your bid (¥)</span>
            <input type="number" inputMode="numeric" min={YEN_FOR_RESERVE} step={500} value={bidYen} placeholder={`${YEN_FOR_RESERVE} or more`} onChange={(e) => setBidYen(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="hud mb-1.5 block">Deposit (¥)</span>
            <input type="number" inputMode="numeric" min={bidNum || 0} step={1000} value={depositYen} placeholder={autoDeposit ? String(autoDeposit) : "auto"} onChange={(e) => setDepositYen(e.target.value)} className="field" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setBidYen(String(p))} className={`rounded border px-3 py-1 font-mono text-sm transition-colors ${bidNum === p ? "border-accent text-accent" : "border-line text-ink-2 hover:border-line-strong"}`}>
              {yen(p)}
            </button>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-ink-3">
          Bid the most it&apos;s worth to you. Winners pay one shared price, the highest losing bid, never their own bid. The deposit is at least your bid, so it hides it; the difference comes back.
        </p>
        {signed ? (
          <button className="btn btn-primary w-full" disabled={!!busy || !bidValid} onClick={() => void placeBid()}>
            {busy ?? (
              <>
                <ShieldCheck size={18} weight="bold" /> Verified. Seal my bid
              </>
            )}
          </button>
        ) : (
          <button className={`btn w-full ${testMode ? "bg-bad text-white" : "btn-primary"}`} disabled={!!busy || !bidValid} onClick={() => void (testMode ? testBid() : startVerify())}>
            {busy ?? (testMode ? "Test bid (no World ID)" : (
              <>
                <ShieldCheck size={18} weight="bold" /> Verify with World ID and seal bid
              </>
            ))}
          </button>
        )}
      </div>
    );
  else if (phase === "Reveal" && mine && !mine.revealed)
    action = saved ? (
      <button className="btn btn-primary w-full" disabled={!!busy} onClick={() => void reveal()}>
        {busy ?? (
          <>
            <Eye size={18} weight="bold" /> Reveal my {yen(toYen(BigInt(saved.amount)))} bid
          </>
        )}
      </button>
    ) : (
      <Callout tone="bad" title="Secret not in this browser">Your bid can only be opened from the browser you bid from.</Callout>
    );
  else if (phase === "Reveal")
    action = (
      <Callout icon={<EyeSlash size={22} />} title={mine ? "Revealed" : "Reveal in progress"}>
        Results arrive when the brand settles{settleIn > 0 ? `, in ${settleIn}s at the earliest` : ""}.
      </Callout>
    );
  else if (mine && mine.revealed && !mine.claimed) {
    const price = mine.outcome === OUTCOME.fan ? reserve : mine.outcome === OUTCOME.auction ? clearing : 0n;
    action = (
      <div className="space-y-3">
        {mine.outcome ? (
          <Callout tone="good" icon={<Trophy size={22} weight="fill" />} title={mine.outcome === OUTCOME.fan ? "You won the fan raffle" : "You won"}>
            You pay {yen(toYen(price))}{myAmount !== undefined && myAmount > price ? `, not your ${yen(toYen(myAmount))} bid` : ""}. The rest of your deposit comes back.
          </Callout>
        ) : (
          <Callout title="Not this time">Your whole deposit comes back.</Callout>
        )}
        <button className="btn btn-primary w-full" disabled={!!busy} onClick={() => void claim()}>
          {busy ?? (mine.outcome ? `Claim unit + ${yen(toYen(mine.deposit - price))}` : `Claim ${yen(toYen(mine.deposit))} back`)}
        </button>
      </div>
    );
  } else if (mine && !mine.revealed) action = <Callout tone="bad" title="Deposit forfeited">Your bid wasn&apos;t revealed in time.</Callout>;
  else if (mine) action = <Callout title="All done">You&apos;ve claimed everything from this drop.</Callout>;
  else action = <Callout title="Drop settled">This drop is over. Watch for the next one.</Callout>;

  return (
    <>
      <SiteNav
        right={
          <div className="flex items-center gap-3">
            {TEST_BUYS && (
              <button role="switch" aria-checked={worldIdOn} onClick={() => setWorldIdOn((v) => !v)} className={`hidden rounded border px-2.5 py-1.5 font-mono text-xs sm:block ${worldIdOn ? "border-human/50 text-human" : "border-bad text-bad"}`}>
                World ID {worldIdOn ? "on" : "off"}
              </button>
            )}
            <WalletBar wallet={wallet} maker={a.maker} onPick={resetForm} />
          </div>
        }
      />
      {testMode && (
        <div role="alert" className="border-b border-bad bg-bad/10 px-4 py-2 text-center text-sm text-bad">
          Test mode: World ID is off and each bid uses a made-up identity. Use a different wallet per bid.
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 pb-24 md:px-8">
        <section className="grid items-start gap-10 py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:py-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mx-auto w-full max-w-sm">
            <DropCard edition={supply.toString().padStart(3, "0")} serial="???" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
            <div>
              <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-wide md:text-6xl">Evangelion holo keychain</h1>
              <p className="mt-3 max-w-[60ch] text-ink-2">
                {supply.toString()} units. {fanUnits.toString()} raffled to fans at the retail price (定価) of {yen(YEN_FOR_RESERVE)}. The other {(supply - fanUnits).toString()} go to the highest sealed bids, all at one price. One bid per verified human.
              </p>
            </div>
            <PhaseTrack phase={a.phase} revealLeft={settleIn} revealTotal={Number(a.minReveal)} />
            <div className="panel notch p-5">{action}</div>
            <Link href="/#how" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
              How the price is set <ArrowRight size={14} />
            </Link>
          </motion.div>
        </section>

        <BidBoard rows={rows} phase={a.phase} you={address} myAmount={myAmount} toYen={toYen} reserve={reserve} clearing={clearing} auctionWinners={auctionWinners} />

        {a.phase === "Settled" && (
          <section className="mt-6 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
            <Stat label="Fan units at retail (定価)" value={`${fanWinners} × ${yen(YEN_FOR_RESERVE)}`} />
            <Stat label="Auction units" value={`${auctionWinners} × ${yen(toYen(auctionWinners > 0n ? clearing : reserve))}`} />
            <Stat label="Above retail, to the brand" value={yen(toYen(auctionWinners * (clearing - reserve)))} accent sub="the gap scalpers used to take" />
          </section>
        )}

        {owned.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-3xl uppercase tracking-wide">Your keychains</h2>
            <p className="mt-1 text-ink-2">Each on-chain receipt is a claim on one physical keychain. The brand ships it when you redeem.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {owned.map(({ id, paid }) => (
                <li key={id.toString()} className="panel flex items-center gap-4 p-4">
                  <Package size={28} className="text-accent" />
                  <div>
                    <div className="font-mono">Receipt #{id.toString()}</div>
                    <div className="text-sm text-ink-2">Paid {yen(toYen(paid))}. Redeem with the brand to have it shipped.</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="mt-10 font-mono text-xs text-ink-3">
          Demo scale: {(Number(reserve) / 1e18).toString()} ETH on Sepolia is shown as {yen(YEN_FOR_RESERVE)}. Sample merch for the demo: Evangelion is a
          trademark of its owners, and this project is not affiliated with them.
        </p>
      </main>

      <AlertModal alert={alert} onClose={() => setAlert(null)} />
      {rpContext && address && (
        <IDKitRequestWidget
          key={rpContext.nonce}
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={APP_ID}
          action={ACTION}
          rp_context={rpContext}
          allow_legacy_proofs={false}
          preset={proofOfHuman({ signal: address })}
          environment={ENVIRONMENT}
          handleVerify={handleVerify}
          onSuccess={() => void placeBid()}
          onError={(code) =>
            // handleVerify already explained a rejection; this covers cancels and widget errors.
            setAlert((x) => x ?? { tone: "bad", title: "Verification cancelled", text: `World ID didn't complete (code: ${String(code)}). Try again when ready.` })
          }
        />
      )}
    </>
  );
}

function Callout({ title, children, icon, tone }: { title: string; children: React.ReactNode; icon?: React.ReactNode; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-fan" : tone === "bad" ? "text-bad" : "text-accent";
  return (
    <div className="flex gap-3">
      {icon && <div className={`mt-0.5 ${color}`}>{icon}</div>}
      <div>
        <div className={`font-display text-xl uppercase tracking-wide ${color}`}>{title}</div>
        <div className="mt-1 text-ink-2">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-panel p-5">
      <div className="hud">{label}</div>
      <div className={`mt-1 font-display text-3xl tabular ${accent ? "text-fan" : ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-sm text-ink-3">{sub}</div>}
    </div>
  );
}

/** The bid board. Until settlement every other bid is only an address and a seal: amounts and
 *  deposits stay off screen. Your own bid is the one row you can read. */
function BidBoard(p: {
  rows: Row[];
  phase: "Bidding" | "Reveal" | "Settled";
  you?: string;
  myAmount?: bigint;
  toYen: (w: bigint) => number;
  reserve: bigint;
  clearing: bigint;
  auctionWinners: bigint;
}) {
  const settled = p.phase === "Settled";
  const rows = settled
    ? [...p.rows].sort((a, b) => (a.revealed === b.revealed ? Number(b.amount - a.amount) : a.revealed ? -1 : 1))
    : [...p.rows].sort((a, b) => Number(same(b.bidder, p.you)) - Number(same(a.bidder, p.you)));
  const top = Math.max(...p.rows.map((r) => p.toYen(r.revealed ? r.amount : 0n)), p.toYen(p.clearing), YEN_FOR_RESERVE) * 1.12;
  const frac = (y: number) => y / top;
  const revealed = p.rows.filter((r) => r.revealed).length;

  return (
    <section>
      <div className={`${settled ? "mb-10" : "mb-4"} flex flex-wrap items-end justify-between gap-2`}>
        <h2 className="font-display text-3xl uppercase tracking-wide">
          {settled ? "Results" : "Sealed bids"} <span className="tabular text-ink-3">{p.rows.length}</span>
        </h2>
        <p className="text-sm text-ink-3">
          {p.phase === "Bidding" ? "Amounts stay sealed. You see who bid, not how much." : p.phase === "Reveal" ? `${revealed} of ${p.rows.length} opened. Amounts publish at settlement.` : "Fan raffle at the retail price (定価) first. Everyone else pays the highest losing bid."}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="panel grid place-items-center gap-2 p-10 text-center text-ink-3">
          <LockSimple size={28} />
          No bids yet. The first sealed bid shows up here.
        </div>
      ) : (
        <div className="relative">
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {rows.map((r) => {
                const you = same(r.bidder, p.you);
                return (
                  <motion.li
                    key={r.bidder}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]"
                  >
                    <span className={`truncate font-mono text-sm ${you ? "text-accent" : "text-ink-2"}`}>{you ? "YOU" : short(r.bidder)}</span>
                    {settled ? <ResultBar r={r} you={you} frac={frac(p.toYen(r.revealed ? r.amount : 0n))} toYen={p.toYen} reserve={p.reserve} /> : <SealedBar r={r} you={you} myAmount={p.myAmount} toYen={p.toYen} />}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {settled && (
            <div className="pointer-events-none absolute inset-y-0 right-0 left-[7.25rem] sm:left-[9.75rem]">
              <Marker x={frac(YEN_FOR_RESERVE)} color="var(--fan)" dashed label={`Retail (定価) ${yen(YEN_FOR_RESERVE)}`} />
              {p.auctionWinners > 0n && p.clearing > p.reserve && <Marker x={frac(p.toYen(p.clearing))} color="var(--accent)" label={`Clearing ${yen(p.toYen(p.clearing))}`} top />}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SealedBar({ r, you, myAmount, toYen }: { r: Row; you: boolean; myAmount?: bigint; toYen: (w: bigint) => number }) {
  if (you)
    return (
      <div className="flex h-11 items-center justify-between gap-3 border border-accent bg-accent/10 px-3">
        <span className="flex items-center gap-2 font-mono text-sm">
          <Eye size={16} className="text-accent" />
          {myAmount !== undefined ? <span className="text-ink">{yen(toYen(myAmount))}</span> : "Your bid"}
          <span className="hidden text-ink-3 sm:inline">only you can see this</span>
        </span>
        <span className="hud">{r.revealed ? "opened" : "sealed"}</span>
      </div>
    );
  return (
    <div className={`flex h-11 items-center justify-between px-3 ${r.revealed ? "border border-line bg-panel" : "hazard border border-accent/30"}`}>
      <span className="relative flex items-center gap-2 text-sm">
        {r.revealed ? <EyeSlash size={16} className="text-ink-3" /> : <LockSimple size={16} weight="bold" className="text-accent" />}
        <span className="font-jp text-base text-ink">{r.revealed ? "開" : "封"}</span>
        <span className="text-ink-2">{r.revealed ? "Opened, amount hidden until settlement" : "Sealed bid"}</span>
      </span>
    </div>
  );
}

function ResultBar({ r, you, frac, toYen, reserve }: { r: Row; you: boolean; frac: number; toYen: (w: bigint) => number; reserve: bigint }) {
  const tag = !r.revealed ? "forfeited" : r.outcome === OUTCOME.fan ? "fan raffle, pays retail" : r.outcome === OUTCOME.auction ? "won" : r.amount < reserve ? "below retail" : "lost";
  const color = r.outcome === OUTCOME.fan ? "var(--fan)" : r.outcome === OUTCOME.auction ? "var(--accent)" : "var(--ink-3)";
  return (
    <div className={`relative h-11 ${you ? "outline outline-1 outline-offset-2 outline-accent" : ""}`}>
      <motion.div
        className="absolute inset-y-0 left-0 w-full origin-left"
        style={{ background: color, opacity: r.outcome ? 0.5 : 0.22 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: r.revealed ? frac : 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <span className="absolute inset-y-0 left-3 flex items-center gap-2 font-mono text-sm text-ink [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {r.revealed ? yen(toYen(r.amount)) : "never revealed"}
        <span className="text-ink/75">{tag}</span>
      </span>
    </div>
  );
}

function Marker({ x, color, label, dashed, top }: { x: number; color: string; label: string; dashed?: boolean; top?: boolean }) {
  return (
    <motion.div className="absolute inset-y-0 left-0 w-full" initial={{ x: "0%" }} animate={{ x: `${x * 100}%` }} transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <div className={`absolute -top-2 -bottom-2 left-0 ${dashed ? "border-l-2 border-dashed" : "border-l-2"}`} style={{ borderColor: color }} />
      <div className={`absolute left-0 -translate-x-1/2 whitespace-nowrap font-mono text-xs ${top ? "-top-7" : "-bottom-7"}`} style={{ color }}>
        {label}
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto grid w-full max-w-7xl animate-pulse gap-10 px-4 py-14 md:grid-cols-[5fr_7fr] md:px-8">
        <div className="notch mx-auto aspect-[5/7] w-full max-w-sm bg-panel" />
        <div className="space-y-5">
          <div className="h-14 w-3/4 bg-panel" />
          <div className="h-5 w-full bg-panel" />
          <div className="h-16 bg-panel" />
          <div className="h-48 bg-panel" />
        </div>
      </main>
    </>
  );
}
