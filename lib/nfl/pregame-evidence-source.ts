import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EvidenceRoster,
  EvidenceStat,
  EvidenceUsage,
} from "./pregame-evidence";

// Batched, read-only source access. No provider calls or data ingestion.
export async function loadPassingEvidenceSources(
  client: SupabaseClient,
  input: { playerIds: string[]; teams: string[]; seasons: number[] },
) {
  const errors: string[] = [];
  async function read<T>(
    name: string,
    columns: string,
    kind: "stats" | "usage" | "roster",
  ): Promise<T[]> {
    const result: T[] = [];
    try {
      for (let from = 0; ; from += 1000) {
        let query = client
          .from(name)
          .select(columns)
          .in("season", input.seasons);
        if (kind === "stats")
          query = query.in("team", input.teams).gt("passing_attempts", 0);
        else
          query = query.in(
            kind === "roster" ? "gsis_id" : "external_player_id",
            input.playerIds,
          );
        const { data, error } = await query.order("id").range(from, from + 999);
        if (error) throw Error("Evidence read failed");
        result.push(...((data ?? []) as T[]));
        if (!data || data.length < 1000) return result;
      }
    } catch {
      errors.push(kind);
      return [];
    }
  }
  if (!input.playerIds.length || !input.seasons.length || !input.teams.length)
    return {
      stats: [] as EvidenceStat[],
      usage: [] as EvidenceUsage[],
      rosters: [] as EvidenceRoster[],
      errors,
    };
  const [stats, usage, rosters] = await Promise.all([
    read<EvidenceStat>(
      "nfl_player_game_stats",
      "id,game_id,external_player_id,season,week,team,passing_attempts,updated_at",
      "stats",
    ),
    read<EvidenceUsage>(
      "nfl_player_game_usage",
      "external_game_id,external_player_id,season,week,game_type,team,offensive_snap_pct,updated_at",
      "usage",
    ),
    read<EvidenceRoster>(
      "nfl_player_current_teams",
      "gsis_id,team,season,roster_week,game_type,status,updated_at",
      "roster",
    ),
  ]);
  return { stats, usage, rosters, errors };
}
