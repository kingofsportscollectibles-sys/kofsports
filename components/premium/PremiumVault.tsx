import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type VaultSearchParams = {
  vaultSearch?: string;
  vaultSport?: string;
  vaultBetType?: string;
  vaultResult?: string;
  vaultYear?: string;
  vaultPage?: string;
};

type VaultPick = {
  id: string;
  sport: string | null;
  game_date: string | null;
  matchup: string | null;
  bet_type: string | null;
  selection: string;
  odds: number | null;
  units: number | null;
  status: string | null;
  profit_loss: number | null;
};

const PAGE_SIZE = 25;
const DISPLAY_TIME_ZONE = "America/New_York";

function formatOdds(odds: number | null) {
  if (odds === null) {
    return "—";
  }

  return odds > 0 ? `+${odds}` : String(odds);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

function formatProfitLoss(value: number | null) {
  if (value === null) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}u`;
}

function getResultStyles(status: string | null) {
  switch (status) {
    case "won":
      return "border-green-200 bg-green-50 text-green-700";
    case "lost":
      return "border-red-200 bg-red-50 text-red-700";
    case "push":
      return "border-gray-200 bg-gray-100 text-gray-700";
    case "void":
      return "border-gray-200 bg-gray-100 text-gray-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getResultLabel(status: string | null) {
  switch (status) {
    case "won":
      return "Win";
    case "lost":
      return "Loss";
    case "push":
      return "Push";
    case "void":
      return "Void";
    default:
      return "Pending";
  }
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildVaultHref(
  params: VaultSearchParams,
  page: number,
) {
  const urlParams = new URLSearchParams();

  if (params.vaultSearch) {
    urlParams.set("vaultSearch", params.vaultSearch);
  }

  if (params.vaultSport) {
    urlParams.set("vaultSport", params.vaultSport);
  }

  if (params.vaultBetType) {
    urlParams.set("vaultBetType", params.vaultBetType);
  }

  if (params.vaultResult) {
    urlParams.set("vaultResult", params.vaultResult);
  }

  if (params.vaultYear) {
    urlParams.set("vaultYear", params.vaultYear);
  }

  urlParams.set("vaultPage", String(page));

  return `/vip?${urlParams.toString()}#premium-vault`;
}

export default async function PremiumVault({
  searchParams,
}: {
  searchParams: VaultSearchParams;
}) {

  const supabase = await createClient();

  const currentPage = parsePage(searchParams.vaultPage);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const selectedSearch = searchParams.vaultSearch?.trim() ?? "";
  const selectedSport = searchParams.vaultSport?.trim() ?? "";
  const selectedBetType = searchParams.vaultBetType?.trim() ?? "";
  const selectedResult = searchParams.vaultResult?.trim() ?? "";
  const selectedYear = searchParams.vaultYear?.trim() ?? "";

  const { data: optionData } = await supabase
    .from("vip_picks")
    .select("sport, bet_type, game_date")
    .eq("is_published", true)
    .eq("is_premium", true)
    .in("status", ["won", "lost", "push", "void"]);

  const availableSports = Array.from(
    new Set(
      (optionData ?? [])
        .map((pick) => pick.sport?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  const availableBetTypes = Array.from(
    new Set(
      (optionData ?? [])
        .map((pick) => pick.bet_type?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  const availableYears = Array.from(
    new Set(
      (optionData ?? [])
        .map((pick) => pick.game_date?.slice(0, 4))
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => b.localeCompare(a));

  let query = supabase
    .from("vip_picks")
    .select(
      `
        id,
        sport,
        game_date,
        matchup,
        bet_type,
        selection,
        odds,
        units,
        status,
        profit_loss
      `,
      { count: "exact" },
    )
    .eq("is_published", true)
    .eq("is_premium", true)
    .in("status", ["won", "lost", "push", "void"]);

  if (selectedSport) {
    query = query.eq("sport", selectedSport);
  }

  if (selectedBetType) {
    query = query.eq("bet_type", selectedBetType);
  }

  if (selectedResult) {
    query = query.eq("status", selectedResult);
  }

  if (selectedYear) {
    query = query
      .gte("game_date", `${selectedYear}-01-01`)
      .lt("game_date", `${Number(selectedYear) + 1}-01-01`);
  }

  if (selectedSearch) {
    const safeSearch = selectedSearch
      .replaceAll(",", " ")
      .replaceAll("%", "")
      .trim();

    if (safeSearch) {
      query = query.or(
        `selection.ilike.%${safeSearch}%,matchup.ilike.%${safeSearch}%,game_notes.ilike.%${safeSearch}%`,
      );
    }
  }

  const {
    data,
    count,
    error,
  } = await query
    .order("game_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  const picks = (data ?? []) as VaultPick[];
  const totalResults = count ?? 0;
  const totalPages = Math.max(
    1,
    Math.ceil(totalResults / PAGE_SIZE),
  );

  return (
    <section
      id="premium-vault"
      className="border-t border-gray-200 bg-white px-6 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700">
            Searchable History
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            The Premium Vault
          </h2>

          <p className="mt-3 leading-7 text-gray-600">
  Search the complete KofSports Premium results archive by
  selection, sport, bet type, result, or year.
</p>
        </div>
    
            <form
              action="/vip#premium-vault"
              method="get"
              className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:p-8"
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label
                    htmlFor="vaultSearch"
                    className="text-sm font-black text-gray-700"
                  >
                    Search picks
                  </label>

                  <input
                    id="vaultSearch"
                    name="vaultSearch"
                    type="search"
                    defaultValue={selectedSearch}
                    placeholder="Search Patriots, Red Sox, Mahomes, over..."
                    className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black outline-none transition focus:border-amber-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vaultSport"
                    className="text-sm font-black text-gray-700"
                  >
                    Sport
                  </label>

                  <select
                    id="vaultSport"
                    name="vaultSport"
                    defaultValue={selectedSport}
                    className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  >
                    <option value="">All sports</option>
                    {availableSports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vaultBetType"
                    className="text-sm font-black text-gray-700"
                  >
                    Bet type
                  </label>

                  <select
                    id="vaultBetType"
                    name="vaultBetType"
                    defaultValue={selectedBetType}
                    className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  >
                    <option value="">All bet types</option>
                    {availableBetTypes.map((betType) => (
                      <option key={betType} value={betType}>
                        {betType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vaultResult"
                    className="text-sm font-black text-gray-700"
                  >
                    Result
                  </label>

                  <select
                    id="vaultResult"
                    name="vaultResult"
                    defaultValue={selectedResult}
                    className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  >
                    <option value="">All results</option>
                    <option value="won">Wins</option>
                    <option value="lost">Losses</option>
                    <option value="push">Pushes</option>
                    <option value="void">Voids</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="vaultYear"
                    className="text-sm font-black text-gray-700"
                  >
                    Year
                  </label>

                  <select
                    id="vaultYear"
                    name="vaultYear"
                    defaultValue={selectedYear}
                    className="mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-black"
                  >
                    <option value="">All years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-black px-7 py-3 font-black text-white transition hover:bg-amber-400 hover:text-black"
                >
                  Search Vault
                </button>

                <Link
                  href="/vip#premium-vault"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3 font-black text-black transition hover:border-black"
                >
                  Clear Filters
                </Link>
              </div>
            </form>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-bold text-gray-600">
                {totalResults.toLocaleString()}{" "}
                {totalResults === 1 ? "pick" : "picks"} found
              </p>

              <p className="text-sm font-semibold text-gray-500">
                Page {Math.min(currentPage, totalPages)} of {totalPages}
              </p>
            </div>

            {error && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                The Premium Vault could not be loaded.
              </div>
            )}

            {!error && picks.length === 0 && (
              <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center">
                <h3 className="text-2xl font-black">
                  No archived picks match these filters
                </h3>

                <p className="mt-3 text-gray-600">
                  Try another search, sport, bet type, result, or year.
                </p>
              </div>
            )}

            {!error && picks.length > 0 && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200">
                {picks.map((pick, index) => (
                  <article
                    key={pick.id}
                    className={`grid gap-5 bg-white px-6 py-6 lg:grid-cols-[140px_1fr_150px_120px] lg:items-center ${
                      index > 0 ? "border-t border-gray-200" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-black text-black">
                        {formatDate(pick.game_date)}
                      </p>

                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                        {pick.sport ?? "Sport"}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {pick.bet_type && (
                          <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-600">
                            {pick.bet_type}
                          </span>
                        )}

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${getResultStyles(
                            pick.status,
                          )}`}
                        >
                          {getResultLabel(pick.status)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black text-black">
                        {pick.selection}
                      </h3>

                      {pick.matchup && (
                        <p className="mt-1 text-sm text-gray-500">
                          {pick.matchup}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                        Odds
                      </p>

                      <p className="mt-1 font-black text-black">
                        {formatOdds(pick.odds)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                        Units
                      </p>

                      <p
                        className={`mt-1 font-black ${
                          pick.profit_loss && pick.profit_loss > 0
                            ? "text-green-700"
                            : pick.profit_loss && pick.profit_loss < 0
                              ? "text-red-700"
                              : "text-black"
                        }`}
                      >
                        {formatProfitLoss(pick.profit_loss)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!error && totalPages > 1 && (
              <nav
                className="mt-8 flex items-center justify-between gap-4"
                aria-label="Premium Vault pagination"
              >
                {currentPage > 1 ? (
                  <Link
                    href={buildVaultHref(
                      searchParams,
                      currentPage - 1,
                    )}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2 font-black text-black transition hover:border-black"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}

                {currentPage < totalPages && (
                  <Link
                    href={buildVaultHref(
                      searchParams,
                      currentPage + 1,
                    )}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-black px-5 py-2 font-black text-white transition hover:bg-amber-400 hover:text-black"
                  >
                    Next →
                  </Link>
                )}
              </nav>
            )}
      </div>
    </section>
  );
}