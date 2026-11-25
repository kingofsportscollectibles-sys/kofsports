import { showInjuryCallout, type PublicNflInjuryContext } from "@/lib/nfl/injury-context";
const date = (v: string) => new Intl.DateTimeFormat("en-US", {timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(v));
export default function InjuryStatus({ injury }: { injury: PublicNflInjuryContext }) {
  if (!showInjuryCallout(injury)) return null;
  return <div className={`mt-3 rounded-lg border p-3 text-xs leading-5 ${injury.ratingWithheld ? "border-amber-400/20 bg-amber-400/5 text-amber-200" : "border-slate-800 text-slate-400"}`}>
    <p className="font-semibold">Week {injury.week}: {injury.label}</p>
    <p>{injury.note}</p>
    {injury.fetchedAt && <p className="mt-1 text-[11px] text-slate-500">Checked {date(injury.fetchedAt)} ET.</p>}
  </div>;
}
