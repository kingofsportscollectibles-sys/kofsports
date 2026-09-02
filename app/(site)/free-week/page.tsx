import type { Metadata } from "next";

import { FreeTrialCheckoutButton } from "@/components/stripe/free-trial-checkout-button";

export const metadata: Metadata = {
  title: "7-Day Premium Trial | KofSports",
  description:
    "Try KofSports Premium free for 7 days with full access to Premium Picks and analysis.",
  robots: {
    index: false,
    follow: false,
  },
};

type FreeWeekPageProps = {
  searchParams: Promise<{
    source?: string;
  }>;
};

export default async function FreeWeekPage({
  searchParams,
}: FreeWeekPageProps) {
  const params = await searchParams;
  const source = params.source ?? "free-week";

  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center lg:px-8 lg:py-28">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            Exclusive KofSports Offer
          </p>

          <h1 className="mt-5 font-display text-5xl font-bold uppercase leading-none text-white sm:text-6xl lg:text-7xl">
            Try Premium
            <span className="block text-brand">Free for 7 Days</span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-zinc-300">
            Get complete access to KofSports Premium Picks, betting analysis,
            confidence ratings, recommended units, and every sport we cover.
          </p>

          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-brand/40 bg-brand/[0.06] p-7 shadow-[0_0_60px_rgba(158,240,26,0.08)]">
            <p className="text-sm font-black uppercase tracking-widest text-brand">
              Your First 7 Days
            </p>

            <div className="mt-4 flex items-end justify-center gap-3">
              <span className="font-display text-6xl font-bold text-white">
                $0
              </span>
              <span className="pb-2 text-zinc-400">today</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Then $25/week unless canceled before your trial ends.
            </p>

            <div className="mt-7">
              <FreeTrialCheckoutButton
                source={source}
                label="Start My Free Week"
                className="rounded-md bg-brand px-6 py-4 text-base font-black uppercase tracking-wide text-black transition hover:bg-brand-light"
              />
            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Payment method required. You will not be charged today. Your
              Weekly Premium membership automatically begins after the 7-day
              trial unless you cancel beforehand.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Every Premium Pick",
                description:
                  "Unlock all currently active official KofSports Premium selections.",
              },
              {
                title: "Complete Analysis",
                description:
                  "See the reasoning and data behind the plays instead of just receiving a pick.",
              },
              {
                title: "All Sports Included",
                description:
                  "Your Premium access covers every sport and market KofSports is actively betting.",
              },
              {
                title: "Tracked Results",
                description:
                  "Evaluate KofSports with transparent results before deciding whether to stay.",
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-6"
              >
                <div className="text-xl font-black text-brand">✓</div>

                <h2 className="mt-4 font-display text-xl font-bold uppercase text-white">
                  {feature.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-brand">
            From Research to Real Picks
          </p>

          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white">
            See What We Actually Bet
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            Free KofSports tools and articles help you research the games.
            Premium is where you can see the official plays we decide are worth
            betting after putting the full picture together.
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <FreeTrialCheckoutButton
              source={source}
              label="Unlock Premium Free for 7 Days"
              className="rounded-md bg-brand px-6 py-4 text-sm font-black uppercase tracking-wide text-black transition hover:bg-brand-light"
            />
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-500">
            $0 today. Then $25/week unless canceled before the trial ends.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
          <div className="rounded-xl border border-white/10 p-7">
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              How the Free Week Works
            </h2>

            <ol className="mt-6 space-y-5 text-zinc-400">
              <li className="flex gap-4">
                <span className="font-black text-brand">1.</span>
                <span>Create or sign in to your KofSports account.</span>
              </li>

              <li className="flex gap-4">
                <span className="font-black text-brand">2.</span>
                <span>
                  Add your payment method through our secure Stripe checkout.
                  You pay $0 today.
                </span>
              </li>

              <li className="flex gap-4">
                <span className="font-black text-brand">3.</span>
                <span>
                  Get immediate access to KofSports Premium for the next seven
                  days.
                </span>
              </li>

              <li className="flex gap-4">
                <span className="font-black text-brand">4.</span>
                <span>
                  After the trial, Weekly Premium continues at $25/week unless
                  canceled beforehand.
                </span>
              </li>
            </ol>
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-6 text-zinc-500">
            Free Premium trial available to eligible new Premium customers
            only. One trial per KofSports account. KofSports provides sports
            betting information and entertainment. Results are not guaranteed.
            Please wager responsibly and never risk more than you can afford to
            lose.
          </p>
        </div>
      </section>
    </>
  );
}
