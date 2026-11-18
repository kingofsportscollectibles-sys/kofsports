import type { PublicPregameEvidence } from "@/lib/nfl/pregame-evidence";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const date = (value: string) => `${formatter.format(new Date(value))} ET`;
export function PregameChecks({
  evidence,
}: {
  evidence: PublicPregameEvidence;
}) {
  return (
    <section
      aria-label="Pregame player evidence"
      className="space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3"
    >
      <h4 className="font-semibold text-slate-200">Pregame checks</h4>
      <p className="text-amber-200">
        Starter: {evidence.starter} · Injury status: {evidence.injury}
      </p>
      <p>
        {evidence.roleLabel}. Historical participation does not confirm this
        week’s starting role.
      </p>
      <p>{evidence.ratingNote}</p>
      <p>
        Roster: {evidence.rosterStatus ?? "Unavailable"}
        {evidence.rosterImportedAt && (
          <>
            {" "}
            · imported{" "}
            <time dateTime={evidence.rosterImportedAt}>
              {date(evidence.rosterImportedAt)}
            </time>
          </>
        )}
        . Active roster status does not confirm game-day availability.
      </p>
      <p className="text-amber-200">{evidence.rosterNote}</p>
      {evidence.recent.length > 0 && (
        <ul className="space-y-2">
          {evidence.recent.map((game) => (
            <li key={`${game.week}:${game.date}`}>
              <p>
                Week {game.week}:{" "}
                {game.attempts === null
                  ? "Attempts unavailable"
                  : `${game.attempts} of ${game.recordedTeamAttempts ?? "unknown"} recorded team attempts`}
                {game.offensiveSnapPct !== null
                  ? ` · ${(game.offensiveSnapPct * 100).toFixed(0)}% offensive snaps`
                  : " · snaps unavailable"}
              </p>
              {game.statsImportedAt && (
                <p className="text-[10px]">
                  Stats imported{" "}
                  <time dateTime={game.statsImportedAt}>
                    {date(game.statsImportedAt)}
                  </time>
                  .
                </p>
              )}
              {game.snapsImportedAt && (
                <p className="text-[10px]">
                  Snaps imported{" "}
                  <time dateTime={game.snapsImportedAt}>
                    {date(game.snapsImportedAt)}
                  </time>
                  .
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px]">
        Source: stored roster and historical game participation. Import times
        show when records were stored, not when player availability was
        confirmed.
      </p>
      {evidence.checkedAt && (
        <p className="text-[10px]">
          Checked{" "}
          <time dateTime={evidence.checkedAt}>{date(evidence.checkedAt)}</time>.
        </p>
      )}
    </section>
  );
}
