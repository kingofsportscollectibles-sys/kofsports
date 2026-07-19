import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type Pick = {
  id: string;
  sport: string | null;
  bet_type: string | null;
  matchup: string | null;
  selection: string;
  odds: number | null;
  units: number | null;
  confidence: number | null;
  game_time: string | null;
  status: string | null;
  profit_loss: number | null;
  is_published: boolean | null;
};

function formatOdds(odds: number | null) {
  if (odds === null) {
    return "—";
  }

  return odds > 0 ? `+${odds}` : String(odds);
}

function formatGameTime(gameTime: string | null) {
  if (!gameTime) {
    return "Time not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(gameTime));
}

function formatProfitLoss(value: number | null) {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(2)}`;
  }

  return value.toFixed(2);
}

function statusClasses(status: string | null) {
  switch (status) {
    case "won":
      return "bg-green-50 text-green-700";
    case "lost":
      return "bg-red-50 text-red-700";
    case "push":
      return "bg-gray-100 text-gray-700";
    case "cancelled":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export default async function AdminPicksPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vip_picks")
    .select(
      `
        id,
        sport,
        bet_type,
        matchup,
        selection,
        odds,
        units,
        confidence,
        game_time,
        status,
        profit_loss,
        is_published
      `,
    )
    .order("game_time", { ascending: false });

  const picks = (data ?? []) as Pick[];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
            Admin Picks
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl">
            Premium selections
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Create, edit, publish, grade, and track every KofSports pick.
          </p>
        </div>

        <Link
          href="/admin/picks/new"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black"
        >
          Add New Pick
        </Link>
      </div>

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load picks: {error.message}
        </div>
      )}

      {!error && picks.length === 0 && (
        <section className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-xl font-bold text-black">
            No premium picks yet
          </p>

          <Link
            href="/admin/picks/new"
            className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black"
          >
            Publish Your First Pick
          </Link>
        </section>
      )}

      {!error && picks.length > 0 && (
        <div className="mt-10 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
                  <th className="px-6 py-4">Game</th>
                  <th className="px-6 py-4">Selection</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Odds</th>
                  <th className="px-6 py-4">Units</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Result</th>
                  <th className="px-6 py-4">P/L</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {picks.map((pick) => (
                  <tr key={pick.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-5">
                      <p className="font-bold text-black">
                        {pick.matchup ?? "Untitled matchup"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {pick.sport ?? "Sport"} ·{" "}
                        {formatGameTime(pick.game_time)}
                      </p>
                    </td>

                    <td className="px-6 py-5 font-semibold text-black">
                      {pick.selection}
                    </td>

                    <td className="px-6 py-5 text-gray-600">
                      {pick.bet_type ?? "—"}
                    </td>

                    <td className="px-6 py-5 text-gray-700">
                      {formatOdds(pick.odds)}
                    </td>

                    <td className="px-6 py-5 text-gray-700">
                      {pick.units ?? 1}
                    </td>

                    <td className="px-6 py-5 text-gray-700">
                      {pick.confidence ?? 3}/5
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusClasses(
                          pick.status,
                        )}`}
                      >
                        {pick.status ?? "pending"}
                      </span>
                    </td>

                    <td className="px-6 py-5 font-semibold text-gray-700">
                      {formatProfitLoss(pick.profit_loss)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          pick.is_published
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {pick.is_published ? "Published" : "Draft"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/picks/${pick.id}`}
                        className="font-bold text-amber-700 transition hover:text-amber-900"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}