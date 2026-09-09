import type { Metadata } from "next";

import { CheckoutButton } from "@/components/stripe/checkout-button";

export const metadata: Metadata = {
  title: "KofSports Pro | NFL Betting Research Tools",
  description:
    "Unlock KofSports Pro for advanced NFL player prop research, KOF Scores, trend analysis, matchup data, player usage, and premium betting tools.",
};

const proPlans = [
  {
    name: "KofSports Pro Monthly",
    duration: "Monthly",
    price: "$19.99",
    billingLabel: "per month",
    description:
      "Full access to KofSports Pro research tools with flexible monthly billing.",
    popular: false,
    planKey: "pro_monthly" as const,
    buttonLabel: "Start KofSports Pro",
    features: [
      "Full NFL Prop Research board",
      "KOF Over Score rankings",
      "L5, L10, season and H2H research",
      "Edge vs current sportsbook line",
      "Defense vs Position matchup analysis",
      "Snap share and player usage data",
      "Expanded player research breakdowns",
      "Future KofSports Pro tools included",
      "Cancel anytime",
    ],
  },
  {
    name: "KofSports Pro Annual",
    duration: "Annual",
    price: "$149",
    billingLabel: "per year",
    description:
      "Our best value for bettors who want year-round access to the KofSports research platform.",
    popular: true,
    planKey: "pro_annual" as const,
    buttonLabel: "Get Annual Pro",
    features: [
      "Everything in KofSports Pro",
      "Save over 35% vs monthly",
      "Full NFL research platform",
      "Future NBA and MLB tools as added",
      "Advanced betting research features",
      "New Pro features included",
      "One annual subscription",
    ],
  },
];

export default function ProPage() {
  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            KofSports Pro
          </p>

          <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white sm:text-6xl">
            Research Smarter
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            KofSports Pro gives you the research tools behind the board.
            Find player prop opportunities faster using KOF Scores,
            recent performance, sportsbook lines, matchup data and
            player usage — all in one place.
          </p>

          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3 text-sm text-zinc-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              ✓ KOF Scores
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              ✓ Prop Trends
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              ✓ Matchup Research
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              ✓ Player Usage
            </span>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {proPlans.map((plan) => (
              <article
                key={plan.planKey}
                className={
                  plan.popular
                    ? "relative flex flex-col rounded-2xl border border-brand bg-brand/[0.06] p-8 shadow-[0_0_50px_rgba(158,240,26,0.08)]"
                    : "relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-8"
                }
              >
                {plan.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-4 py-1 text-xs font-black uppercase tracking-wider text-black">
                    Best Value
                  </div>
                ) : null}

                <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                  {plan.duration}
                </p>

                <h2 className="mt-3 font-display text-3xl font-bold uppercase text-white">
                  {plan.name}
                </h2>

                <div className="mt-6 flex items-end gap-2">
                  <p className="font-display text-5xl font-bold text-white">
                    {plan.price}
                  </p>
                  <p className="pb-1 text-sm font-bold uppercase tracking-wide text-zinc-500">
                    {plan.billingLabel}
                  </p>
                </div>

                <p className="mt-5 min-h-20 leading-7 text-zinc-400">
                  {plan.description}
                </p>

                <ul className="mt-7 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-sm leading-6 text-zinc-300"
                    >
                      <span className="font-black text-brand">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <CheckoutButton
                    plan={plan.planKey}
                    label={plan.buttonLabel}
                    className={
                      plan.popular
                        ? "rounded-md bg-brand px-5 py-3.5 text-sm font-extrabold uppercase text-black transition hover:bg-brand-light"
                        : "rounded-md border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-extrabold uppercase text-white transition hover:bg-white/10"
                    }
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                Research
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase text-white">
                Find Opportunities Faster
              </h2>
              <p className="mt-4 leading-7 text-zinc-400">
                Sort through the NFL prop board using recent performance,
                sportsbook lines, matchup data and proprietary KOF
                research signals.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                Analyze
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase text-white">
                Go Beyond Hit Rates
              </h2>
              <p className="mt-4 leading-7 text-zinc-400">
                Dig into edge versus the current line, defensive matchup,
                player role, snap share and recent game results before
                making a betting decision.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                KOF Score
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase text-white">
                Prioritize The Board
              </h2>
              <p className="mt-4 leading-7 text-zinc-400">
                KOF Over Score Beta combines multiple research signals
                into a single ranking so you can identify the props most
                worth investigating.
              </p>
            </div>
          </div>

          <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-brand">
              Picks vs Research
            </p>

            <h2 className="mt-3 font-display text-3xl font-bold uppercase text-white">
              KofSports Pro is separate from Premium Picks
            </h2>

            <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-400">
              KofSports Premium Picks are for bettors who want to see
              Kof&apos;s official selections. KofSports Pro is for
              bettors who want the research platform and tools to
              analyze opportunities themselves.
            </p>
          </div>

          <p className="mx-auto mt-10 max-w-4xl text-center text-sm leading-6 text-zinc-500">
            KOF Scores and research tools are informational and do not
            guarantee betting outcomes. Please wager responsibly and
            never risk more than you can afford to lose.
          </p>
        </div>
      </section>
    </>
  );
}
