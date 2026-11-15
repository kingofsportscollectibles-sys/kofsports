import { getPublicRecord } from "@/lib/marketing/public-record";

const SPORT_ORDER = ["NFL", "MLB", "NHL", "NBA", "CFB", "CBB"];

export type SportResult = {
  sport: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  formattedWins: string;
  formattedLosses: string;
  formattedTotal: string;
  formattedWinRate: string;
};

export type OverallRecord = {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  formattedWins: string;
  formattedLosses: string;
  formattedTotal: string;
  formattedWinRate: string;
};

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatWinRate(value: number) {
  return `${value.toFixed(1)}%`;
}

export async function getSportResults(): Promise<SportResult[]> {
  const { sports } = await getPublicRecord();
  const results = sports.map(({ sport, wins, losses }) => {
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    return {
      sport,
      wins,
      losses,
      total,
      winRate,
      formattedWins: formatNumber(wins),
      formattedLosses: formatNumber(losses),
      formattedTotal: formatNumber(total),
      formattedWinRate: formatWinRate(winRate),
    };
  });
  return results.sort((a, b) => {
    const rank = (sport: string) => {
      const n = SPORT_ORDER.indexOf(sport);
      return n < 0 ? SPORT_ORDER.length : n;
    };
    return rank(a.sport) - rank(b.sport) || a.sport.localeCompare(b.sport);
  });
}

export function getOverallRecord(sportsResults: SportResult[]): OverallRecord {
  const wins = sportsResults.reduce((total, result) => total + result.wins, 0);

  const losses = sportsResults.reduce(
    (total, result) => total + result.losses,
    0,
  );

  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  return {
    wins,
    losses,
    total,
    winRate,
    formattedWins: formatNumber(wins),
    formattedLosses: formatNumber(losses),
    formattedTotal: formatNumber(total),
    formattedWinRate: formatWinRate(winRate),
  };
}
