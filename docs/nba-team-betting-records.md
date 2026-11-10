# NBA team betting records

Local page: `/nba/team-betting-records`. Free access, no account requirement. The page reads one shared, validated Supabase season dataset through a five-minute server cache. The checked-in sports dataset in `data/nba/team-betting-records.json` remains a bootstrap and failure fallback. No per-game APIs run during rendering. No projection model or KOFScore data is involved.

## Refresh

```sh
node --import tsx scripts/nba/refresh-team-betting-records.ts
```

Default: current NBA starting-year season, completed days through yesterday in America/New_York. Optional `--season 2026 --through 2026-11-08 --out /path/to/output.json` supports an explicit refresh. Source: ESPN completed regular-season scoreboards and per-game summaries. Four concurrent requests maximum; all source requests must succeed before replacing the dataset atomically. Missing DraftKings close fields remain null and are omitted only from their affected market. Contradictory spread signs or total sides are not graded. No opening/live/generic price substitution.

The initial dataset covers 146 regular-season games through November 8, 2026. The visible through-date and coverage always reflect the dataset actually served.

## Automatic daily updates

`GET /api/cron/nba-team-betting-records` is configured in `vercel.json` for **12:30 UTC daily** (7:30 AM EST / 8:30 AM EDT), after the existing NBA result refresh. It requires `Authorization: Bearer CRON_SECRET` before any privileged client or provider read. The existing project secret is reused; missing configuration fails closed. This schedule activates only after deployment to Vercel production. No push or deployment was performed.

The job reads `public.nba_team_betting_datasets`, refreshes the most recent three covered days plus any gap since the previous successful run, then atomically replaces that season's JSON dataset. Older verified games are retained. If the provider omits a previously verified final game or fails, the job fails without replacing stored data. Temporarily absent close odds retain previously verified values only for the same event and home/away orientation. Compare-and-set on the previous retrieval timestamp prevents overlapping refreshes from silently overwriting one another. The page cache is expired immediately only after a successful write.

The table has RLS enabled and no browser grants/policies. Only the server service role can read, insert and update it. The page returns public sports records, not credentials. Supabase migration `20261109194938_nba_team_betting_daily_cache.sql` was applied and the initial live cache was populated/verified. No new recurring Supabase job is needed; Vercel triggers the protected application endpoint.

An immediate local end-to-end refresh, without deployment:

```sh
node --env-file=.env.local --import tsx scripts/nba/refresh-stored-team-records.ts
```

This updates the shared dataset; the local page picks it up within its five-minute TTL. The deployed cron also expires the page cache immediately. The existing full-file refresh command above remains useful for offline backfills/bootstrap recovery, but ordinary daily updates do not rewrite repository files or require commits/rebuilds.

The site has not been published, so no production daily trigger is currently active. Review the local page and publish the cron/data-reader changes together to enable unattended updates. Existing `CRON_SECRET`, Supabase URL and service-role environment variables are required on that deployment. The current source has a 300-second job budget; a long first-run gap may require a separate backfill before resuming daily jobs.

## Grading

- Win-loss: actual final score, including overtime.
- ATS: team score plus that team's closing spread minus opponent score; positive is a cover, zero a push. Away spread must be the negative of the explicitly parsed home spread.
- Total: both final scores versus the full-game closing total; identical O/U result for each participating team. This is not a team-total market.
- Moneyline: risk exactly 1 unit per team-game with a valid price. Win profit at positive American odds is odds/100; at negative odds is 100/abs(odds). Every loss is −1u. Returned stake is excluded. ROI is net profit / total risked.
- Pushes excluded from cover/over percentage denominators. Unknown data is null (dash), never assumed zero. Real break-even profit is 0.00u.
- Mobile presents Record & Moneyline, ATS and Over/Under card views with the matching summary and game-log fields; desktop retains the full table. Search, conference and location choices persist across mobile views.
- All/home/road filters recalculate records from game observations. Conference/search filters then restrict displayed teams. The 30-team table is SSR content before hydration; sorting and logs progressively add interaction.
- Team game totals are not independent observations. Both teams count the same game; full-game total results appear in both teams' histories. Flat-risk historical profit is not a prediction or a profitability claim.

ESPN labels these source odds as close, but this project did not observe them at tipoff and cannot independently certify their timestamps. They are identified as archived source closing fields throughout the page. The official NBA regular-season standings can differ from market summaries when coverage is missing.

## Files

- `lib/nba/team-betting-records.ts`: types, coherent close parsing and aggregation.
- `scripts/nba/refresh-team-betting-records.ts`: bounded offline refresh.
- `components/nba/NbaTeamBettingRecords.tsx`: filters, sortable table and source-linked game logs.
- `app/(site)/nba/team-betting-records/page.tsx`: content and SEO metadata.
- `reports/nba-team-betting-records-2026-11-09/SEO-RESEARCH.md`: keyword intent and source research.
