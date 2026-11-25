// Server use only via the projection DAL. Public feed; no database ingestion or paid API.
import { parse } from "csv-parse/sync";
import type { NflInjuryContext } from "./injury-context";
export type InjuryRow = Record<string, string>;
export type InjuryFeed = { season: number; rows: InjuryRow[]; fetchedAt: string; sourceUpdatedAt: string | null; available: boolean };
export const injurySourceUrl = (season: number) => `https://github.com/nflverse/nflverse-data/releases/download/injuries/injuries_${season}.csv`;
const cache = new Map<number, { expires: number; result: Promise<InjuryFeed> }>();
const HOUR = 3600000;
const normalize = (team: string) => ({ LAR:"LA", JAC:"JAX", WSH:"WAS" }[team]??team);
export function parseInjuryCsv(body: string): InjuryRow[] {
  if (body.length > 4_000_000) throw Error("Injury source too large");
  const rows = parse(body, { columns: true, skip_empty_lines: true, bom: true }) as InjuryRow[];
  if (!rows.length || !["season","week","team","gsis_id","report_status","practice_status","season_type"].every(k => Object.hasOwn(rows[0],k))) throw Error("Invalid injury source schema");
  return rows;
}
export function loadNflInjuryFeed(season: number, now = Date.now()): Promise<InjuryFeed> {
  if (!Number.isInteger(season) || season < 2020 || season > 2100) throw Error("Invalid injury season");
  const existing = cache.get(season);
  if (existing && existing.expires > now) return existing.result;
  const result = (async (): Promise<InjuryFeed> => {
    try {
      const response = await fetch(injurySourceUrl(season), { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw Error("Injury feed unavailable");
      const modified = response.headers.get("last-modified");
      const sourceUpdatedAt = modified && Number.isFinite(Date.parse(modified)) ? new Date(modified).toISOString() : null;
      return { season, rows: parseInjuryCsv(await response.text()), fetchedAt: new Date(Date.now()).toISOString(), sourceUpdatedAt, available: true };
    } catch {
      // No reuse of stale successful data as a new observation.
      return { season, rows: [], fetchedAt: new Date(Date.now()).toISOString(), sourceUpdatedAt: null, available: false };
    }
  })();
  cache.set(season, { expires: now + 5 * 60000, result });
  // Bound the worker cache; failures are cached for at most five minutes too.
  for (const key of cache.keys()) if (key < season - 1) cache.delete(key);
  return result;
}
export function assessNflInjury(feed: InjuryFeed | undefined, target: {
  playerId: string | null; team: string | null; season: number; week: number; kickoff: string;
}, now = Date.now()): NflInjuryContext {
  const base = { season: target.season, week: target.week, sourceUrl: injurySourceUrl(target.season),
    fetchedAt: feed?.fetchedAt ?? null, sourceUpdatedAt: feed?.sourceUpdatedAt ?? null };
  const unavailable = (note: string): NflInjuryContext => ({ ...base, state: "unavailable", label: "Injury report unverified", note, suppressProjection: false, ratingWithheld: true });
  const observed = Date.parse(feed?.fetchedAt ?? ""), updated = Date.parse(feed?.sourceUpdatedAt ?? ""), kickoff = Date.parse(target.kickoff);
  if (!feed?.available || feed.season !== target.season || !target.playerId || !target.team || !Number.isFinite(kickoff) || kickoff <= now ||
    !Number.isFinite(observed) || observed > now || now-observed > 15*60000 || !Number.isFinite(updated) || updated > observed || now-updated > 36*HOUR)
    return unavailable("Current injury evidence is unavailable or stale. Projection assumes a normal role; KOFScore withheld.");
  const teamRows = feed.rows.filter(r => Number(r.season)===target.season && Number(r.week)===target.week && r.season_type==="REG" && normalize(r.team)===normalize(target.team!));
  if (!teamRows.length) return unavailable("This week's team injury report is not available yet. Projection assumes a normal role; KOFScore withheld.");
  const rows = teamRows.filter(r => r.gsis_id===target.playerId);
  if (rows.length > 1) return unavailable("Conflicting or duplicate injury entries require review. KOFScore withheld.");
  if (!rows.length) return { ...base, state:"not_listed", label:"Not listed in current report", note:"Not listed in the available weekly team report. This is not confirmation of game-day availability or workload.", suppressProjection:false,ratingWithheld:false };
  const row=rows[0], status=row.report_status.trim().toLowerCase(), practice=row.practice_status.trim().toLowerCase();
  if (["out","inactive","injured reserve"].includes(status)) return { ...base,state:"out",label:row.report_status,note:"Reported unavailable for this game. Projection and directional edge withheld; this is not an Under pick.",suppressProjection:true,ratingWithheld:true };
  if (status && !["questionable", "doubtful"].includes(status)) return unavailable("Unrecognized game-status designation requires review. KOFScore withheld.");
  if (["questionable","doubtful"].includes(status) || practice.includes("limited") || practice.includes("did not participate")) return { ...base,state:"uncertain",label:row.report_status || row.practice_status,note:"Availability or practice participation is uncertain. Projection assumes a normal role; no injury percentage adjustment has been applied. KOFScore withheld.",suppressProjection:false,ratingWithheld:true };
  if (status) return unavailable("Unrecognized game-status designation requires review. KOFScore withheld.");
  if (practice==="full participation in practice") return { ...base,state:"practice_full",label:"Full practice",note:"Full participation in the available practice report. This does not confirm game-day availability or an unrestricted workload.",suppressProjection:false,ratingWithheld:false };
  return unavailable("The injury entry has no usable game or practice designation. KOFScore withheld.");
}
