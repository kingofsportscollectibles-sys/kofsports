# NFL Betting Board launch — November 18, 2026

Positioning: “Find the props worth a closer look.” Compare KOFScore, projections, recent results and defensive matchups. Methodology is expandable; no claim of calibrated win probability, proven profitability or guaranteed success. Direction labels describe projection above/below the line; Edge vs Line replaces Raw edge. Evidence-based passing-rating withholding remains unchanged.

Access: anonymous marketing view; authenticated free accounts get a server-limited daily three-player sample; eligible Pro, Premium and admin users get the full board. Save/auth continuation and account-scoped local preferences use existing flows. Signup and CTA clicks remain distinct. Navigation/entry and interaction tracking use existing first-party analytics. No new dependency, schema migration or sports ingestion is introduced.

Quote window: user authorized 48 hours instead of 24. This is specific to the betting board; other research freshness rules are unchanged. Quote timestamps remain visible, not described as live. Exact 48-hour boundary is allowed; >48 hours, future/unknown quotes, started games, and expired projection payloads remain excluded. No additional Odds API credits used.

Read-only source verification returned 70 eligible rows across 35 players from 77 stored source rows; three-player preview returned six rows. Seven source rows excluded for inactive, unmatched/started or roster/game mismatch. There were no source warnings. These are time-specific counts, not a promise of current coverage. Roster statuses are not injury or starter confirmation.

Validation: 64 focused access/entitlement, free-preview cap, freshness boundary, DTO/privacy, saved-view preference, passing evidence and analytics checks passed. Scoped route/client lint passed. Actual loader and free selector were exercised with read-only database data. Production build and anonymous payload verification results are recorded during the release session. No live authenticated browser session was used; do not represent mocked/fixture access checks as real-member end-to-end validation.

Release excludes research scripts/reports, model experiments, DB migrations, workflow changes, unfinished admin/account reporting and NBA/NHL feature work. The active model's only included source delta is rushing-history pagination, which prevents a database row cap from truncating larger board requests; no formula/weight change is included. Archived forecasts remain untouched.
