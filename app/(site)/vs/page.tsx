import type { Metadata } from "next";
import Link from "next/link";
import { comparisons, comparisonCheckedAt } from "@/lib/marketing/comparisons";
export const metadata: Metadata = {
  title: "Compare KofSports with Props.Cash, Outlier & SportsLine",
  description:
    "Compare KofSports plans, NFL research and public pick records with Props.Cash, Outlier and SportsLine using dated vendor sources.",
  alternates: { canonical: "https://www.kofsports.com/vs" },
};
export default function ComparisonsPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-display text-4xl font-bold uppercase text-white sm:text-5xl">
        Compare the tools before you subscribe.
      </h1>
      <p className="mt-5 max-w-3xl leading-7 text-zinc-400">
        Different workflows deserve different tools. These comparisons separate
        official picks from research subscriptions, and stored quotes from live
        multi-book feeds. Vendor sources checked {comparisonCheckedAt}.
      </p>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {comparisons.map((c) => (
          <Link
            key={c.slug}
            href={`/vs/${c.slug}`}
            className="rounded-xl border border-white/10 p-6"
          >
            <h2 className="font-display text-2xl font-bold text-white">
              {c.title}
            </h2>
            <p className="mt-4 leading-7 text-zinc-400">{c.intro}</p>
            <span className="mt-5 inline-flex min-h-11 items-center font-semibold text-brand">
              Compare features and prices →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
