import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "VIP Sports Betting Picks",
  description:
    "Access daily KofSports VIP picks, complete analysis, transparent results, and direct member support.",
};

const vipFeatures = [
  "Official daily KofSports selections",
  "Full pick analysis and reasoning",
  "Timestamped publication history",
  "Transparent wins and losses",
  "Access across every sport in season",
  "Direct access to Kof for questions",
];

export default function VipPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(158,240,26,0.13),transparent_35rem)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">
              KofSports VIP
            </div>

            <h1 className="mt-7 font-display text-6xl font-bold uppercase leading-[0.95] text-white sm:text-7xl">
              The full card.
              <span className="block text-brand">Every official pick.</span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-300">
              Sign in each day to access Kof&apos;s official plays across every
              major sport in season. Each pick includes the line, odds, unit
              size, publication time, and complete analysis.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/plans"
                className="rounded-md bg-brand px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-brand-light"
              >
                Become a VIP
              </Link>

              <Link
                href="/login"
                className="rounded-md border border-white/20 bg-white/5 px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Member Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
                Member experience
              </p>

              <h2 className="mt-4 font-display text-5xl font-bold uppercase text-white">
                Everything in one dashboard
              </h2>

              <p className="mt-5 leading-7 text-zinc-400">
                The new KofSports platform will provide members with one clean,
                mobile-friendly place to find today&apos;s card, read the
                analysis, track results, and review prior selections.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {vipFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-black text-black">
                    ✓
                  </span>

                  <p className="font-semibold leading-6 text-zinc-200">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  VIP Dashboard Preview
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold uppercase text-white">
                  Today&apos;s Official Card
                </h2>
              </div>

              <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand">
                Members Only
              </span>
            </div>

            <div className="p-6">
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] p-7">
                <div className="blur-sm">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-brand">
                    NFL · Official Pick
                  </p>

                  <h3 className="mt-3 font-display text-3xl font-bold uppercase text-white">
                    KofSports VIP Selection
                  </h3>

                  <p className="mt-3 text-zinc-400">
                    Full selection, line, odds, units, and analysis will appear
                    here for active VIP members.
                  </p>
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold uppercase text-white">
                      VIP Access Required
                    </p>

                    <Link
                      href="/plans"
                      className="mt-5 inline-flex rounded-md bg-brand px-6 py-3 text-sm font-extrabold uppercase text-black"
                    >
                      Unlock Picks
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}