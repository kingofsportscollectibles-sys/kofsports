import type { Metadata } from "next";

import { CheckoutButton } from "@/components/stripe/checkout-button";

export const metadata: Metadata = {
  title: "KofSports Plans | Premium Picks & KofSports Pro",
  description:
    "Choose KofSports Premium for official picks plus KofSports Pro research tools, or subscribe to KofSports Pro as a standalone betting research platform.",
};

type PlanKey =
  | "one_day"
  | "weekly"
  | "monthly"
  | "ninety_day"
  | "pro_monthly"
  | "pro_annual";

type Plan = {
  name: string;
  duration: string;
  price: string;
  billingLabel: string;
  description: string;
  popular: boolean;
  planKey: PlanKey;
  buttonLabel: string;
  features: string[];
};

const premiumPlans: Plan[] = [
  {
    name: "1-Day Premium Pass",
    duration: "24 hours",
    price: "$10",
    billingLabel: "One-time payment",
    description:
      "Get complete access to every active Premium Pick plus KofSports Pro for the next 24 hours.",
    popular: false,
    planKey: "one_day",
    buttonLabel: "Get 1-Day Access",
    features: [
      "All active Premium Picks",
      "Complete pick analysis",
      "Confidence ratings",
      "Recommended unit sizing",
      "KofSports Pro included",
      "No recurring charges",
    ],
  },
  {
    name: "Weekly Premium Pass",
    duration: "7 days",
    price: "$25",
    billingLabel: "Renews weekly",
    description:
      "Stay connected to every KofSports pick and unlock the full KofSports Pro research platform.",
    popular: true,
    planKey: "weekly",
    buttonLabel: "Start Weekly Access",
    features: [
      "Every official KofSports pick",
      "Detailed betting analysis",
      "Confidence ratings and units",
      "All sports included",
      "KofSports Pro included",
      "Cancel anytime",
    ],
  },
  {
    name: "Monthly Premium Pass",
    duration: "30 days",
    price: "$75",
    billingLabel: "Renews monthly",
    description:
      "Complete Premium access plus KofSports Pro throughout the month.",
    popular: false,
    planKey: "monthly",
    buttonLabel: "Start Monthly Access",
    features: [
      "Every official KofSports pick",
      "Complete betting analysis",
      "Confidence ratings and units",
      "All sports included",
      "KofSports Pro included",
      "Cancel anytime",
    ],
  },
  {
    name: "90-Day Premium Pass",
    duration: "90 days",
    price: "$199",
    billingLabel: "Renews every 90 days",
    description:
      "Our best long-term Premium value with uninterrupted access to picks and KofSports Pro.",
    popular: false,
    planKey: "ninety_day",
    buttonLabel: "Start 90-Day Access",
    features: [
      "Every official KofSports pick",
      "Complete analysis and results",
      "Confidence ratings and units",
      "All sports included",
      "KofSports Pro included",
      "Best Premium price per day",
    ],
  },
];

const proPlans: Plan[] = [
  {
    name: "Pro Monthly",
    duration: "Monthly",
    price: "$9.99",
    billingLabel: "Renews monthly",
    description:
      "Get the KofSports research platform without a Premium Picks subscription.",
    popular: false,
    planKey: "pro_monthly",
    buttonLabel: "Start Pro Monthly",
    features: [
      "Full NFL Prop Research board",
      "KOF Over Score rankings",
      "Advanced L5, L10, season & H2H data",
      "Edge vs current sportsbook line",
      "Defense vs Position analysis",
      "Snap share and player usage",
      "Expanded prop research",
      "Cancel anytime",
    ],
  },
  {
    name: "Pro Annual",
    duration: "Annual",
    price: "$79",
    billingLabel: "Renews annually",
    description:
      "Year-round access to the KofSports research platform at our best Pro value.",
    popular: true,
    planKey: "pro_annual",
    buttonLabel: "Get Pro Annual",
    features: [
      "Everything in KofSports Pro",
      "Save over 35% vs monthly",
      "Full NFL research platform",
      "Advanced prop research",
      "Future Pro features included",
      "Future sports tools as added",
      "Cancel anytime",
    ],
  },
];

export default function PlansPage() {
  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            KofSports
          </p>

          <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white sm:text-6xl">
            Choose Your Access
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Get KofSports Premium for our official picks and complete
            research platform, or choose KofSports Pro to research your
            own bets.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-brand">
              KofSports Premium
            </p>

            <h2 className="mt-3 font-display text-4xl font-bold uppercase text-white">
              Official Picks + Pro Research
            </h2>

            <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-400">
              Every Premium Pass includes all active KofSports picks,
              complete analysis, confidence ratings, recommended units
              and KofSports Pro at no additional cost.
            </p>

            <div className="mx-auto mt-6 inline-flex rounded-full border border-brand/30 bg-brand/[0.08] px-5 py-2 text-sm font-bold text-brand">
              KofSports Pro included with every Premium Pass
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {premiumPlans.map((plan) => (
              <article
                key={plan.planKey}
                className={
                  plan.popular
                    ? "relative flex flex-col rounded-2xl border border-brand bg-brand/[0.06] p-7 shadow-[0_0_50px_rgba(158,240,26,0.08)]"
                    : "relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-7"
                }
              >
                {plan.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-4 py-1 text-xs font-black uppercase tracking-wider text-black">
                    Most Popular
                  </div>
                ) : null}

                <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                  {plan.duration}
                </p>

                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-white">
                  {plan.name}
                </h3>

                <p className="mt-6 font-display text-5xl font-bold text-white">
                  {plan.price}
                </p>

                <p className="mt-2 text-sm font-bold uppercase tracking-wide text-zinc-500">
                  {plan.billingLabel}
                </p>

                <p className="mt-5 min-h-24 leading-7 text-zinc-400">
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

          <div className="my-20 border-t border-white/10" />

          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-brand">
              KofSports Pro
            </p>

            <h2 className="mt-3 font-display text-4xl font-bold uppercase text-white">
              Want The Tools Without The Picks?
            </h2>

            <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-400">
              KofSports Pro gives you our advanced betting research
              platform without a Premium Picks subscription. Research
              the board, analyze matchups and find opportunities using
              KOF Scores and advanced player data.
            </p>

            <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold text-zinc-500">
              Already a Premium member? Pro is already included with
              your access.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
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
                    Best Pro Value
                  </div>
                ) : null}

                <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                  {plan.duration}
                </p>

                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-white">
                  {plan.name}
                </h3>

                <div className="mt-6 flex items-end gap-2">
                  <p className="font-display text-5xl font-bold text-white">
                    {plan.price}
                  </p>
                </div>

                <p className="mt-2 text-sm font-bold uppercase tracking-wide text-zinc-500">
                  {plan.billingLabel}
                </p>

                <p className="mt-5 leading-7 text-zinc-400">
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

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Immediate Access
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                After payment, your KofSports account will receive
                access based on the plan you select. Premium members
                receive both Premium Picks and KofSports Pro.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Choose What Fits You
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                Want KofSports&apos; official selections? Choose
                Premium. Prefer researching and making your own
                betting decisions? KofSports Pro gives you the tools.
              </p>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-4xl text-center text-sm leading-6 text-zinc-500">
            KofSports provides sports betting information and
            entertainment. KOF Scores and research tools do not
            guarantee betting outcomes. Please wager responsibly and
            never risk more than you can afford to lose.
          </p>
        </div>
      </section>
    </>
  );
}
