import Image from "next/image";

import type { NflBettingPowerRanking } from "@/lib/nfl/betting-power-rankings";

type Props = {
  rankings: NflBettingPowerRanking[];
};

const TEAM_NAMES: Record<string, string> = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LA: "Los Angeles Rams",
  LAC: "Los Angeles Chargers",
  LV: "Las Vegas Raiders",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SEA: "Seattle Seahawks",
  SF: "San Francisco 49ers",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

const ESPN_TEAM_IDS: Record<string, string> = {
  ARI: "ari",
  ATL: "atl",
  BAL: "bal",
  BUF: "buf",
  CAR: "car",
  CHI: "chi",
  CIN: "cin",
  CLE: "cle",
  DAL: "dal",
  DEN: "den",
  DET: "det",
  GB: "gb",
  HOU: "hou",
  IND: "ind",
  JAX: "jax",
  KC: "kc",
  LA: "lar",
  LAC: "lac",
  LV: "lv",
  MIA: "mia",
  MIN: "min",
  NE: "ne",
  NO: "no",
  NYG: "nyg",
  NYJ: "nyj",
  PHI: "phi",
  PIT: "pit",
  SEA: "sea",
  SF: "sf",
  TB: "tb",
  TEN: "ten",
  WAS: "wsh",
};

function getTeamLogo(team: string): string {
  const espnId = ESPN_TEAM_IDS[team] ?? team.toLowerCase();

  return `https://a.espncdn.com/i/teamlogos/nfl/500/${espnId}.png`;
}

function formatAtsRecord(
  ranking: NflBettingPowerRanking,
): string {
  if (ranking.pushes > 0) {
    return `${ranking.wins}-${ranking.losses}-${ranking.pushes}`;
  }

  return `${ranking.wins}-${ranking.losses}`;
}

function formatPct(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatMargin(value: number | null): string {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }

  return value.toFixed(1);
}

function marginClass(value: number | null): string {
  if (value === null || value === 0) {
    return "text-slate-300";
  }

  return value > 0
    ? "text-emerald-400"
    : "text-rose-400";
}

export default function NflBettingPowerRankings({
  rankings,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="hidden grid-cols-[72px_minmax(260px,1fr)_120px_120px_150px_150px] items-center gap-4 border-b border-slate-800 bg-slate-950/70 px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 lg:grid">
        <div className="text-center">Rank</div>
        <div>Team</div>
        <div className="text-center">ATS</div>
        <div className="text-center">ATS %</div>
        <div className="text-right">
          Avg Cover Margin
        </div>
        <div className="text-right">
          Total Cover Margin
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {rankings.map((ranking) => (
          <div
            key={ranking.team}
            className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3 gap-y-4 px-4 py-5 transition hover:bg-slate-800/40 sm:grid-cols-[64px_minmax(0,1fr)] sm:px-5 lg:grid-cols-[72px_minmax(260px,1fr)_120px_120px_150px_150px] lg:items-center lg:gap-4 lg:py-4"
          >
            <div className="flex items-center justify-center">
              <span
                className={`text-2xl font-black tabular-nums ${
                  ranking.rank <= 5
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                {ranking.rank}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
                <Image
                  src={getTeamLogo(ranking.team)}
                  alt={`${TEAM_NAMES[ranking.team] ?? ranking.team} logo`}
                  width={56}
                  height={56}
                  className="max-h-full w-auto object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-bold text-white sm:text-lg">
                  {TEAM_NAMES[ranking.team] ??
                    ranking.team}
                </div>

                <div className="mt-0.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {ranking.team}
                </div>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-1 lg:contents">
              <div className="rounded-xl bg-slate-950/60 p-3 lg:rounded-none lg:bg-transparent lg:p-0 lg:text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                  ATS
                </div>

                <div className="mt-1 font-bold tabular-nums text-white lg:mt-0">
                  {formatAtsRecord(ranking)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 lg:rounded-none lg:bg-transparent lg:p-0 lg:text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                  ATS %
                </div>

                <div className="mt-1 font-bold tabular-nums text-white lg:mt-0">
                  {formatPct(ranking.atsPct)}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 lg:rounded-none lg:bg-transparent lg:p-0 lg:text-right">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                  Avg Margin
                </div>

                <div
                  className={`mt-1 font-bold tabular-nums lg:mt-0 ${marginClass(
                    ranking.avgCoverMargin,
                  )}`}
                >
                  {formatMargin(
                    ranking.avgCoverMargin,
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 p-3 lg:rounded-none lg:bg-transparent lg:p-0 lg:text-right">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 lg:hidden">
                  Total Margin
                </div>

                <div
                  className={`mt-1 font-bold tabular-nums lg:mt-0 ${marginClass(
                    ranking.totalCoverMargin,
                  )}`}
                >
                  {formatMargin(
                    ranking.totalCoverMargin,
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
