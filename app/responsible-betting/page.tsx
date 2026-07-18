import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Responsible Betting",
};

export default function ResponsibleBettingPage() {
  return (
    <section>
      <div className="mx-auto max-w-4xl px-5 py-20 lg:px-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
          Play responsibly
        </p>

        <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white">
          Responsible Betting
        </h1>

        <div className="mt-10 space-y-7 text-lg leading-8 text-zinc-400">
          <p>
            Sports betting involves financial risk. No handicapper, model,
            system, trend, or analysis can guarantee a winning outcome.
          </p>

          <p>
            KofSports encourages every customer to establish a clear betting
            budget, use consistent unit sizes, avoid chasing losses, and never
            risk money needed for housing, food, transportation, bills, debt,
            savings, or other essential expenses.
          </p>

          <p>
            KofSports provides information, opinions, analysis, and
            entertainment. KofSports does not accept wagers and is not a
            sportsbook.
          </p>

          <p>
            Only participate in sports betting if you meet the legal age
            requirement and betting is legal in your jurisdiction.
          </p>
        </div>

        <div className="mt-10 rounded-xl border border-brand/30 bg-brand/[0.06] p-7">
          <h2 className="font-display text-2xl font-bold uppercase text-white">
            Need help?
          </h2>

          <p className="mt-4 leading-7 text-zinc-400">
            Anyone who feels that gambling is becoming difficult to control
            should stop wagering and contact a qualified responsible gambling
            support organization in their jurisdiction.
          </p>
        </div>
      </div>
    </section>
  );
}