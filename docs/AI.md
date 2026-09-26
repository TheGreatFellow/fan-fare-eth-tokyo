# AI usage

Fanfare was built solo at ETHGlobal Tokyo 2026 with **Claude Code** as a pair programmer.

**The builder's part:** the product idea and every product decision. That covers:
- the problem framing (retail-priced drops lost to scalpers);
- replacing the Phase 1 price curve with a sealed-bid auction;
- raffling fan units at retail *before* the auction;
- dropping sell-back from the auction;
- the Uniswap v4 and World ID integrations;
- naming, theme and copy direction;
- the demo choices (30-second reveal, sandbox World ID).

The builder also tested every flow by hand on Sepolia.

**Claude Code's part:** code drafting and review across the Solidity contracts, the Foundry tests, the Next.js app and the World ID backend. It also helped research current SDK behaviour, draft docs and check the UI with scripted browser runs.

**Planning artifacts:** [`SPEC.md`](../SPEC.md) is the product spec, and [`CLAUDE.md`](../CLAUDE.md) holds the working rules the AI followed. Both evolved through the event.
