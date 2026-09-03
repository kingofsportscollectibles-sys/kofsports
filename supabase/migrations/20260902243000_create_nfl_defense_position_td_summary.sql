create or replace view public.nfl_defense_position_td_summary as

with defense_game_position as (
  select
    season,
    external_game_id,
    opponent as defense_team,
    position,

    sum(carries + targets) as opportunities_allowed,
    sum(red_zone_carries + red_zone_targets) as red_zone_opportunities_allowed,
    sum(inside_10_carries + inside_10_targets) as inside_10_opportunities_allowed,
    sum(inside_5_carries + inside_5_targets) as inside_5_opportunities_allowed,
    sum(total_tds) as tds_allowed

  from public.nfl_player_game_usage

  where
    position in ('RB', 'WR', 'TE')
    and (
      offensive_snaps > 0
      or carries > 0
      or targets > 0
    )

  group by
    season,
    external_game_id,
    opponent,
    position
)

select
  season,
  defense_team,
  position,

  count(*) as games,

  round(
    avg(opportunities_allowed)::numeric,
    2
  ) as opportunities_allowed_per_game,

  round(
    avg(red_zone_opportunities_allowed)::numeric,
    2
  ) as red_zone_opportunities_allowed_per_game,

  round(
    avg(inside_10_opportunities_allowed)::numeric,
    2
  ) as inside_10_opportunities_allowed_per_game,

  round(
    avg(inside_5_opportunities_allowed)::numeric,
    2
  ) as inside_5_opportunities_allowed_per_game,

  round(
    avg(tds_allowed)::numeric,
    3
  ) as tds_allowed_per_game,

  sum(tds_allowed) as total_tds_allowed

from defense_game_position

group by
  season,
  defense_team,
  position;
