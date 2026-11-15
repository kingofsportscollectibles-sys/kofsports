import Link from "next/link";
import { getPublicRecord } from "@/lib/marketing/public-record";
export async function PublicPickExample() {
  const { example } = await getPublicRecord();
  if (!example)
    return (
      <aside className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <h2 className="font-display text-2xl font-bold text-white">
          See the published record
        </h2>
        <p className="mt-3 text-zinc-400">
          Inspect settled selections, including losses, in the public vault.
        </p>
        <Link
          href="/premium-picks#premium-vault"
          className="mt-4 inline-flex min-h-11 items-center text-brand"
        >
          Open the results vault →
        </Link>
      </aside>
    );
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(example.game_time));
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-xl">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">
          Actual product · Public settled pick
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">
          See an actual graded pick.
        </h2>
      </div>
      <div className="space-y-5 p-5">
        <p className="text-sm text-zinc-400">
          {example.sport} · {date}
        </p>
        <p className="break-words font-display text-2xl font-semibold text-white">
          {example.selection}
        </p>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500">Recorded odds</dt>
            <dd className="mt-1 font-mono text-white">
              {example.odds > 0 ? "+" : ""}
              {example.odds}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Recorded stake</dt>
            <dd className="mt-1 font-mono text-white">{example.units}u</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Grade</dt>
            <dd className="mt-1 font-bold text-white">
              {example.status === "won" ? "Win" : "Loss"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Net units</dt>
            <dd
              className={`mt-1 font-mono ${example.profit_loss < 0 ? "text-red-300" : "text-brand"}`}
            >
              {example.profit_loss > 0 ? "+" : ""}
              {example.profit_loss.toFixed(2)}u
            </dd>
          </div>
        </dl>
        {example.analysis && (
          <details className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <summary className="min-h-11 cursor-pointer text-sm font-bold uppercase tracking-wide text-brand">
              Review original analysis
            </summary>
            <div className="mt-3 break-words whitespace-pre-line text-sm leading-7 text-zinc-300">
              {example.analysis}
            </div>
          </details>
        )}
        <p className="text-xs leading-6 text-zinc-400">
          Most recent published settled pick with complete odds and units. Wins
          and losses use the same selection rule.{" "}
          {example.best_sportsbook
            ? `Recorded sportsbook: ${example.best_sportsbook}.`
            : "Sportsbook source was not recorded for this pick."}{" "}
          Historical result, not an open betting recommendation.
        </p>
        <Link
          href="/premium-picks#premium-vault"
          className="inline-flex min-h-11 items-center font-bold text-brand underline underline-offset-4"
        >
          Check the full public vault →
        </Link>
      </div>
    </article>
  );
}
