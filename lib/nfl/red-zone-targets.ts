import { createClient } from "@/lib/supabase/server";

export type NflRedZonePlayer = {
  externalPlayerId: string;
  playerName: string;
  position: string;
  team: string;
  opponent: string | null;
  season: number;
  latestWeek: number;
  latestRedZoneOpportunities: number;
  latestRedZoneCarries: number;
  latestRedZoneTargets: number;
  latestInside10Opportunities: number;
  latestInside5Opportunities: number;
  l3RedZoneOpportunities: number | null;
  l5RedZoneOpportunities: number | null;
  seasonRedZoneOpportunitiesPerGame: number | null;
  seasonRedZoneOpportunities: number;
  seasonRedZoneCarries: number;
  seasonRedZoneTargets: number;
  seasonInside10Opportunities: number;
  seasonInside5Opportunities: number;
  gamesPlayed: number;
};

type RedZoneRow = {
  external_player_id: string;
  player_name: string | null;
  position: string | null;
  team: string | null;
  opponent: string | null;
  season: number;
  latest_week: number;
  latest_red_zone_opportunities: number | null;
  latest_red_zone_carries: number | null;
  latest_red_zone_targets: number | null;
  latest_inside_10_opportunities: number | null;
  latest_inside_5_opportunities: number | null;
  l3_red_zone_opportunities: number | string | null;
  l5_red_zone_opportunities: number | string | null;
  season_red_zone_opportunities_per_game: number | string | null;
  season_red_zone_opportunities: number | null;
  season_red_zone_carries: number | null;
  season_red_zone_targets: number | null;
  season_inside_10_opportunities: number | null;
  season_inside_5_opportunities: number | null;
  games_played: number;
};

function toNumber(value: number | string | null): number | null {
  if (value === null) return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function getNflRedZoneTargets(
  season = 2025,
): Promise<NflRedZonePlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_red_zone_summary")
    .select("*")
    .eq("season", season)
    .order("l3_red_zone_opportunities", {
      ascending: false,
      nullsFirst: false,
    })
    .order("season_red_zone_opportunities", {
      ascending: false,
    })
    .order("player_name", {
      ascending: true,
    });

  if (error) {
    console.error("Failed to load NFL red zone targets:", error);

    throw new Error(
      `Unable to load NFL red zone targets: ${error.message}`,
    );
  }

  return ((data ?? []) as RedZoneRow[])
    .filter(
      (row) =>
        row.player_name &&
        row.position &&
        row.team,
    )
    .map((row) => ({
      externalPlayerId: row.external_player_id,
      playerName: row.player_name!,
      position: row.position!,
      team: row.team!,
      opponent: row.opponent,
      season: row.season,
      latestWeek: row.latest_week,
      latestRedZoneOpportunities:
        row.latest_red_zone_opportunities ?? 0,
      latestRedZoneCarries:
        row.latest_red_zone_carries ?? 0,
      latestRedZoneTargets:
        row.latest_red_zone_targets ?? 0,
      latestInside10Opportunities:
        row.latest_inside_10_opportunities ?? 0,
      latestInside5Opportunities:
        row.latest_inside_5_opportunities ?? 0,
      l3RedZoneOpportunities: toNumber(
        row.l3_red_zone_opportunities,
      ),
      l5RedZoneOpportunities: toNumber(
        row.l5_red_zone_opportunities,
      ),
      seasonRedZoneOpportunitiesPerGame: toNumber(
        row.season_red_zone_opportunities_per_game,
      ),
      seasonRedZoneOpportunities:
        row.season_red_zone_opportunities ?? 0,
      seasonRedZoneCarries:
        row.season_red_zone_carries ?? 0,
      seasonRedZoneTargets:
        row.season_red_zone_targets ?? 0,
      seasonInside10Opportunities:
        row.season_inside_10_opportunities ?? 0,
      seasonInside5Opportunities:
        row.season_inside_5_opportunities ?? 0,
      gamesPlayed: row.games_played,
    }));
}
