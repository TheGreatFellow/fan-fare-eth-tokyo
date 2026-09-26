# Themed revamp: pitch-deck home, sealed board, maker console

**Tool:** Claude Code (Opus 5.5), 2026-09-26, ~20:00–21:30 JST, on branch `feat/pitch-revamp`.

**Prompt (builder, condensed):** shorten the reveal window to 30s for the demo; hide other bidders'
bids (show only the address and that they bid, visibly sealed; your own bid clearly visible); a
separate, more intuitive admin console; a proper modal for World ID failures; a home page that works
as a pitch deck (problem, why, what, how, a clear and animated Vickrey explanation, the raffle +
Vickrey fusion, use cases) with a jargon name for the mechanism; smooth animations; a theme for
limited anime merch (Evangelion, Gundam, BE@RBRICK collabs).

## Decisions

- **Name:** "Proof-of-Fan Clearing". "Proof-of-" reads as web3, "clearing" is the market term for a
  uniform-price auction, and it's still descriptive.
- **Theme:** one dark theme, mecha command-deck look: orange warning accent, 定価 green, hazard
  stripes for sealed bids, Anton for display, Noto Serif JP for title-card kanji. No franchise art or
  logos; the product card is an original foil "限定" plate.
- **What stays hidden:** until settlement, other bids show only an address and a seal (sealed or
  opened). Your amount comes from the secret saved in your browser. After settlement, amounts are
  shown: they are public on chain then, and the results chart needs them. The maker console shows
  amounts once a bidder reveals, for the same reason. Deposits are on chain too, so the hiding is a
  UI choice, not a secrecy guarantee; the commitment is what keeps the bid sealed.
- **Reveal window:** default 30s (was 120s). Contract unchanged; the deploy default changed and a
  fresh auction was deployed (`0xB3Eb…E888`) with `--slow`, so the EIP-7702-delegated maker's pool
  init waits for the deploy.
- **Animations:** `motion` for layout re-ordering (the explainer's rank step) and springs; only
  transform and opacity animate; everything respects `prefers-reduced-motion`.
- The curve drop moved to `/curve`, unchanged apart from the link back home.

## Verification

- Full lifecycle driven through the UI on an anvil fork of Sepolia with a scripted browser: 4 test
  bids, maker closes, 3 reveals, settle (1 forfeit), withdraw, claim. Numbers matched the contract
  (maker ¥29,000 = 3 × ¥3,000 + a ¥20,000 forfeited deposit).
- Screenshots at desktop and phone width; two readability bugs fixed (labels on bright bars, and
  the 定価 and clearing labels overlapping when the price clears at 定価).
- `npm test` 24/24, eslint and tsc clean, `next build` passes.
