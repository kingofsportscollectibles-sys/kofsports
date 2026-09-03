create or replace view public.nfl_player_usage_summary as
with qualifying_games as (
  select
    *,
    carries + targets as opportunities,
    red_zone_carries + red_zone_targets as red_zone_opportunities,
    inside_10_carries + inside_10_targets as inside_10_opportunities,
    inside_5_carries + inside_5_targets as inside_5_opportunities
  from public.nfl_player_game_usage
  where
    offensive_snaps > 0
    or carries > 0
    or targets > 0
),
ranked_games as (
  select
    *,
    row_number() over (
      partition by external_player_id, season
      order by week desc, external_game_id desc
    ) as recent_game_number
  from qualifying_games
)
select
  external_player_id,
  season,

  max(player_name) as player_name,
  max(position) as position,
  max(team) as team,

  count(*) as games,

  round(avg(carries)::numeric, 2) as carries_per_game,
  round(avg(targets)::numeric, 2) as targets_per_game,
  round(avg(opportunities)::numeric, 2) as opportunities_per_game,

  round(avg(red_zone_opportunities)::numeric, 2)
    as red_zone_opportunities_per_game,

  round(avg(inside_10_opportunities)::numeric, 2)
    as inside_10_opportunities_per_game,

  round(avg(inside_5_opportunities)::numeric, 2)
    as inside_5_opportunities_per_game,

  round(
    avg(offensive_snap_pct)
      filter (where offensive_snap_pct is not null)::numeric,
    3
  ) as avg_snap_pct,

  sum(total_tds) as total_tds,

  round(
    (
      count(*) filter (where total_tds > 0)
    )::numeric
    / nullif(count(*), 0),
    3
  ) as td_game_rate,

  round(
    avg(opportunities)
      filter (where recent_game_number <= 5)::numeric,
    2
  ) as l5_opportunities_per_game,

  round(
    avg(red_zone_opportunities)
      filter (where recent_game_number <= 5)::numeric,
    2
  ) as l5_red_zone_opportunities_per_game,

  round(
    avg(inside_10_opportunities)
      filter (where recent_game_number <= 5)::numeric,
    2
  ) as l5_inside_10_opportunities_per_game,

  round(
    avg(inside_5_opportunities)
      filter (where recent_game_number <= 5)::numeric,
    2
  ) as l5_inside_5_opportunities_per_game,

  round(
    avg(offensive_snap_pct)
      filter (
        where recent_game_number <= 5
          and offensive_snap_pct is not null
      )::numeric,
    3
  ) as l5_avg_snap_pct,

  round(
    (
      count(*) filter (
        where recent_game_number <= 5
          and total_tds > 0
      )
    )::numeric
    / nullif(
        count(*) filter (
          where recent_game_number <= 5
        ),
        0
      ),
    3
  ) as l5_td_game_rate

from ranked_games
group by
  external_player_id,
  season;
