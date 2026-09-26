# World ID integration debrief

**Trust moment:** placing a bid. Each human may place one sealed bid per drop, bound to the wallet
that pays. `proof_of_human` is the minimum sufficient credential, because the attacker is a bot or
one person running many wallets, and only Orb-backed uniqueness stops one person bidding many times.

**Time to first success:** about 1h45m, from the first line of IDKit code (Fri 23:00 JST) to a proof
verified end to end and used in an on-chain purchase (Sat 00:43 JST).

## Where we got stuck

1. **Staging requirements changed mid-hackathon.** Overnight, a working integration started
   returning `403 environment_not_allowed`. Staging proofs now need a 24h window opened through the
   Portal's MCP tool, plus an `x-staging-verification-token` header. We found no changelog or Portal
   UI for it, so we read the Portal source to learn the header name.
2. **The simulator only has one person.** For World ID 4.0 it always returns the same identity, so a
   solo builder can't test several humans bidding. Later it also hit a bug, and we switched to the
   sandbox environment.
3. **Sandbox scanning isn't documented.** The docs cover installing the World ID (Sandbox) app, but
   not how a web QR code reaches it. We read IDKit's code to learn the QR is a `sandbox.world.org`
   link to open with the phone camera.
4. **The `rp_context` shape differs between doc pages.** One page shows snake_case with `signature`,
   while `signRequest()` returns camelCase with `sig`. Passing the wrong shape fails inside the SDK
   with an opaque BigInt error.

## The single most impactful improvement

Let the simulator and sandbox issue several distinct test identities. Anything that needs more than
one human (auctions, votes, raffles) is otherwise very hard to test, especially for solo builders.
