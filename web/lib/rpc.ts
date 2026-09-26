import { fallback, http } from "viem";

// Public Sepolia endpoints that answered on 2026-09-26. publicnode rate-limits under load, which is
// why a dedicated endpoint (Alchemy, Infura) goes first when configured.
const PUBLIC_SEPOLIA_RPCS = ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.gateway.tenderly.co"];

/** Tries `primary` first, then each public endpoint in turn when one errors or rate-limits. */
export function sepoliaTransport(primary?: string) {
  const urls = [...new Set([primary, ...PUBLIC_SEPOLIA_RPCS].filter((u): u is string => !!u))];
  return fallback(urls.map((url) => http(url)));
}
