import type { Metadata } from "next";

import { CheckoutButton } from "@/components/stripe/checkout-button";

export const metadata: Metadata = {
  title: "Premium Membership Plans",
  description:
    "Compare KofSports Premium membership options and unlock sports betting picks, analysis, confidence ratings, and recommended units.",
};

type PlanKey = "one_day" | "weekly" | "monthly" | "ninety_day";

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

const plans: Plan[] = [
  {
    name: "1-Day Premium Pass",
    duration: "24 hours",
    price: "$10",
    billingLabel: "One-time payment",
    description:
      "Get complete access to every active Premium Pick for the next 24 hours.",
    popular: false,
    planKey: "one_day",
    buttonLabel: "Get 1-Day Access",
    features: [
      "All active Premium Picks",
      "Complete pick analysis",
      "Confidence ratings",
      "Recommended unit sizing",
      "No recurring charges",
    ],
  },
  {
    name: "Weekly Premium Pass",
    duration: "7 days",
    price: "$25",
    billingLabel: "Renews weekly",
    description:
      "Stay connected to every KofSports pick and analysis throughout the week.",
    popular: true,
    planKey: "weekly",
    buttonLabel: "Start Weekly Access",
    features: [
      "Full Premium access",
      "Every official KofSports pick",
      "All sports included",
      "Detailed betting analysis",
      "Cancel anytime",
    ],
  },
  {
    name: "Monthly Premium Pass",
    duration: "30 days",
    price: "$75",
    billingLabel: "Renews monthly",
    description:
      "A strong value for members who want consistent access throughout the month.",
    popular: false,
    planKey: "monthly",
    buttonLabel: "Start Monthly Access",
    features: [
      "Full Premium access",
      "Every official KofSports pick",
      "Confidence ratings and units",
      "All sports included",
      "Cancel anytime",
    ],
  },
  {
    name: "90-Day Premium Pass",
    duration: "90 days",
    price: "$199",
    billingLabel: "Renews every 90 days",
    description:
      "Our best long-term value for members who want uninterrupted access throughout the season.",
    popular: false,
    planKey: "ninety_day",
    buttonLabel: "Start 90-Day Access",
    features: [
      "Full Premium access",
      "Every official KofSports pick",
      "Complete analysis and results",
      "All sports included",
      "Best price per day",
    ],
  },
];

export default function PlansPage() {
  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            KofSports Premium
          </p>

          <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white sm:text-6xl">
            Choose your access
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Every Premium Pass includes access to all active sports, official
            selections, confidence ratings, recommended units, and complete
            betting analysis.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
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

                <h2 className="mt-3 font-display text-3xl font-bold uppercase text-white">
                  {plan.name}
                </h2>

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

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Immediate access
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                After payment, your KofSports account will be upgraded to
                Premium and you will be able to access all currently published
                Premium Picks.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Recurring billing
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                Weekly, monthly, and 90-day passes automatically renew until
                canceled. The 1-Day Premium Pass is a one-time purchase and does
                not renew.
              </p>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-4xl text-center text-sm leading-6 text-zinc-500">
            KofSports provides sports betting information and entertainment.
            Results are not guaranteed. Please wager responsibly and never risk
            more than you can afford to lose.
          </p>
        </div>
      </section>
    </>
  );
}