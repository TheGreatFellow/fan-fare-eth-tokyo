import Link from "next/link";
import { SiteNav } from "@/components/chrome";
import { Hero } from "@/components/pitch/hero";
import { Explainer } from "@/components/pitch/explainer";
import { TruthSlider } from "@/components/pitch/truth-slider";
import { Gap, Sellout, SwapFlow, Sybil } from "@/components/pitch/scenes";
import { Reveal, TitleCard } from "@/components/pitch/reveal";

// The pitch: problem, why, what, how, then where it applies.
export default function Home() {
  return (
    <>
      <SiteNav right={<Link href="/auction" className="btn btn-primary !py-2 text-sm">Enter the drop</Link>} />
      <main className="overflow-x-clip">
        <Hero />

        {/* Problem */}
        <Section>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <TitleCard kanji="問題" title="Sold out in 30 seconds. Resold at 10x by lunch.">
              Makers price limited editions low on purpose: 定価 is how fan culture says thank you. But when ten times more people want a figure than there are figures, first come, first served turns into a race, and bots are faster than people.
            </TitleCard>
            <Reveal delay={0.1}>
              <Sellout />
            </Reveal>
          </div>
        </Section>

        {/* Why */}
        <Section>
          <TitleCard kanji="差額" title="Scalping is a pricing bug.">
            The gap between 定価 and what fans will really pay is real money, and somebody collects it. Today that&apos;s whoever refreshes fastest. We give it to the maker and keep 定価 for fans.
          </TitleCard>
          <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Reveal>
              <Gap />
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="divide-y divide-line border-y border-line">
                {[
                  ["先着", "First come, first served", "A speed contest. Bots win."],
                  ["抽選", "Lottery", "A ticket contest. Multi-account farms win."],
                  ["値上", "Just raise the price", "Fans get priced out, and the maker looks greedy."],
                ].map(([jp, name, why]) => (
                  <li key={name} className="flex gap-4 py-4">
                    <span className="w-12 shrink-0 font-jp text-2xl text-ink-3">{jp}</span>
                    <div>
                      <div className="font-semibold">{name}</div>
                      <div className="text-ink-2">{why}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Section>

        {/* What */}
        <Section className="text-center">
          <Reveal>
            <div className="hud !text-accent">The mechanism</div>
            <h2 className="mx-auto mt-4 max-w-[14ch] font-display text-[clamp(3rem,9vw,7rem)] uppercase leading-[0.9] tracking-wide">Proof-of-Fan Clearing</h2>
            <p className="mt-5 font-mono text-lg text-ink-2">One human. One sealed bid. One fair price.</p>
          </Reveal>
          <div className="mx-auto mt-16 grid max-w-5xl gap-px bg-line text-left md:grid-cols-3">
            {[
              ["一", "Prove you're one human", "World ID gives each person exactly one sealed bid. A bot farm gets one bid, same as you."],
              ["二", "Fans first, at 定価", "Some units are raffled at 定価 among everyone who bid at least 定価. A bigger bid doesn't improve your odds."],
              ["三", "One price for the rest", "The other units go to the highest bids, and every winner pays the same price: the highest losing bid."],
            ].map(([n, title, text], i) => (
              <Reveal key={n} delay={i * 0.1} className="bg-bg p-7">
                <div className="font-jp text-5xl text-accent">{n}</div>
                <h3 className="mt-4 font-display text-2xl uppercase tracking-wide">{title}</h3>
                <p className="mt-2 leading-relaxed text-ink-2">{text}</p>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* How */}
        <Section id="how">
          <TitleCard kanji="仕組" title="Watch a drop clear.">
            Eight fans, five units, one bot farm. Tap a step, or let it play.
          </TitleCard>
          <Reveal className="mt-12">
            <Explainer />
          </Reveal>
        </Section>

        {/* Vickrey */}
        <Section>
          <TitleCard kanji="真値" title="Bid what it's worth. That's the whole strategy.">
            This is a Vickrey auction, the design that earned William Vickrey the 1996 Nobel prize in economics. Your bid decides <em>whether</em> you win, never <em>what</em> you pay. So shading your bid can only hurt you. Try to beat it.
          </TitleCard>
          <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Reveal>
              <TruthSlider />
            </Reveal>
            <Reveal delay={0.1} className="space-y-6">
              <Aside title="Why raffle first?">
                If the raffle were among the auction&apos;s losers, bidding low on purpose would buy you a lottery ticket. Drawing fans before the auction means your bid never changes your raffle odds, so the honest bid stays the best bid.
              </Aside>
              <Aside title="Why one price?">
                When everyone pays the highest losing bid, the price is set by the market, not by a guess, and a winner never regrets bidding high.
              </Aside>
            </Reveal>
          </div>
        </Section>

        {/* World ID */}
        <Section>
          <div className="grid items-center gap-12 md:grid-cols-2">
            <Reveal className="md:order-2">
              <TitleCard kanji="一人" title="It only works with one bid per human.">
                Uniform-price auctions have one known flaw: someone who wants many units bids low on the extras to drag the price down on all of them. Give each person one bid and the flaw disappears. With one unit each, the uniform price is the Vickrey price, and the raffle can&apos;t be farmed. World ID is what makes the auction honest.
              </TitleCard>
            </Reveal>
            <Reveal delay={0.1} className="md:order-1">
              <Sybil />
            </Reveal>
          </div>
        </Section>

        {/* Scalper math */}
        <Section>
          <TitleCard kanji="転売" title="So what's left for a scalper?" />
          <Reveal className="mt-12">
            <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
              <Resale tone="bad" label="Today" buy="¥3,000 at 定価" sell="≈ ¥30,000 on Mercari" margin="¥27,000" note="margin per unit, times every bot account" />
              <Resale label="Auction unit" buy="¥6,000, the clearing price" sell="Everyone who'd pay more already won one" margin="≈ ¥0" note="margin: the price already is the market price" />
              <Resale tone="good" label="Fan unit" buy="¥3,000, by raffle" sell="One per human, drawn blind" margin="1 flip" note="at most, by one lucky fan. Bots can't farm the raffle." />
            </div>
          </Reveal>
          <Reveal>
            <p className="mt-6 max-w-[62ch] text-lg text-ink-2">We don&apos;t ban resale. We leave it nothing to profit from.</p>
          </Reveal>
        </Section>

        {/* Uniswap */}
        <Section>
          <TitleCard kanji="交換" title="A bid is a swap.">
            The auction lives inside a Uniswap v4 hook. Bidders swap ETH into the drop&apos;s pool through the standard Universal Router, and the hook turns that swap into a sealed, escrowed bid. Refunds and payouts settle through the PoolManager.
          </TitleCard>
          <Reveal className="mt-12">
            <SwapFlow />
          </Reveal>
        </Section>

        {/* Use cases */}
        <Section>
          <TitleCard kanji="用途" title="For anything that sells out." />
          <div className="mt-12 grid auto-rows-[minmax(11rem,auto)] gap-3 md:grid-cols-4">
            <UseCase big kanji="模型" title="Anime figures and collabs" text="Evangelion and Gundam anniversary figures, Gunpla exclusives, studio collabs: the drops that vanish in seconds and reappear at 10x." />
            <UseCase kanji="限定" title="Designer toys" text="BE@RBRICK collabs and numbered art toys." />
            <UseCase kanji="靴" title="Sneakers" text="Limited colourways without the bot queue." />
            <UseCase kanji="券" title="Live tickets" text="Front rows priced by fans, not resale sites." />
            <UseCase kanji="札" title="Card boxes" text="Booster boxes and promo sets, one per person." />
          </div>
        </Section>

        {/* Close */}
        <Section className="pb-32 text-center">
          <Reveal>
            <h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] uppercase leading-[0.95] tracking-wide">The drop is live on Sepolia.</h2>
            <p className="mx-auto mt-5 max-w-[48ch] text-lg text-ink-2">Verify with World ID, seal a bid, and watch it clear.</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
              <Link href="/auction" className="btn btn-primary text-base">Enter the drop</Link>
              <Link href="/admin" className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">Run it as the maker</Link>
            </div>
          </Reveal>
        </Section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-3 md:px-8">
          <span>Fanfare, built at ETHGlobal Tokyo 2026 with World ID and Uniswap v4. Sample merch only; not affiliated with Evangelion&apos;s owners.</span>
          <Link href="/curve" className="hover:text-ink">The original curve drop</Link>
        </div>
      </footer>
    </>
  );
}

function Section({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-7xl scroll-mt-20 px-4 py-20 md:px-8 md:py-28 ${className}`}>
      {children}
    </section>
  );
}

function Aside({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-accent pl-5">
      <h3 className="font-display text-2xl uppercase tracking-wide">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}

function Resale({ label, buy, sell, margin, note, tone }: { label: string; buy: string; sell: string; margin: string; note: string; tone?: "good" | "bad" }) {
  const color = tone === "bad" ? "text-bad" : tone === "good" ? "text-fan" : "text-accent";
  return (
    <div className="bg-panel p-6">
      <div className={`font-mono text-xs uppercase tracking-[0.15em] ${color}`}>{label}</div>
      <dl className="mt-5 space-y-3">
        <div>
          <dt className="text-sm text-ink-3">Buys at</dt>
          <dd>{buy}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-3">Resells to</dt>
          <dd>{sell}</dd>
        </div>
      </dl>
      <div className={`mt-6 font-display text-5xl tabular ${color}`}>{margin}</div>
      <div className="text-sm text-ink-3">{note}</div>
    </div>
  );
}

function UseCase({ kanji, title, text, big }: { kanji: string; title: string; text: string; big?: boolean }) {
  return (
    <Reveal className={`group relative overflow-hidden border border-line bg-panel p-6 transition-colors hover:border-accent/60 ${big ? "md:col-span-2 md:row-span-2 bg-[radial-gradient(circle_at_80%_20%,rgba(255,91,31,0.18),transparent_60%)]" : ""}`}>
      <div aria-hidden className={`pointer-events-none absolute -right-3 -bottom-6 select-none font-jp leading-none text-white/[0.05] transition-transform duration-700 group-hover:-translate-y-2 ${big ? "text-[12rem]" : "text-[7rem]"}`}>
        {kanji}
      </div>
      <div className="relative flex h-full flex-col justify-end">
        <h3 className={`font-display uppercase tracking-wide ${big ? "text-4xl" : "text-2xl"}`}>{title}</h3>
        <p className={`mt-2 text-ink-2 ${big ? "max-w-[40ch] text-lg" : ""}`}>{text}</p>
      </div>
    </Reveal>
  );
}
