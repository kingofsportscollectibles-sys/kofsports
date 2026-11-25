import "server-only";

import { cache } from "react";
import { toPublicBettingBoard } from "@/lib/nfl/betting-board-display";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  previewDay,
  selectPreviewPlayers,
  trimFreePreview,
} from "@/lib/nfl/betting-board-preview";
import { hasKofSportsProAccess } from "@/lib/auth/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { readAuthorizedBoard } from "@/lib/nfl/betting-board-access";
import { loadNflBettingBoardSource } from "@/lib/nfl/betting-board-source";

// React cache only deduplicates within a server render, never between users/sessions.
export const getBettingBoardAccess = cache(hasKofSportsProAccess);
export const getBettingBoardData = cache(() =>
  readAuthorizedBoard(getBettingBoardAccess, async () =>
    toPublicBettingBoard(await loadNflBettingBoardSource(createAdminClient())),
  ),
);

// Only the server holds this shared source cache. Authorization is never cached here.
// The legacy cache API fits this application's current non-Cache-Components setup.
const getPreviewSource = unstable_cache(
  () => loadNflBettingBoardSource(createAdminClient()),
  ["nfl-free-board-source-v5-private-injury-context"],
  { revalidate: 60 },
);
const getDailyPreviewPlayers = unstable_cache(
  async (day: string) => {
    const board = await getPreviewSource();
    const selected = selectPreviewPlayers(board, day);
    // Do not freeze an empty selection during a temporary feed outage.
    if (!selected.length)
      throw new Error("No fresh free-preview players available.");
    return selected;
  },
  ["nfl-free-board-daily-players-v1"],
  { revalidate: 86400 },
);

export const getFreeBettingBoardData = cache(() =>
  readAuthorizedBoard(
    async () => {
      const client = await createClient();
      const {
        data: { user },
        error,
      } = await client.auth.getUser();
      return !error && !!user;
    },
    async () => {
      const day = previewDay();
      const selected = await getDailyPreviewPlayers(day);
      return toPublicBettingBoard(
        trimFreePreview(await getPreviewSource(), selected),
      );
    },
  ),
);
