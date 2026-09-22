-- NFL player page infrastructure and player headshot profiles.

create table if not exists public.nfl_player_profiles (
  gsis_id text primary key,
  headshot_url text,
  headshot_source text,
  headshot_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nfl_player_profiles enable row level security;

drop policy if exists "Public can read NFL player profiles"
on public.nfl_player_profiles;

create policy "Public can read NFL player profiles"
on public.nfl_player_profiles
for select
to anon, authenticated
using (true);


-- Player pages require public access to historical game stats.

alter table public.nfl_player_game_stats enable row level security;

drop policy if exists "Public can read NFL player game stats"
on public.nfl_player_game_stats;

create policy "Public can read NFL player game stats"
on public.nfl_player_game_stats
for select
to anon, authenticated
using (true);


-- Upcoming matchup data used by player pages.

alter table public.nfl_games enable row level security;

drop policy if exists "Public can read NFL games"
on public.nfl_games;

create policy "Public can read NFL games"
on public.nfl_games
for select
to anon, authenticated
using (true);


-- Canonical index of eligible NFL player pages.

create or replace view public.nfl_player_pages as
select distinct
  pct.gsis_id,
  pct.player_name,
  lower(
    trim(
      both '-' from regexp_replace(
        regexp_replace(
          pct.player_name,
          '[''’\.\-]',
          '',
          'g'
        ),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )
    )
  ) as slug,
  pct.team,
  pct.position,
  pct.status,
  pct.season,
  pct.sleeper_id,
  profile.headshot_url
from public.nfl_player_current_teams pct
left join public.nfl_player_profiles profile
  on profile.gsis_id = pct.gsis_id
where pct.position in ('QB', 'RB', 'WR', 'TE')
  and exists (
    select 1
    from public.nfl_player_game_stats pgs
    where pgs.external_player_id = pct.gsis_id
  );
