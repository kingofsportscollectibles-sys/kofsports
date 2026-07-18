import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historical Betting Results",
  description:
    "Review KofSports historical betting records across the NFL, MLB, NBA, NHL, college football, and college basketball.",
};

const records = [
  {
    sport: "MLB",
    wins: 2656,
    losses: 1954,
    total: 4610,
    rate: "57.6%",
  },
  {
    sport: "NFL",
    wins: 1096,
    losses: 805,
    total: 1901,
    rate: "57.7%",
  },
  {
    sport: "NBA",
    wins: 1057,
    losses: 853,
    total: 1910,
    rate: "55.3%",
  },
  {
    sport: "NHL",
    wins: 1010,
    losses: 785,
    total: 1795,
    rate: "56.3%",
  },
  {
    sport: "CFB",
    wins: 567,
    losses: 464,
    total: 1031,
    rate: "55.0%",
  },
  {
    sport: "CBB",
    wins: 277,
    losses: 235,
    total: 512,
    rate: "54.1%",
  },
];

export default function ResultsPage() {
  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            Historical performance
          </p>

          <h1 className="mt-4 font-display text-5xl font-bold uppercase text-white sm:text-6xl">
            The KofSports record
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            A transparent summary of KofSports picks published through the
            original platform between 2015 and 2025.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Total Picks
              </p>
              <p className="mt-3 font-display text-5xl font-bold text-white">
                11,759
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Overall Record
              </p>
              <p className="mt-3 font-display text-5xl font-bold text-white">
                6,663–5,096
              </p>
            </div>

            <div className="rounded-xl border border-brand/30 bg-brand/[0.06] p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">
                Win Rate
              </p>
              <p className="mt-3 font-display text-5xl font-bold text-brand">
                56.7%
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-white/5">
                  <tr className="text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-4">Sport</th>
                    <th className="px-6 py-4">Wins</th>
                    <th className="px-6 py-4">Losses</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4 text-right">Win Rate</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {records.map((record) => (
                    <tr key={record.sport}>
                      <td className="px-6 py-5 font-display text-2xl font-bold text-white">
                        {record.sport}
                      </td>
                      <td className="px-6 py-5 text-zinc-300">
                        {record.wins.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-zinc-300">
                        {record.losses.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-zinc-300">
                        {record.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-right text-lg font-extrabold text-brand">
                        {record.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-white/10 bg-zinc-950 p-7">
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Historical record disclosure
            </h2>

            <p className="mt-4 max-w-4xl leading-7 text-zinc-400">
              These totals represent KofSports historical records from the
              original publishing platform. We are evaluating the available Wix
              archive and supporting records to determine how many individual
              historical selections can be transferred to the new platform.
            </p>

            <p className="mt-4 max-w-4xl leading-7 text-zinc-400">
              All picks published through the new KofSports platform will be
              timestamped, stored, and graded in the new results database.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}