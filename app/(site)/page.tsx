import Link from "next/link";

const sportsResults = [
  {
    sport: "NFL",
    wins: "1,096",
    losses: "805",
    total: "1,901",
    winRate: "57.7%",
  },
  {
    sport: "MLB",
    wins: "2,656",
    losses: "1,954",
    total: "4,610",
    winRate: "57.6%",
  },
  {
    sport: "NHL",
    wins: "1,010",
    losses: "785",
    total: "1,795",
    winRate: "56.3%",
  },
  {
    sport: "NBA",
    wins: "1,057",
    losses: "853",
    total: "1,910",
    winRate: "55.3%",
  },
  {
    sport: "CFB",
    wins: "567",
    losses: "464",
    total: "1,031",
    winRate: "55.0%",
  },
  {
    sport: "CBB",
    wins: "277",
    losses: "235",
    total: "512",
    winRate: "54.1%",
  },
];

const trustPoints = [
  {
    number: "01",
    title: "Transparent Results",
    description:
      "Wins and losses are tracked publicly. No deleting losses. No selective screenshots.",
  },
  {
    number: "02",
    title: "Daily Analysis",
    description:
      "Every official selection includes the reasoning behind the wager—not just a team name.",
  },
  {
    number: "03",
    title: "Personal Access",
    description:
      "VIP members can reach Kof directly with questions about picks, lines, and bankroll strategy.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:52px_52px]" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-brand/30 bg-brand/10 px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">
                KofSports is back
              </span>
            </div>

            <p className="font-display text-sm font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Sports betting analysis since 2015
            </p>

            <h1 className="mt-5 max-w-4xl font-display text-6xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-[92px]">
              Bet smarter.
              <span className="block text-brand">Trust the record.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300">
              More than a decade of sports betting picks, in-depth analysis,
              transparent results, and direct access to Kof. No gimmicks. No
              erased losses. Just the information you need to make better
              decisions.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/plans"
                className="rounded-md bg-brand px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-brand-light"
              >
                Upgrade to Premium
              </Link>

              <Link
                href="/free-picks"
                className="rounded-md border border-white/20 bg-white/5 px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-white transition hover:border-white/40 hover:bg-white/10"
              >
                View Free Picks
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-400">
              <span>✓ All major American sports</span>
              <span>✓ Picks posted daily</span>
              <span>✓ Direct member access</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-brand/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Historical record
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold uppercase text-white">
                      All Sports
                    </p>
                  </div>

                  <div className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-extrabold text-brand">
                    2015–2025
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
                <div className="px-6 py-7">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Total Picks
                  </p>
                  <p className="mt-2 font-display text-5xl font-bold text-white">
                    11,759
                  </p>
                </div>

                <div className="px-6 py-7">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Win Rate
                  </p>
                  <p className="mt-2 font-display text-5xl font-bold text-brand">
                    56.7%
                  </p>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Overall record</span>
                  <span className="font-bold text-white">
                    6,663–5,096
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full w-[56.7%] rounded-full bg-brand" />
                </div>

                <p className="mt-5 text-sm leading-6 text-zinc-400">
                  Historical results from the original KofSports platform.
                  Relaunch results will be independently tracked and timestamped
                  within the new system.
                </p>
              </div>

              <div className="bg-brand px-6 py-4 text-center">
                <p className="font-display text-xl font-bold uppercase tracking-wide text-black">
                  Kooooooooofsports!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
              Documented performance
            </p>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-5xl">
              More than 11,000 historical picks
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-400">
              KofSports has published picks across every major American sport
              since 2015. The historical record is shown exactly as it stands.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-white/5">
                  <tr className="text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-4">Sport</th>
                    <th className="px-6 py-4">Wins</th>
                    <th className="px-6 py-4">Losses</th>
                    <th className="px-6 py-4">Total Picks</th>
                    <th className="px-6 py-4 text-right">Win Rate</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {sportsResults.map((result) => (
                    <tr
                      key={result.sport}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-5 font-display text-xl font-bold text-white">
                        {result.sport}
                      </td>
                      <td className="px-6 py-5 text-zinc-300">{result.wins}</td>
                      <td className="px-6 py-5 text-zinc-300">
                        {result.losses}
                      </td>
                      <td className="px-6 py-5 text-zinc-300">
                        {result.total}
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-brand">
                        {result.winRate}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t border-brand/30 bg-brand/5">
                  <tr>
                    <td className="px-6 py-5 font-display text-xl font-bold uppercase text-white">
                      Total
                    </td>
                    <td className="px-6 py-5 font-bold text-white">6,663</td>
                    <td className="px-6 py-5 font-bold text-white">5,096</td>
                    <td className="px-6 py-5 font-bold text-white">11,759</td>
                    <td className="px-6 py-5 text-right text-lg font-extrabold text-brand">
                      56.7%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mt-6 text-right">
            <Link
              href="/results"
              className="text-sm font-extrabold uppercase tracking-wide text-brand hover:text-brand-light"
            >
              Explore the full record →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
              Why KofSports
            </p>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-5xl">
              Built on credibility—not hype
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {trustPoints.map((point) => (
              <article
                key={point.number}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-7"
              >
                <p className="font-display text-5xl font-bold text-brand/30">
                  {point.number}
                </p>

                <h3 className="mt-5 font-display text-2xl font-bold uppercase text-white">
                  {point.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-400">
                  {point.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 py-16 text-center lg:flex-row lg:px-8 lg:text-left">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-black/60">
              The comeback starts now
            </p>

            <h2 className="mt-3 font-display text-4xl font-bold uppercase text-black sm:text-5xl">
              Get every official KofSports pick
            </h2>

            <p className="mt-4 max-w-2xl text-lg font-medium text-black/70">
              Daily selections, full analysis, transparent results, and direct
              access to Kof.
            </p>
          </div>

          <Link
            href="/plans"
            className="shrink-0 rounded-md bg-black px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-zinc-800"
          >
            View Memberships
          </Link>
        </div>
      </section>
    </>
  );
}
