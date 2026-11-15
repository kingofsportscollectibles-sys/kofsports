import Link from "next/link";
export function RecordMethodology() {
  return (
    <aside
      id="record-methodology"
      className="mt-6 scroll-mt-24 rounded-xl border border-white/10 bg-zinc-950 p-5 text-sm leading-7 text-zinc-400"
    >
      <h3 className="font-semibold text-white">
        How the published record is graded
      </h3>
      <p>
        Record: published Premium vault wins and losses, including imported
        history. Win rate = wins ÷ (wins + losses); pushes, voids and pending
        picks are excluded. Vault row counts also include pushes and voids. Headline totals are cached for up to five minutes, so a new settlement may reach the vault first.
      </p>
      <p>
        Stakes: each pick uses its recorded units, not a flat one-unit
        assumption. A win returns the recorded American-odds profit, a loss
        costs the stake, and a push returns it. Historical rows without odds or
        unit results are not evidence of ROI.
      </p>
      <p>
        Lines: use the odds and sportsbook recorded on the individual pick. Some
        imported records have no sportsbook source. Research-tool DraftKings
        quotes are separate from official pick records; neither is a guaranteed
        closing line.
      </p>
      <Link
        href="/premium-picks#premium-vault"
        className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
      >
        Inspect the published vault, including losses →
      </Link>
    </aside>
  );
}
