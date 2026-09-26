# Fanfare

*fan·fare, n. 2. the fair fare for fans.*

**Scalper-proof drops for physical merch, run as a sealed-bid auction inside a Uniswap v4 hook, with
one bid per human via World ID.**

ETHGlobal Tokyo 2026 · solo build · Sepolia

- **Live:** [fanfare-drop.vercel.app](https://fanfare-drop.vercel.app): pitch page, [drop](https://fanfare-drop.vercel.app/auction), [brand console](https://fanfare-drop.vercel.app/admin)
- **Hook:** [`AuctionDrop` at `0xB3Eb…E888`](https://sepolia.etherscan.io/address/0xB3Eb8115a0E780234b48DEd2FD0811ef79DDE888)

## The problem

Limited anime goods, designer toys and collabs sell at the retail price (定価) and sell out in
seconds, mostly to bots and multi-account buyers. Then they resell at 5–10x. The gap between retail
and what fans will really pay goes to scalpers, not to the brand or the fans.

## Fan-First Vickrey

1. **One sealed bid per human.** World ID proof of human is required to bid, so bots can't enter.
   Each bid is a hidden commitment backed by a deposit of at least the bid.
2. **Fans first.** Some units are raffled at retail among everyone who bid at least retail. Bid size
   doesn't change your raffle odds.
3. **One price for the rest.** The remaining units go to the highest bids, and every winner pays the
   highest losing bid. This is the multi-unit Vickrey (second-price) auction: your bid decides
   *whether* you win, never *what* you pay.
   - Bidding low only costs you units you'd have paid for.
   - Overbidding risks paying a runner-up's inflated bid.
   - Bidding your true value is the best strategy. That holds because World ID gives every bidder
     exactly one unit of demand.

Fans still get retail units, the brand earns the gap, and a scalper who wins has already paid the
market price. Winners receive an on-chain receipt that the brand redeems by shipping the item.

## Built on Uniswap v4

The whole auction is a v4 hook ([`src/AuctionDrop.sol`](src/AuctionDrop.sol)), built on
OpenZeppelin `uniswap-hooks` `BaseAsyncSwap`. **A sealed bid is a swap.**

```
wallet ─ execute() ─▶ Universal Router ─ V4_SWAP ─▶ PoolManager ─ beforeSwap ─▶ AuctionDrop hook
                       SWAP_EXACT_IN_SINGLE                          • verify World ID voucher (EIP-712, hookData)
                       + SETTLE_ALL                                  • store the sealed commitment
                                                                     • keep the whole input as ERC-6909 claims
                                                                     • return a delta that nets the swap to zero
```

- **Permissions:** `beforeInitialize` (binds the hook to one pool, opened by the brand),
  `beforeAddLiquidity` (outside liquidity blocked), `beforeSwap` + `beforeSwapReturnsDelta` (async
  bids; ordinary swaps rejected).
- **Mined address:** `HookMiner` + CREATE2 gives an address whose low bits encode those flags.
- **Settlement:** claims and brand withdrawals burn ERC-6909 claims and `take` ETH inside
  `unlockCallback`, so deposits never leave the PoolManager until someone is paid.
- **Pool pair:** ETH against the hook contract itself. The second currency is never paid out, so
  the router needs no `TAKE` step.
- **No custom bid contract:** the web app sends a stock Universal Router transaction
  ([`web/lib/bid.ts`](web/lib/bid.ts)). Any client that can build a v4 swap can bid.
- **Real bidder:** the router is the swap sender, so the voucher is bound to `tx.origin`.

| | Sepolia |
|---|---|
| AuctionDrop hook | `0xB3Eb8115a0E780234b48DEd2FD0811ef79DDE888` |
| PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |
| Universal Router | `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` |
| Drop (Phase 1 curve drop) | `0x897d36a3d028776c3cdfc2e5a468544fdd1eb9d3` |

## World ID

IDKit 4.3 / World ID 4.0, `proof_of_human`, verified server-side on World's v4 endpoint
([`web/lib/world.ts`](web/lib/world.ts)):
- the proof's signal must be the bidder's wallet;
- the environment and credential are pinned;
- nullifiers are compared as numbers.

The backend then signs a voucher carrying the person's nullifier, and the hook records it. One bid
per human is therefore enforced on-chain. Integration notes for World are in
[`docs/world-debrief.md`](docs/world-debrief.md).

## Repo

| Path | What |
|---|---|
| `src/AuctionDrop.sol` | The v4 hook: bidding, reveal, raffle, clearing, claims |
| `src/Drop.sol` | Phase 1: retail-then-curve drop with sell-back (live at `/curve`) |
| `test/` | Foundry tests, incl. a solvency fuzz and a fork test through the real Universal Router |
| `script/` | Deploy scripts (hook address mining, pool init) |
| `web/` | Next.js app: pitch page, drop page, brand console, World ID + voucher API |

## Run locally

Needs Foundry and Node 22.

```bash
git clone --recurse-submodules <repo> && cd <repo>
cp .env.example .env         # RPC URL, keys, World app/RP IDs, signing key
forge test
cd web && ln -s ../.env .env && npm install && npm test && npm run dev
```

World ID runs in `sandbox` (the World ID Sandbox app).

`ALLOW_UNVERIFIED_TEST_BUYS=true` adds a test switch that issues vouchers without World ID. It's
for exercising multi-bidder flows alone, and it is never available with
`WORLD_ENVIRONMENT=production`.

## Notes

- **Raffle randomness:** `prevrandao`.
- **Prices:** yen is shown at a fixed demo scale (0.0002 ETH = ¥3,000).
- **Former name:** *Fair Drop*. IDs that are already deployed (drop IDs, the World action) keep it.
- **AI usage:** see [`docs/AI.md`](docs/AI.md).
