"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConnect, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Plus, SignOut, Wallet } from "@phosphor-icons/react";
import type { Address } from "viem";
import { same, short, type useActingWallet } from "@/lib/use-auction";

export function Brand() {
  return (
    // FAN + FARE: the fair fare for fans. 公平 means "fair".
    <Link href="/" className="group flex items-baseline gap-2" aria-label="Fanfare home">
      <span className="font-display text-2xl uppercase tracking-wide">
        Fan<span className="text-accent">fare</span>
      </span>
      <span className="font-jp text-lg text-accent transition-transform group-hover:-translate-y-0.5">公平</span>
    </Link>
  );
}

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/auction", label: "The drop" },
  { href: "/admin", label: "Brand console" },
];

export function SiteNav({ right }: { right?: React.ReactNode }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded px-3 py-1.5 text-sm transition-colors hover:text-ink ${path === l.href ? "bg-white/5 text-ink" : "text-ink-2"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        {right}
      </div>
    </header>
  );
}

type Wallet = ReturnType<typeof useActingWallet>;

/** Connect, pick the acting account (demo: several bidders from one browser), add, disconnect. */
export function WalletBar({ wallet, maker, onPick }: { wallet: Wallet; maker?: string; onPick?: (a: Address) => void }) {
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  if (!wallet.isConnected || !wallet.address)
    return (
      <button className="btn btn-primary !py-2 text-sm" disabled={!connectors[0] || connect.isPending} onClick={() => connect.mutate({ connector: connectors[0] })}>
        <Wallet size={16} weight="bold" /> Connect wallet
      </button>
    );
  if (wallet.wrongChain)
    return (
      <button className="btn btn-primary !py-2 text-sm" onClick={() => switchChain.mutate({ chainId: sepolia.id })}>
        Switch to Sepolia
      </button>
    );
  return (
    <div className="flex items-center gap-2 text-sm">
      <select
        aria-label="Acting wallet"
        value={wallet.address}
        onChange={(e) => {
          wallet.pick(e.target.value as Address);
          onPick?.(e.target.value as Address);
        }}
        className="field !w-auto !py-1.5 !text-sm"
      >
        {(wallet.addresses ?? [wallet.address]).map((a) => (
          <option key={a} value={a}>
            {short(a)}
            {same(a, maker) ? "  (brand)" : ""}
          </option>
        ))}
      </select>
      <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={() => void wallet.addWallet()} title="Connect another account" aria-label="Connect another account">
        <Plus size={16} />
      </button>
      <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={() => disconnect.mutate({})} title="Disconnect" aria-label="Disconnect">
        <SignOut size={16} />
      </button>
    </div>
  );
}
