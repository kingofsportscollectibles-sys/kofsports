import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregatePublicDecisions,
  sanitizePublicPickExample,
  type PublicDecision,
} from "./record-math";
// Only already-published, settled Premium data can leave this shared public cache.
export const getPublicRecord = unstable_cache(
  async () => {
    const db = createAdminClient();
    const query = () =>
      db
        .from("vip_picks")
        .select("id,sport,status", { count: "exact" })
        .eq("is_published", true)
        .eq("is_premium", true)
        .in("status", ["won", "lost"])
        .order("id");
    const [first, sample] = await Promise.all([
      query().range(0, 999),
      db
        .from("vip_picks")
        .select(
          "id,sport,selection,odds,units,status,profit_loss,game_time,best_sportsbook,analysis,is_published,is_premium",
        )
        .eq("is_published", true)
        .eq("is_premium", true)
        .in("status", ["won", "lost"])
        .not("profit_loss", "is", null)
        .not("odds", "is", null)
        .not("units", "is", null)
        .lt("game_time", new Date().toISOString())
        .order("game_time", { ascending: false, nullsFirst: false })
        .limit(1),
    ]);
    if (first.error)
      throw new Error("Published record is temporarily unavailable.");
    const rows = (first.data ?? []) as PublicDecision[];
    // Fetch four pages at a time, not one query per sport or per player.
    const pages = Math.ceil((first.count ?? rows.length) / 1000);
    for (let page = 1; page < pages; page += 4) {
      const results = await Promise.all(
        Array.from({ length: Math.min(4, pages - page) }, (_, i) =>
          query().range((page + i) * 1000, (page + i + 1) * 1000 - 1),
        ),
      );
      for (const result of results) {
        if (result.error)
          throw new Error("Published record is temporarily unavailable.");
        rows.push(...((result.data ?? []) as PublicDecision[]));
      }
    }
    return {
      sports: aggregatePublicDecisions(rows),
      example: sample.error
        ? null
        : sanitizePublicPickExample(sample.data?.[0], Date.now()),
    };
  },
  ["published-premium-vault-record-v2-analysis"],
  { revalidate: 300, tags: ["published-premium-record"] },
);
