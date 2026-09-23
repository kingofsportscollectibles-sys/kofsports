import type {
  NhlStartingGoalie,
  NhlStartingGoalieMatchup,
  NhlStartingGoalieStatus,
} from "@/lib/nhl/starting-goalies";

type Props = {
  matchups: NhlStartingGoalieMatchup[];
};

function formatGameTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(value));
}

function formatSourceTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function statusLabel(status: NhlStartingGoalieStatus) {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "likely":
      return "Likely";
    case "unconfirmed":
      return "Unconfirmed";
  }
}

function statusClass(status: NhlStartingGoalieStatus) {
  switch (status) {
    case "confirmed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "likely":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "unconfirmed":
      return "border-slate-700 bg-slate-800/60 text-slate-400";
  }
}

function statusDotClass(
  status: NhlStartingGoalieStatus,
) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-400";
    case "likely":
      return "bg-amber-300";
    case "unconfirmed":
      return "bg-slate-500";
  }
}

function GoalieHeadshot({
  goalie,
}: {
  goalie: NhlStartingGoalie | null;
}) {
  if (goalie?.headshotUrl) {
    return (
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800 sm:h-24 sm:w-24">
        <img
          src={goalie.headshotUrl}
          alt={
            goalie.goalieName
              ? `${goalie.goalieName} headshot`
              : "NHL goalie"
          }
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-2xl font-black text-slate-500 sm:h-24 sm:w-24">
      G
    </div>
  );
}

function GoaliePanel({
  goalie,
  team,
}: {
  goalie: NhlStartingGoalie | null;
  team: string;
}) {
  if (!goalie) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center px-5 py-7 text-center">
        <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
          {team}
        </div>

        <div className="mt-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-2xl font-black text-slate-500 sm:h-24 sm:w-24">
          ?
        </div>

        <div className="mt-4 text-lg font-bold text-white">
          Starter TBD
        </div>

        <div className="mt-2 text-sm text-slate-500">
          No goalie information available yet.
        </div>
      </div>
    );
  }

  const sourceTime = formatSourceTime(
    goalie.sourceUpdatedAt,
  );

  return (
    <div className="flex min-h-52 flex-col px-5 py-7 sm:px-7">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
          {team}
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
            goalie.status,
          )}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusDotClass(
              goalie.status,
            )}`}
          />
          {statusLabel(goalie.status)}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <GoalieHeadshot goalie={goalie} />

        <div className="min-w-0">
          <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            {goalie.goalieName ?? "Starter TBD"}
          </h3>

          <div className="mt-1 text-sm text-slate-500">
            {goalie.isHome ? "Home" : "Away"} goalie
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        {goalie.sourceName ||
        goalie.sourceUpdatedAt ? (
          <div className="border-t border-slate-800 pt-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Source
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              {goalie.sourceUrl &&
              goalie.sourceName ? (
                <a
                  href={goalie.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-400 transition hover:text-emerald-400"
                >
                  {goalie.sourceName}
                </a>
              ) : goalie.sourceName ? (
                <span>{goalie.sourceName}</span>
              ) : null}

              {goalie.sourceName && sourceTime ? (
                <span>•</span>
              ) : null}

              {sourceTime ? (
                <span>{sourceTime}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-800 pt-4 text-xs text-slate-600">
            Awaiting confirmation source.
          </div>
        )}
      </div>
    </div>
  );
}

function MatchupCard({
  matchup,
}: {
  matchup: NhlStartingGoalieMatchup;
}) {
  const confirmedCount = [
    matchup.awayGoalie,
    matchup.homeGoalie,
  ].filter(
    (goalie) => goalie?.status === "confirmed",
  ).length;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex flex-col gap-2 border-b border-slate-800 bg-slate-950/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="text-base font-black text-white">
            {matchup.awayTeam}{" "}
            <span className="font-medium text-slate-600">
              @
            </span>{" "}
            {matchup.homeTeam}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {formatGameTime(matchup.commenceTime)}
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {confirmedCount === 2
            ? "Both starters confirmed"
            : confirmedCount === 1
              ? "1 of 2 starters confirmed"
              : "Awaiting confirmations"}
        </div>
      </div>

      <div className="grid divide-y divide-slate-800 md:grid-cols-2 md:divide-x md:divide-y-0">
        <GoaliePanel
          goalie={matchup.awayGoalie}
          team={matchup.awayTeam}
        />

        <GoaliePanel
          goalie={matchup.homeGoalie}
          team={matchup.homeTeam}
        />
      </div>
    </article>
  );
}

export default function NhlStartingGoaliesBoard({
  matchups,
}: Props) {
  const goalieRows = matchups.flatMap((matchup) => [
    matchup.awayGoalie,
    matchup.homeGoalie,
  ]);

  const confirmedCount = goalieRows.filter(
    (goalie) => goalie?.status === "confirmed",
  ).length;

  const likelyCount = goalieRows.filter(
    (goalie) => goalie?.status === "likely",
  ).length;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Goalie Status
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {confirmedCount} Confirmed
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                {likelyCount} Likely
              </span>
            </div>
          </div>

          <div className="max-w-xl text-sm leading-6 text-slate-500 sm:text-right">
            Confirmed status is only shown when supported
            by the underlying goalie news source. KofSports
            does not infer confirmations from depth charts.
          </div>
        </div>
      </div>

      {matchups.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {matchups.map((matchup) => (
            <MatchupCard
              key={matchup.gameId}
              matchup={matchup}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h2 className="text-xl font-bold text-white">
            No NHL Starting Goalies Available
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Starting goalie information will appear here
            as it becomes available for today&apos;s games.
          </p>
        </div>
      )}
    </div>
  );
}
