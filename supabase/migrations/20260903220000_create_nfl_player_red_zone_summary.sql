create or replace view public.nfl_player_red_zone_summary as

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

    red_zone_carries,
    red_zone_targets,
    red_zone_carries + red_zone_targets as red_zone_opportunities,

    inside_10_carries,
    inside_10_targets,
    inside_10_carries + inside_10_targets as inside_10_opportunities,

    inside_5_carries,
    inside_5_targets,
    inside_5_carries + inside_5_targets as inside_5_opportunities,

    row_number() over (
      partition by season, external_player_id
      order by week desc, external_game_id desc
    ) as game_number

  from public.nfl_player_game_usage

  where game_type = 'REG'
    and position in ('RB', 'WR', 'TE')
),

aggregated as (
  select
    external_player_id,

    max(player_name) filter (
      where game_number = 1
    ) as player_name,

    max(position) filter (
      where game_number = 1
    ) as position,

    max(team) filter (
      where game_number = 1
    ) as team,

    max(opponent) filter (
      where game_number = 1
    ) as opponent,

    season,

    max(week) as latest_week,

    max(red_zone_opportunities) filter (
      where game_number = 1
    ) as latest_red_zone_opportunities,

    max(red_zone_carries) filter (
      where game_number = 1
    ) as latest_red_zone_carries,

    max(red_zone_targets) filter (
      where game_number = 1
    ) as latest_red_zone_targets,

    max(inside_10_opportunities) filter (
      where game_number = 1
    ) as latest_inside_10_opportunities,

    max(inside_5_opportunities) filter (
      where game_number = 1
    ) as latest_inside_5_opportunities,

    round(
      avg(red_zone_opportunities) filter (
        where game_number <= 3
      ),
      2
    ) as l3_red_zone_opportunities,

    round(
      avg(red_zone_opportunities) filter (
        where game_number <= 5
      ),
      2
    ) as l5_red_zone_opportunities,

    round(
      avg(red_zone_opportunities),
      2
    ) as season_red_zone_opportunities_per_game,

    sum(red_zone_opportunities) as season_red_zone_opportunities,

    sum(red_zone_carries) as season_red_zone_carries,

    sum(red_zone_targets) as season_red_zone_targets,

    sum(inside_10_opportunities) as season_inside_10_opportunities,

    sum(inside_5_opportunities) as season_inside_5_opportunities,

    count(*) as games_played

  from filtered

  group by
    external_player_id,
    season
)

select *
from aggregated;
