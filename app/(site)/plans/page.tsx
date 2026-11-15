import Link from "next/link";
import type { Metadata } from "next";

import { CheckoutButton } from "@/components/stripe/checkout-button";

export const metadata: Metadata = {
  title: "KofSports Plans | Premium Picks & KofSports Pro",
  description:
    "Choose KofSports Premium for official picks plus KofSports Pro research tools, or subscribe to KofSports Pro as a standalone betting research platform.",
};

import { premiumPlans, proPlans } from "@/lib/marketing/plans";
import { PlanComparison } from "@/components/marketing/PlanComparison";
import { PaymentTrust } from "@/components/marketing/PaymentTrust";
import { MarketingFaq } from "@/components/marketing/Faq";
import { MemberStories, IndependentReview } from "@/components/marketing/Proof";
import { JsonLd } from "@/components/marketing/JsonLd";

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
            Get KofSports Premium for our official picks and complete research
            platform, or choose KofSports Pro to research your own bets.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <PlanComparison />
          <div id="premium-plans" className="scroll-mt-24 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-brand">
              KofSports Premium
            </p>

            <h2 className="mt-3 font-display text-4xl font-bold uppercase text-white">
              Official Picks + Pro Research
            </h2>

            <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-400">
              Every Premium Pass includes all active KofSports picks, complete
              analysis, confidence ratings, recommended units and KofSports Pro
              at no additional cost.
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

                {plan.planKey === "monthly" && (
                  <p className="mt-5 text-sm text-brand">
                    $2.50 a day over 30 days, with Pro included. No separate
                    research subscription needed.
                  </p>
                )}
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
                  <PaymentTrust />
                </div>
              </article>
            ))}
          </div>

          <div className="my-20 border-t border-white/10" />

          <div id="pro-plans" className="scroll-mt-24 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-brand">
              KofSports Pro
            </p>

            <h2 className="mt-3 font-display text-4xl font-bold uppercase text-white">
              Want The Tools Without The Picks?
            </h2>

            <p className="mx-auto mt-4 max-w-3xl leading-7 text-zinc-400">
              KofSports Pro gives you our advanced betting research platform
              without a Premium Picks subscription. Research the board, analyze
              matchups and find opportunities using KOF Scores and advanced
              player data.
            </p>

            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-zinc-400">Pro is $9.99/month for focused NFL research. Props.Cash advertises $19.99/month for All Sports in its US iOS listing—$10 more, with a different feature set. <Link href="/vs/kofsports-vs-props-cash" className="text-brand underline">Compare coverage and the dated pricing source</Link>.</p>
            <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold text-zinc-500">
              Already a Premium member? Pro is already included with your
              access.
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
                  <PaymentTrust />
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
                After payment, your KofSports account will receive access based
                on the plan you select. Premium members receive both Premium
                Picks and KofSports Pro.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-950 p-7">
              <h2 className="font-display text-2xl font-bold uppercase text-white">
                Choose What Fits You
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                Want KofSports&apos; official selections? Choose Premium. Prefer
                researching and making your own betting decisions? KofSports Pro
                gives you the tools.
              </p>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-4xl text-center text-sm leading-6 text-zinc-500">
            KofSports provides sports betting information and entertainment. KOF
            Scores and research tools do not guarantee betting outcomes. Please
            wager responsibly and never risk more than you can afford to lose.
          </p>
        </div>
      </section>
      <MemberStories />
      <IndependentReview />
      <MarketingFaq />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": proPlans.map((plan) => ({
            "@type": "Product",
            name: plan.name,
            description: plan.description,
            brand: { "@type": "Brand", name: "KofSports" },
            offers: {
              "@type": "Offer",
              url: "https://www.kofsports.com/plans#pro-plans",
              price: plan.price.replace("$", ""),
              priceCurrency: "USD",
              description: plan.billingLabel,
            },
          })),
        }}
      />
    </>
  );
}
