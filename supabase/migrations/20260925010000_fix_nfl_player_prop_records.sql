-- Fix NFL Player Prop Records pipeline:
-- 1. Support both full team names and abbreviations in closing-line history.
-- 2. Aggregate player prop records at one row per season/player/market.

create or replace view public.nfl_player_prop_closing_lines as
with ranked_history as (
  select
    h.id,
    h.external_event_id,
    h.player_name,
    h.market,
    h.line,
    h.over_price,
    h.under_price,
    h.bookmaker,
    h.home_team,
    h.away_team,
    h.commence_time,
    h.fetched_at,
    h.created_at,
    row_number() over (
      partition by
        h.external_event_id,
        h.player_name,
        h.market,
        h.bookmaker
      order by h.fetched_at desc
    ) as snapshot_rank
  from public.nfl_prop_line_history h
  where h.bookmaker = 'draftkings'
    and h.fetched_at < h.commence_time
),
closing_lines as (
  select *
  from ranked_history
  where snapshot_rank = 1
),
mapped_teams as (
  select
    c.*,
    coalesce(
      away_by_name.team_abbr,
      away_by_abbr.team_abbr
    ) as away_abbr,
    coalesce(
      home_by_name.team_abbr,
      home_by_abbr.team_abbr
    ) as home_abbr
  from closing_lines c
  left join public.nfl_team_identity away_by_name
    on away_by_name.team_name = c.away_team
  left join public.nfl_team_identity away_by_abbr
    on away_by_abbr.team_abbr = c.away_team
  left join public.nfl_team_identity home_by_name
    on home_by_name.team_name = c.home_team
  left join public.nfl_team_identity home_by_abbr
    on home_by_abbr.team_abbr = c.home_team
)
select
  c.id as history_id,
  c.external_event_id,
  g.id as game_id,
  g.external_game_id,
  g.season,
  g.week,
  g.game_date,
  c.player_name,
  c.market,
  c.line,
  c.over_price,
  c.under_price,
  c.bookmaker,
  c.away_abbr as away_team,
  c.home_abbr as home_team,
  c.commence_time,
  c.fetched_at
from mapped_teams c
join public.nfl_games g
  on g.away_team = c.away_abbr
 and g.home_team = c.home_abbr
 and g.game_date =
     (c.commence_time at time zone 'America/New_York')::date
where g.game_type = 'REG';


create or replace view public.nfl_player_prop_records as
with aggregated as (
  select
    season,
    external_player_id,
    market,

    count(*) filter (
      where result <> 'U'
    ) as graded_props,

    count(*) filter (
      where result = 'W'
    ) as wins,

    count(*) filter (
      where result = 'L'
    ) as losses,

    count(*) filter (
      where result = 'P'
    ) as pushes,

    round(
      (
        count(*) filter (where result = 'W')::numeric * 100.0
      ) /
      nullif(
        count(*) filter (where result in ('W', 'L')),
        0
      )::numeric,
      1
    ) as cover_pct,

    round(
      avg(delta) filter (where result <> 'U'),
      2
    ) as avg_delta,

    round(
      avg(actual) filter (where result <> 'U'),
      2
    ) as avg_actual,

    round(
      avg(line) filter (where result <> 'U'),
      2
    ) as avg_line

  from public.nfl_player_prop_results
  where external_player_id is not null
  group by
    season,
    external_player_id,
    market
),

latest_identity as (
  select distinct on (
    season,
    external_player_id,
    market
  )
    season,
    external_player_id,
    market,
    player_name,
    team,
    "position"
  from public.nfl_player_prop_results
  where external_player_id is not null
    and result <> 'U'
  order by
    season,
    external_player_id,
    market,
    game_date desc,
    fetched_at desc
)

select
  a.season,
  a.external_player_id,
  i.player_name,
  i.team,
  i."position",
  a.market,
  a.graded_props,
  a.wins,
  a.losses,
  a.pushes,
  a.cover_pct,
  a.avg_delta,
  a.avg_actual,
  a.avg_line
from aggregated a
left join latest_identity i
  on i.season = a.season
 and i.external_player_id = a.external_player_id
 and i.market = a.market;
