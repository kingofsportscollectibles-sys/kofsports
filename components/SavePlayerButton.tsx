"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSavedPlayers } from "@/components/SavedPlayersProvider";
import { setSavedPlayer } from "@/lib/member/set-saved-player";
import {
  freeAccountContext,
  trackFreeAccountEvent,
} from "@/lib/growth/events/free-account";

type Sport = "nfl" | "nba" | "nhl";

type SavePlayerButtonProps = {
  sport: Sport;
  playerId: string;
  playerName: string;
  variant?: "default" | "board";
};

export default function SavePlayerButton({
  sport,
  playerId,
  playerName,
  variant = "default",
}: SavePlayerButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    userId,
    loading,
    error: loadError,
    savedIds,
    setPlayerSaved,
  } = useSavedPlayers();
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const saved = savedIds.has(`${sport}:${playerId}`);
  const disabled = loading || updating || !playerId || Boolean(loadError);

  async function handleClick() {
    if (disabled) return;

    setUpdating(true);
    setErrorMessage("");

    try {
      const context = !userId ? freeAccountContext(pathname, true) : undefined;
      if (!saved) {
        const tracking = trackFreeAccountEvent("save_player_click", {
          page: pathname,
          sport,
          loggedIn: Boolean(userId),
          context,
        });
        if (!userId) await tracking;
      }
      if (!userId) {
        await trackFreeAccountEvent("save_player_auth_prompt", {
          page: pathname,
          sport,
          context,
        });
        const query = searchParams.toString();
        const returnPath = `${pathname}${query ? `?${query}` : ""}`;
        const pending = new URLSearchParams({
          saveSport: sport,
          savePlayer: playerId,
          ...(context ? { saveFlow: context.funnelId } : {}),
        });
        const separator = returnPath.includes("?") ? "&" : "?";
        const redirect = `${returnPath}${separator}${pending.toString()}`;

        router.push(`/signup?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      const supabase = createClient();

      await setSavedPlayer(supabase, {
        userId,
        sport,
        playerId,
        saved: !saved,
        page: pathname,
      });
      setPlayerSaved(sport, playerId, !saved, userId);
    } catch (error) {
      console.error("Failed to update saved player:", error);
      setErrorMessage("Couldn't update. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleClick();
        }}
        disabled={disabled}
        aria-label={`${saved ? "Remove" : "Save"} ${playerName}`}
        aria-pressed={saved}
        title={saved ? "Remove saved player" : "Save player"}
        className={`${variant === "board" ? "min-h-11 min-w-11 px-3 py-2" : "px-2 py-1"} rounded-lg border text-xs font-semibold transition ${
          saved
            ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
            : "border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
        } disabled:opacity-50`}
      >
        {updating ? "Saving..." : saved ? "★ Saved" : "☆ Save"}
      </button>
      {errorMessage && (
        <span role="alert" className="text-xs text-red-400">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
