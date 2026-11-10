# NHL team betting records

Local route: `/nhl/team-betting-records`. Matches the NBA desktop table and mobile card views: Record & Moneyline, Puck Line and Over/Under. All 32 current teams are included, with home/road and conference filters, search, sorting, coverage and source-linked game logs.

## Hockey grading

W–L–OTL separates regulation losses from OT/shootout losses. Full-game moneyline profit counts every defeat as −1 unit, including OT/SO. Puck line and total use official final goals, including OT and the single awarded shootout goal; no extra goal is added. Shutouts are valid zero-goal results. Unknown final/finish metadata and impossible regular-season OT margins fail validation rather than invent an OTL classification. Missing odds remain unavailable.

Moneyline stake is a flat 1u risk, with shared sport-independent American-odds parsing/profit utilities; the NBA public utility exports remain compatible. Tests include the existing NBA grading cases. Historical profit is not a prediction or calibrated probability.

## Data and updates

The initial dataset spans September 29–November 8, 2026: 282 regular-season games, 282 closing puck lines, 282 closing totals and 564 team moneylines. Current team identities were verified against ESPN, including Utah Mammoth. ESPN regular-season finals are fetched from a September 1 calendar window; preseason and playoffs are excluded.

The page reads one private Supabase season dataset through a five-minute shared cache. RLS is enabled; browser roles have no direct read/write grants. Only the server service role reads/writes it. A checked-in verified dataset is the failure/bootstrap fallback, labeled on the page when used. Metadata and sitemap dates follow the stored dataset.

Vercel job `/api/cron/nhl-team-betting-records` is configured for **12:45 UTC daily** (7:45 AM EST / 8:45 AM EDT), using the existing CRON_SECRET, after the NBA job to avoid simultaneous provider bursts. Authorization occurs before privileged client/provider access. The job refreshes the recent three covered dates and any gap, retains older games, preserves previously verified odds only for the same home/away orientation, uses an optimistic compare-and-set and expires the page cache only after success. Provider failures/omitted known final games leave prior verified data intact. Four concurrent provider requests maximum; no per-game provider fetches run during page rendering.

The migration and initial cache were applied/verified, but **no commit, push or deployment occurred**. The automatic production trigger activates only when these changes are deployed with the existing server environment variables. No local/Codex recurring updater was created.

## Local maintenance

```sh
# Refresh current shared cache using recent dates.
node --env-file=.env.local --import tsx scripts/nhl/refresh-stored-team-records.ts
# Rebuild the verified fallback file for a full season.
node --import tsx scripts/nhl/refresh-team-betting-records.ts
# Full shared-cache backfill using the fallback file's season/through-date.
node --env-file=.env.local --import tsx scripts/nhl/refresh-stored-team-records.ts --full
```

The page always displays the actual through-date and market coverage. Audit/backfill older corrections separately if outside the rolling refresh window. Neither the NBA projection model nor the NFL KOFScore pipeline changes.
