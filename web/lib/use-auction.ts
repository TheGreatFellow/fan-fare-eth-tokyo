"use client";

// State and plumbing shared by the bidder page (/auction) and the maker console (/admin).
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BaseError, ContractFunctionRevertedError, type Address, type Hex } from "viem";
import { useConnection, usePublicClient, useReadContracts, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { AUCTION_ADDRESS, auctionAbi } from "@/lib/auction";

// Sepolia amounts are tiny, so yen is shown at a demo scale where the reserve (定価) reads ¥3,000.
export const YEN_FOR_RESERVE = 3000;
export const auction = { address: AUCTION_ADDRESS, abi: auctionAbi } as const;
export const PHASES = ["Bidding", "Reveal", "Settled"] as const;
export const OUTCOME = { none: 0, fan: 1, auction: 2 } as const;

export type Row = { bidder: Address; deposit: bigint; amount: bigint; revealed: boolean; claimed: boolean; outcome: number };

export const yen = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;
export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

// The secret that opens a sealed bid lives only in this browser (SPEC §8.2: lose it, lose the bid).
const savedKey = (who: string) => `fair-drop:bid:${AUCTION_ADDRESS}:${who.toLowerCase()}`;
export type Saved = { amount: string; secret: Hex };
export function loadSaved(who: string): Saved | null {
  try {
    return JSON.parse(localStorage.getItem(savedKey(who)) ?? "null");
  } catch {
    return null;
  }
}
export function storeSaved(who: string, s: Saved) {
  localStorage.setItem(savedKey(who), JSON.stringify(s));
}

export function txMessage(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      switch (revert.data?.errorName) {
        case "BadReveal":
          return "That bid doesn't match your sealed commitment.";
        case "RevealTooShort":
          return "The reveal window is still open. Wait for the countdown.";
        case "WrongPhase":
          return "The auction has moved to a different phase. The page will refresh.";
        case "NotMaker":
          return "Only the maker wallet can do that.";
        default:
          return `Transaction failed: ${revert.data?.errorName ?? revert.shortMessage}`;
      }
    }
    if (/reject|denied|cancel/i.test(e.shortMessage)) return "Cancelled in your wallet.";
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : String(e);
}

export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** Demo convenience: with several accounts connected, pick which one acts. Every write passes it
 *  as `account`, so the wallet signs as that account without switching in the extension. */
export function useActingWallet() {
  const conn = useConnection();
  const [picked, setPicked] = useState<Address | null>(null);
  const address = picked && conn.addresses?.some((a) => same(a, picked)) ? picked : conn.address;
  async function addWallet() {
    const provider = (await conn.connector?.getProvider()) as { request(a: { method: string; params?: unknown[] }): Promise<unknown> } | undefined;
    await provider?.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] }).catch(() => {});
  }
  return { ...conn, address, pick: setPicked, addWallet, wrongChain: conn.isConnected && conn.chainId !== sepolia.id };
}

export function useAuction() {
  const client = usePublicClient({ chainId: sepolia.id });
  const { data, refetch } = useReadContracts({
    contracts: [
      { ...auction, functionName: "maker" },
      { ...auction, functionName: "phase" },
      { ...auction, functionName: "supply" },
      { ...auction, functionName: "fanUnits" },
      { ...auction, functionName: "reservePrice" },
      { ...auction, functionName: "minRevealTime" },
      { ...auction, functionName: "revealStart" },
      { ...auction, functionName: "clearingPrice" },
      { ...auction, functionName: "fanWinners" },
      { ...auction, functionName: "auctionWinners" },
      { ...auction, functionName: "biddersCount" },
      { ...auction, functionName: "makerFunds" },
    ],
    allowFailure: false,
    query: { refetchInterval: 4000 },
  });
  const count = data?.[10];
  const phaseN = data?.[1];

  // Every bid, re-read whenever the bid count or phase moves (and on the 4s poll).
  const { data: rows = [], refetch: refetchRows } = useQuery({
    queryKey: ["bids", count?.toString(), phaseN],
    enabled: !!client && count !== undefined,
    refetchInterval: 4000,
    queryFn: async (): Promise<Row[]> => {
      const bidders = await client!.multicall({
        contracts: Array.from({ length: Number(count) }, (_, i) => ({ ...auction, functionName: "bidders", args: [BigInt(i)] }) as const),
        allowFailure: false,
      });
      const bids = await client!.multicall({
        contracts: bidders.map((b) => ({ ...auction, functionName: "bids", args: [b] }) as const),
        allowFailure: false,
      });
      return bids.map(([, deposit, amount, revealed, claimed, outcome], i) => ({ bidder: bidders[i], deposit, amount, revealed, claimed, outcome }));
    },
  });

  if (!data) return { client, ready: false as const };
  const [maker, , supply, fanUnits, reserve, minReveal, revealStart, clearing, fanWinners, auctionWinners, , makerFunds] = data;
  return {
    client,
    ready: true as const,
    rows,
    maker,
    phase: PHASES[phaseN!],
    supply,
    fanUnits,
    reserve,
    minReveal,
    revealStart,
    clearing,
    fanWinners,
    auctionWinners,
    makerFunds,
    settleAt: Number(revealStart + minReveal) * 1000,
    toYen: (wei: bigint) => (Number(wei) * YEN_FOR_RESERVE) / Number(reserve),
    fromYen: (y: number) => (BigInt(Math.round(y)) * reserve) / BigInt(YEN_FOR_RESERVE),
    refetch: () => Promise.all([refetch(), refetchRows()]),
  };
}

/** Sends a transaction, waits for it, refreshes. Errors go to `onError` (the error modal). */
export function useSend(onError: (title: string, text: string) => void, after?: () => Promise<unknown>) {
  const write = useWriteContract();
  const client = usePublicClient({ chainId: sepolia.id });
  const [busy, setBusy] = useState<string | null>(null);
  async function send(label: string, run: (w: typeof write.mutateAsync) => Promise<Hex>): Promise<boolean> {
    setBusy(label);
    try {
      const hash = await run(write.mutateAsync);
      setBusy("Waiting for the block…");
      const receipt = await client!.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("The transaction reverted.");
      await after?.();
      return true;
    } catch (e) {
      onError("Transaction didn't go through", txMessage(e));
      return false;
    } finally {
      setBusy(null);
    }
  }
  return { busy, setBusy, send };
}
