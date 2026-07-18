import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "VIP Membership Plans",
  description:
    "Compare KofSports VIP membership options and unlock daily sports betting picks and analysis.",
};

const plans = [
  {
    name: "Day Pass",
    duration: "24 hours",
    price: "$10",
    description: "Get the complete VIP card for the next 24 hours.",
    popular: false,
    features: [
      "All active VIP picks",
      "Complete pick analysis",
      "Every sport in season",
      "24-hour account access",
    ],
  },
  {
    name: "7-Day Pass",
    duration: "7 days",
    price: "$25",
    description: "A full week of KofSports picks and analysis.",
    popular: false,
    features: [
      "Seven days of VIP access",
      "All sports included",
      "Full pick archive during access",
      "Direct questions to Kof",
    ],
  },
  {
    name: "Monthly VIP",
    duration: "30 days",
    price: "$75",
    description: "The best option for consistent access throughout the month.",
    popular: true,
    features: [
      "Thirty days of VIP access",
      "Every official KofSports pick",
      "Full analysis and results",
      "Direct access to Kof",
    ],
  },
  {
    name: "90-Day VIP",
    duration: "90 days",
    price: "$199",
    description: "Commit for the season and receive the strongest daily value.",
    popular: false,
    features: [
      "Ninety days of VIP access",
      "All sports included",
      "Complete results access",
      "Save compared with monthly pricing",
    ],
  },
];

export default function PlansPage() {
  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            KofSports VIP
          </p>

          <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white sm:text-6xl">
            Choose your access
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Every plan includes access to all active sports. No separate
            football, baseball, basketball, or hockey package is required.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={
                  plan.popular
                    ? "relative rounded-2xl border border-brand bg-brand/[0.06] p-7 shadow-[0_0_50px_rgba(158,240,26,0.08)]"
                    : "relative rounded-2xl border border-white/10 bg-white/[0.025] p-7"
                }
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-black uppercase tracking-wider text-black">
                    Most Popular
                  </div>
                )}

                <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
                  {plan.duration}
                </p>

                <h2 className="mt-3 font-display text-3xl font-bold uppercase text-white">
                  {plan.name}
                </h2>

                <p className="mt-6 font-display text-5xl font-bold text-white">
                  {plan.price}
                </p>

                <p className="mt-5 min-h-20 leading-7 text-zinc-400">
                  {plan.description}
                </p>

                <ul className="mt-7 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-sm leading-6 text-zinc-300"
                    >
                      <span className="font-black text-brand">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={
                    plan.popular
                      ? "mt-8 flex justify-center rounded-md bg-brand px-5 py-3.5 text-sm font-extrabold uppercase text-black transition hover:bg-brand-light"
                      : "mt-8 flex justify-center rounded-md border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-extrabold uppercase text-white transition hover:bg-white/10"
                  }
                >
                  Select Plan
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-white/10 bg-zinc-950 p-7">
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Relaunch pricing
            </h2>

            <p className="mt-4 max-w-4xl leading-7 text-zinc-400">
              These prices are currently being used as the proposed KofSports
              relaunch structure. Checkout will not be activated until the
              payment provider, access rules, renewal terms, and refund policy
              are finalized.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}