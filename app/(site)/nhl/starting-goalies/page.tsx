import type { Metadata } from "next";

import NhlStartingGoaliesBoard from "@/components/nhl/NhlStartingGoaliesBoard";
import { getNhlStartingGoalies } from "@/lib/nhl/starting-goalies";

export const metadata: Metadata = {
  title:
    "NHL Starting Goalies Today: Confirmed & Projected | KofSports",
  description:
    "Track NHL starting goalies today with confirmed, likely, and unconfirmed starter statuses, matchup details, source information, and game times from KofSports.",
};

type StartingGoaliesPageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

function getEasternDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDate(value: string | undefined) {
  if (!value) {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export default async function NhlStartingGoaliesPage({
  searchParams,
}: StartingGoaliesPageProps) {
  const params = await searchParams;

  const today = getEasternDate();

  const selectedDate = isValidDate(params.date)
    ? params.date!
    : today;

  const previousDate = shiftDate(selectedDate, -1);
  const nextDate = shiftDate(selectedDate, 1);

  const matchups =
    await getNhlStartingGoalies(selectedDate);

  const goalieRows = matchups.flatMap((matchup) => [
    matchup.awayGoalie,
    matchup.homeGoalie,
  ]);

  const confirmedCount = goalieRows.filter(
    (goalie) => goalie?.status === "confirmed",
  ).length;

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            KofSports NHL Research
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
            NHL Starting Goalies Today
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            Track NHL starting goalie status across
            today&apos;s slate. See confirmed, likely, and
            unconfirmed starters with matchup information,
            game times, and the underlying confirmation
            source.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>
              Confirmations are source-backed and never
              inferred from depth charts.
            </span>

            <span className="hidden sm:inline">•</span>

            <span>
              Updated as new goalie information becomes
              available.
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {formatDisplayDate(selectedDate)}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {matchups.length}{" "}
              {matchups.length === 1
                ? "game"
                : "games"}{" "}
              • {confirmedCount} confirmed{" "}
              {confirmedCount === 1
                ? "starter"
                : "starters"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/nhl/starting-goalies?date=${previousDate}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              ← Previous
            </a>

            {selectedDate !== today ? (
              <a
                href="/nhl/starting-goalies"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
              >
                Today
              </a>
            ) : null}

            <a
              href={`/nhl/starting-goalies?date=${nextDate}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
              Next →
            </a>
          </div>
        </div>

        <NhlStartingGoaliesBoard
          matchups={matchups}
        />

        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900 p-7 md:p-9">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Understanding Goalie Status
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
              Confirmed vs. likely NHL starting goalies
            </h2>

            <p className="mt-4 leading-7 text-slate-400">
              A confirmed starter has supporting source
              information indicating that the goalie will
              start. A likely starter has been reported as
              likely but has not yet reached confirmed
              status. Unconfirmed means KofSports does not
              currently have source-backed confirmation for
              that goalie.
            </p>

            <p className="mt-4 leading-7 text-slate-400">
              Starting goalie information can change
              throughout the day. KofSports preserves the
              underlying source and update time so you can
              distinguish confirmed information from an
              early projection.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            Why NHL Starting Goalies Matter
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            Starting goalies are an important part of NHL
            betting research. A goalie change can affect
            matchup expectations, team totals, game totals,
            moneylines, and goalie save props. Checking
            starter status before evaluating a market helps
            ensure your research reflects the expected
            matchup.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-white">
                Goalie Save Props
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Confirming the expected starter is especially
                important when researching goalie save props.
                KofSports NHL prop research combines current
                sportsbook lines with historical goalie
                results.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Matchup Research
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Starter information provides additional
                context when evaluating an NHL matchup,
                including how a team&apos;s offensive
                environment lines up against the expected
                opposing goalie.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold text-white">
            NHL Starting Goalies FAQ
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-bold text-white">
                What does confirmed starting goalie mean?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Confirmed means the starting goalie has
                supporting source information indicating
                that they will start the game. KofSports
                does not mark a goalie confirmed simply
                because they appear first on a depth chart.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What does likely starting goalie mean?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Likely indicates that available reporting
                points toward that goalie starting, but the
                status has not yet reached confirmed.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                When are NHL starting goalies confirmed?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Confirmation timing varies by team and game.
                Starter information may become available
                throughout the day, so statuses can change
                as new reports are published.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                Why do starting goalies matter for NHL
                betting?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                The expected goalie can be relevant when
                researching moneylines, totals, team totals,
                and goalie save props. Starting-goalie
                status is one piece of the broader matchup
                research process.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
