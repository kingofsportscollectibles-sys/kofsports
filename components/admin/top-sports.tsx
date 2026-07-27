import type { TopSport } from "@/lib/admin/dashboard";

export function TopSports({ sports }: { sports: TopSport[] }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        Top Performing Sports
      </p>
      <h2 className="mt-3 text-2xl font-bold text-black">Year-to-date performance</h2>

      <div className="mt-6 space-y-4">
        {sports.map((sport, index) => (
          <div key={sport.sport} className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-black text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-black text-black">{sport.sport}</p>
                  <p className="mt-1 text-sm text-gray-500">{sport.picks} graded picks</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${sport.units >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {sport.units >= 0 ? "+" : ""}{sport.units.toFixed(2)}u
                </p>
                <p className="mt-1 text-sm text-gray-500">{sport.winRate.toFixed(1)}% win rate</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sports.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
          Graded picks will appear here.
        </p>
      ) : null}
    </section>
  );
}
