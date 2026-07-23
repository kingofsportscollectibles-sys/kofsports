import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Kof",
  description:
    "Meet Kof, the founder and lead handicapper behind KofSports, established in 2015.",
};

const personalFacts = [
  {
    label: "Favorite Teams",
    value: "Patriots, Red Sox, Celtics & Bruins",
  },
  {
    label: "Favorite Sports Moment",
    value: "Attending the Patriots' Super Bowl LIII victory",
  },
  {
    label: "Toughest Sports Moment",
    value: "The Patriots losing Super Bowl XLII",
  },
  {
    label: "Best Bet",
    value: "A three-team futures parlay at 100-to-1",
  },
  {
    label: "Favorite Food",
    value: "Pizza and wings",
  },
  {
    label: "Favorite Beer",
    value: "Tree House Brewing Company",
  },
  {
    label: "Favorite Stadium",
    value: "Fenway Park",
  },
  {
    label: "Favorite Non-Homer Stadium",
    value: "PNC Park",
  },
  {
    label: "Favorite Place to Watch",
    value: "The man cave",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
              Founder. Handicapper. Sports fan.
            </p>

            <h1 className="mt-4 font-display text-6xl font-bold uppercase leading-[0.95] text-white sm:text-7xl">
              Meet Kof
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-300">
              Kof is the founder, lead handicapper, and personality behind
              KofSports. What began as a passion project in 2015 grew into a
              long-running sports betting information business built through
              daily analysis, transparent results, and personal relationships
              with members.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="rounded-md bg-brand px-6 py-3.5 text-sm font-extrabold uppercase text-black"
              >
                Read Blog 
              </Link>

              <Link
                href="/plans"
                className="rounded-md border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-extrabold uppercase text-white"
              >
                Join VIP
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
              The numbers
            </p>

            <div className="mt-7 grid grid-cols-2 gap-6">
              <div>
                <p className="font-display text-5xl font-bold text-brand">
                  2015
                </p>
                <p className="mt-2 text-sm text-zinc-400">Year founded</p>
              </div>

              <div>
                <p className="font-display text-5xl font-bold text-brand">
                  10+
                </p>
                <p className="mt-2 text-sm text-zinc-400">Years publishing</p>
              </div>

              <div>
                <p className="font-display text-5xl font-bold text-brand">
                  11.7K
                </p>
                <p className="mt-2 text-sm text-zinc-400">Historical picks</p>
              </div>

              <div>
                <p className="font-display text-5xl font-bold text-brand">
                  56.7%
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Historical win rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            The story
          </p>

          <h2 className="mt-4 font-display text-5xl font-bold uppercase text-white">
            Why KofSports was created
          </h2>

          <div className="mt-8 space-y-6 text-lg leading-8 text-zinc-400">
            <p>
              KofSports was created because Kof wanted to spend every day doing
              something he genuinely enjoyed: following sports, evaluating
              matchups, sharing predictions, and connecting with other fans and
              bettors.
            </p>

            <p>
              The business grew by providing picks and detailed analysis across
              the major American sports calendar. It was never built around
              pretending every day would be a winning day. Its credibility came
              from consistently showing up, publishing the record, answering
              member questions, and refusing to erase losses.
            </p>

            <p>
              The new KofSports is designed to preserve that personality while
              providing a stronger platform for transparent tracking, faster
              publishing, mobile access, and a better VIP member experience.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            Beyond the picks
          </p>

          <h2 className="mt-4 font-display text-5xl font-bold uppercase text-white">
            More about Kof
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalFacts.map((fact) => (
              <article
                key={fact.label}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-6"
              >
                <p className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  {fact.label}
                </p>

                <p className="mt-3 font-semibold leading-7 text-white">
                  {fact.value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-brand p-8 text-center sm:p-12">
            <p className="font-display text-4xl font-bold uppercase text-black sm:text-6xl">
              Kooooooooofsports!
            </p>

            <p className="mx-auto mt-4 max-w-2xl font-semibold leading-7 text-black/70">
              Built for sports fans and bettors who want honest analysis,
              transparent results, and a real person behind the picks.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}