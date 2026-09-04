create or replace view public.nfl_player_snap_summary as

with filtered as (
  select
    external_player_id,
    player_name,
    position,
    team,
    opponent,
    season,
    week,
    external_game_id,
    offensive_snaps,
    offensive_snap_pct,

    row_number() over (
      partition by season, external_player_id
      order by week desc, external_game_id desc
    ) as game_number,

    lag(offensive_snap_pct) over (
      partition by season, external_player_id
      order by week, external_game_id
    ) as previous_snap_pct

  from public.nfl_player_game_usage

  where game_type = 'REG'
    and position in ('QB', 'RB', 'WR', 'TE')
    and offensive_snap_pct is not null
),

aggregated as (
  select
    external_player_id,
    max(player_name) filter (where game_number = 1) as player_name,
    max(position) filter (where game_number = 1) as position,
    max(team) filter (where game_number = 1) as team,
    max(opponent) filter (where game_number = 1) as opponent,
    season,

    max(week) as latest_week,

    max(offensive_snaps) filter (
      where game_number = 1
    ) as latest_offensive_snaps,

    max(offensive_snap_pct) filter (
      where game_number = 1
    ) as latest_snap_pct,

    max(previous_snap_pct) filter (
      where game_number = 1
    ) as previous_snap_pct,

    round(
      avg(offensive_snap_pct) filter (
        where game_number <= 3
      ),
      3
    ) as l3_snap_pct,

    round(
      avg(offensive_snap_pct) filter (
        where game_number <= 5
      ),
      3
    ) as l5_snap_pct,

    round(
      avg(offensive_snap_pct),
      3
    ) as season_snap_pct,

    round(
      avg(offensive_snaps),
      1
    ) as season_avg_snaps,

    count(*) as games_played

  from filtered

  group by
    external_player_id,
    season
)

select
  external_player_id,
  player_name,
  position,
  team,
  opponent,
  season,
  latest_week,
  latest_offensive_snaps,
  latest_snap_pct,
  previous_snap_pct,
  round(
    latest_snap_pct - previous_snap_pct,
    3
  ) as snap_pct_change,
  l3_snap_pct,
  l5_snap_pct,
  season_snap_pct,
  season_avg_snaps,
  games_played

from aggregated;
