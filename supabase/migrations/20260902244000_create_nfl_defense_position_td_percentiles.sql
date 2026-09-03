create or replace view public.nfl_defense_position_td_percentiles as

select
  d.*,

  percent_rank() over (
    partition by season, position
    order by tds_allowed_per_game
  ) as td_allowed_pct,

  percent_rank() over (
    partition by season, position
    order by red_zone_opportunities_allowed_per_game
  ) as red_zone_allowed_pct,

  percent_rank() over (
    partition by season, position
    order by inside_10_opportunities_allowed_per_game
  ) as inside_10_allowed_pct,

  percent_rank() over (
    partition by season, position
    order by inside_5_opportunities_allowed_per_game
  ) as inside_5_allowed_pct,

  round(
    (
      100 * (
        0.40 * percent_rank() over (
          partition by season, position
          order by tds_allowed_per_game
        )
        +
        0.25 * percent_rank() over (
          partition by season, position
          order by red_zone_opportunities_allowed_per_game
        )
        +
        0.20 * percent_rank() over (
          partition by season, position
          order by inside_10_opportunities_allowed_per_game
        )
        +
        0.15 * percent_rank() over (
          partition by season, position
          order by inside_5_opportunities_allowed_per_game
        )
      )
    )::numeric,
    1
  ) as matchup_score

from public.nfl_defense_position_td_summary d;
