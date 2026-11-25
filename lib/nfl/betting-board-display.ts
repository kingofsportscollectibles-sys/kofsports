import { publicInjuryContext } from "./injury-context";
import { toPublicPregameEvidence, unavailablePregameEvidence, isPassingRatingWithheld } from "./pregame-evidence";
import { sortBoardRows } from "./betting-board";
// Explicit allowlist at the server-to-browser boundary, shared by free and Pro reads.
import type {
  BettingBoardData,
  BoardPublicData,
  BoardPublicRow,
} from "./betting-board";
export function toPublicBettingBoard(board: BettingBoardData): BoardPublicData {
  const rows: BoardPublicRow[] = board.rows.map((row) => ({
    id: row.id,
    playerId: row.playerId,
    player: row.player,
    team: row.team,
    position: row.position,
    profileHref: row.profileHref,
    gameId: row.gameId,
    game: row.game,
    opponent: row.opponent,
    season: row.season,
    week: row.week,
    kickoff: row.kickoff,
    market: row.market,
    line: row.line,
    projection: row.projection,
    edge: row.edge,
    direction: row.direction,
    bookmaker: row.bookmaker,
    overPrice: row.overPrice,
    underPrice: row.underPrice,
    lineUpdatedAt: row.lineUpdatedAt,
    calculatedAt: row.calculatedAt,
    kofScore: row.injury?.ratingWithheld || row.availability?.ratingWithheld || isPassingRatingWithheld(row) ? null : row.kofScore,
    rosterStatus: row.rosterStatus,
    ...(row.injury ? { injury: publicInjuryContext(row.injury) } : {}),
    ...(row.availability ? { availability: { status: row.availability.status, ratingWithheld: row.availability.ratingWithheld, note: row.availability.note, reviewedAt: row.availability.reviewedAt } } : {}),
    ...(row.market === "player_pass_yds" ? { pregame: toPublicPregameEvidence(row.pregameEvidence ?? unavailablePregameEvidence(row.calculatedAt)) } : {}),
    l5: {
      games: row.l5.games,
      overs: row.l5.overs,
      unders: row.l5.unders,
      pushes: row.l5.pushes,
      settled: row.l5.settled,
      overRate: row.l5.overRate,
      recent: row.l5.recent.map((game) => ({
        gameId: game.gameId,
        season: game.season,
        date: game.date,
        opponent: game.opponent,
        value: game.value,
        result: game.result,
      })),
    },
    matchup: {
      label: row.matchup.label,
      rank: row.matchup.rank,
      allowed: row.matchup.allowed,
      games: row.matchup.games,
      season: row.matchup.season,
      ...(row.matchup.reason
        ? { reason: "Reliable current-season matchup data is unavailable." }
        : {}),
    },
    research: {
      recentGames: row.confidence?.historyGames ?? null,
      seasonGames: row.confidence?.currentSeasonGames ?? null,
      h2hGames: row.confidence?.components?.h2h.observedGames ?? null,
      scoreNote:
        row.injury?.ratingWithheld ? row.injury.note : row.availability?.ratingWithheld ? row.availability.note : isPassingRatingWithheld(row)
          ? "Passing KOFScore is withheld while game-day starter and injury status are unverified."
          : row.kofScore === null
            ? row.direction === "none"
              ? "There is no directional lean for this prop."
              : "There is not enough reliable evidence to display KOFScore for this prop."
            : null,
    },
  }));
  return {
    rows: sortBoardRows(rows,"kofScore","desc"),
    calculatedAt: board.calculatedAt,
    logsUpdatedAt: board.logsUpdatedAt,
    sourceLatestQuoteAt: board.sourceLatestQuoteAt,
    sourceFreshQuotes: board.sourceFreshQuotes,
    warnings: [
      ...new Set(
        board.warnings.map((message) =>
          [
            "The stored sportsbook lines are older than 24 hours or have no verified update time. Fresh source data is needed before props can be shown.",
            "Today’s free sample has no fresh upcoming props. Check back after the next daily selection.",
            "Matchup data is temporarily unavailable.",
          ].includes(message)
            ? message
            : "Some research data is temporarily unavailable.",
        ),
      ),
    ],
    coverage: {
      sourceRows: board.coverage.sourceRows,
      displayed: board.coverage.displayed,
      missingScores: rows.filter(row=>row.kofScore===null).length,
      missingMatchups: board.coverage.missingMatchups,
      limitedHistory: board.coverage.limitedHistory,
      excluded: {},
    },
  };
}
