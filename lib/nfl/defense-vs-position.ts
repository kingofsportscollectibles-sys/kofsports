import type {
  DefenseVsPositionRow,
  DvpPosition,
} from "@/components/nfl/NflDefenseVsPositionTable";
import { createClient } from "@/lib/supabase/server";

export async function getNflDefenseVsPositionMatchup(
  defense: string | null,
  position: DvpPosition,
  season: number,
): Promise<DefenseVsPositionRow | null> {
  if (!defense) {
    return null;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_defense_vs_position")
    .select("*")
    .eq("season", season)
    .eq("defense", defense)
    .eq("position", position)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load NFL defense vs position matchup:",
      {
        defense,
        position,
        season,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    return null;
  }

  return (data ?? null) as DefenseVsPositionRow | null;
}
