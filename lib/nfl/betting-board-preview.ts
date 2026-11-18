// Server selection policy. Never accept player IDs, day or limits from request parameters.
import { createHash } from "node:crypto";
import { isBoardRowCurrent, type BettingBoardData } from "./betting-board";
export const FREE_BOARD_PLAYER_LIMIT = 3;
export function previewDay(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}
export function selectPreviewPlayers(
  board: BettingBoardData,
  day: string,
  now = Date.now(),
): string[] {
  const ids = [
    ...new Set(
      board.rows
        .filter((row) => isBoardRowCurrent(row, now))
        .map((row) => row.playerId),
    ),
  ];
  const rank = (id: string) =>
    createHash("sha256").update(`free-board-v1:${day}:${id}`).digest("hex");
  return ids
    .sort((a, b) => rank(a).localeCompare(rank(b)) || a.localeCompare(b))
    .slice(0, FREE_BOARD_PLAYER_LIMIT);
}
export function trimFreePreview(
  board: BettingBoardData,
  selected: string[],
  now = Date.now(),
): BettingBoardData {
  const allowed = new Set(selected.slice(0, FREE_BOARD_PLAYER_LIMIT));
  const rows = board.rows.filter(
    (row) => allowed.has(row.playerId) && isBoardRowCurrent(row, now),
  );
  // Construct a new DTO: no hidden full-board rows, counts, exclusions or source metadata.
  return {
    calculatedAt: board.calculatedAt,
    rows,
    logsUpdatedAt: board.logsUpdatedAt,
    warnings: rows.length
      ? []
      : [
          "Today’s free sample has no fresh upcoming props. Check back after the next daily selection.",
        ],
    sourceLatestQuoteAt:
      rows
        .map((row) => row.lineUpdatedAt)
        .sort()
        .at(-1) ?? null,
    sourceFreshQuotes: rows.length,
    coverage: {
      sourceRows: rows.length,
      displayed: rows.length,
      excluded: {},
      missingScores: rows.filter((row) => row.kofScore === null).length,
      missingMatchups: rows.filter((row) => row.matchup.rank === null).length,
      limitedHistory: rows.filter((row) => row.l5.games < 5).length,
    },
  };
}
