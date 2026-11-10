create table public.nhl_team_betting_datasets (
  season integer primary key,
  through_date date not null,
  retrieved_at timestamptz not null,
  dataset jsonb not null,
  check (jsonb_typeof(dataset->'games') = 'array'),
  check ((dataset->>'season')::integer = season),
  check ((dataset->>'throughDate')::date = through_date),
  check ((dataset->>'retrievedAt')::timestamptz = retrieved_at)
);
alter table public.nhl_team_betting_datasets enable row level security;
revoke all on public.nhl_team_betting_datasets from public, anon, authenticated, service_role;
grant select, insert, update on public.nhl_team_betting_datasets to service_role;
comment on table public.nhl_team_betting_datasets is 'Shared public-sports dataset; service-only access. Daily refresh replaces one season atomically; page exposes only validated sports records.';
