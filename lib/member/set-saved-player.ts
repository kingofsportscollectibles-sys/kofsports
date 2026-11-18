import type { SupabaseClient } from "@supabase/supabase-js";
import { freeAccountContext } from "@/lib/growth/events/free-account";
import { getAnonymousId, getGrowthSession } from "@/lib/growth/events/session";

export async function setSavedPlayer(client: SupabaseClient, input: {
  userId: string; sport: string; playerId: string; saved: boolean; page: string; funnelId?: string;
}) {
  let anonymousId: string | null = null;
  let sessionId: string | null = null;
  let funnelId = input.funnelId;
  try {
    anonymousId = getAnonymousId(); sessionId = getGrowthSession();
    funnelId ??= freeAccountContext(input.page).funnelId;
  } catch { /* Optional attribution. */ }
  const { data, error } = await client.rpc("set_saved_player", {
    p_sport: input.sport, p_player_id: input.playerId, p_saved: input.saved,
    p_page: input.page, p_anonymous_id: anonymousId, p_session_id: sessionId, p_funnel_id: funnelId ?? null,
  });
  if (!error) return { changed: data === true };
  // Keep the existing save feature usable while the reviewed migration awaits application.
  if (!["PGRST202", "42883"].includes(error.code)) throw error;
  const query = input.saved
    ? client.from("saved_players").upsert({ user_id: input.userId, sport: input.sport, player_id: input.playerId }, { onConflict: "user_id,sport,player_id", ignoreDuplicates: true }).select("id")
    : client.from("saved_players").delete().eq("user_id", input.userId).eq("sport", input.sport).eq("player_id", input.playerId).select("id");
  const result = await query;
  if (result.error) throw result.error;
  return { changed: Boolean(result.data?.length) };
}
