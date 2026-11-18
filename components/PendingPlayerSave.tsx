"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSavedPlayers } from "@/components/SavedPlayersProvider";
import { setSavedPlayer } from "@/lib/member/set-saved-player";

type Sport = "nfl" | "nba" | "nhl";

type Props = {
  sport: Sport;
  eligiblePlayerIds: string[];
};

export default function PendingPlayerSave({ sport }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setPlayerSaved, loading, userId } = useSavedPlayers();
  const [saveError, setSaveError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const requestedSport = searchParams.get("saveSport");
  const requestedPlayer = searchParams.get("savePlayer");
  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    if (loading || !userId || !requestedPlayer || requestedSport !== sport) {
      return;
    }
    let cancelled = false;

    async function completeSave() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError && authError.name !== "AuthSessionMissingError")
          throw authError;
        if (!user || cancelled) return;
        setSaveError(false);

        const numericPlayerId = Number(requestedPlayer);
        if (
          sport !== "nfl" &&
          (!Number.isSafeInteger(numericPlayerId) ||
            numericPlayerId <= 0 ||
            String(numericPlayerId) !== requestedPlayer)
        )
          return;

        const table =
          sport === "nfl"
            ? "nfl_player_pages"
            : sport === "nba"
              ? "nba_player_pages"
              : "nhl_players";
        const idColumn =
          sport === "nfl" ? "gsis_id" : sport === "nba" ? "player_id" : "id";
        const { data: player, error: playerError } = await supabase
          .from(table)
          .select(idColumn)
          .eq(idColumn, sport === "nfl" ? requestedPlayer : numericPlayerId)
          .maybeSingle();

        if (playerError) throw playerError;
        if (!player || cancelled) return;

        await setSavedPlayer(supabase, {
          userId: user.id,
          sport,
          playerId: requestedPlayer!,
          saved: true,
          page: pathname,
          funnelId:
            new URLSearchParams(searchParamsKey).get("saveFlow") ?? undefined,
        });
        if (cancelled) return;

        const params = new URLSearchParams(searchParamsKey);
        params.delete("saveSport");
        params.delete("savePlayer");
        params.delete("saveFlow");

        const query = params.toString();
        setPlayerSaved(sport, requestedPlayer!, true, user.id);
        router.replace(`${pathname}${query ? `?${query}` : ""}`);
      } catch (error) {
        console.error("Failed to complete pending player save:", error);
        if (!cancelled) setSaveError(true);
      }
    }

    void completeSave();

    return () => {
      cancelled = true;
    };
  }, [
    sport,
    loading,
    userId,
    attempt,
    requestedSport,
    requestedPlayer,
    pathname,
    router,
    searchParamsKey,
    setPlayerSaved,
  ]);

  return saveError ? (
    <div
      role="alert"
      className="my-3 rounded-xl border border-amber-400/30 p-3 text-sm text-amber-400"
    >
      We couldn’t finish saving your player.{" "}
      <button
        type="button"
        onClick={() => setAttempt((value) => value + 1)}
        className="min-h-11 underline"
      >
        Try again
      </button>
    </div>
  ) : null;
}
