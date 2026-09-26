import { test } from "node:test";
import assert from "node:assert/strict";
import { createPublicClient } from "viem";
import { sepolia } from "viem/chains";
import { sepoliaTransport } from "../lib/rpc";

// A demo must survive its main RPC failing: a dead or rate-limited primary falls through to the
// public endpoints instead of breaking the page.
test("a dead primary RPC falls back to the public endpoints", async () => {
  const client = createPublicClient({ chain: sepolia, transport: sepoliaTransport("https://sepolia.invalid-rpc.example") });
  assert.ok((await client.getBlockNumber()) > 0n);
});
