create or replace view public.nfl_kof_td_percentiles as

with base as (
  select *
  from public.nfl_kof_td_candidates
  where position in ('RB', 'WR', 'TE')
    and commence_time > now()
)

select
  base.*,

  -- Keep existing view column order unchanged.
  percent_rank() over (
    order by median_probability
  ) as market_pct,

  percent_rank() over (
    partition by position
    order by opportunities_per_game
  ) as opportunities_pct,

  percent_rank() over (
    partition by position
    order by avg_snap_pct
  ) as snap_pct_rank,

  percent_rank() over (
    partition by position
    order by red_zone_opportunities_per_game
  ) as red_zone_pct,

  percent_rank() over (
    partition by position
    order by inside_10_opportunities_per_game
  ) as inside_10_pct,

  percent_rank() over (
    partition by position
    order by inside_5_opportunities_per_game
  ) as inside_5_pct,

  percent_rank() over (
    partition by position
    order by l5_opportunities_per_game
  ) as l5_opportunities_pct,

  percent_rank() over (
    partition by position
    order by l5_red_zone_opportunities_per_game
  ) as l5_red_zone_pct,

  percent_rank() over (
    partition by position
    order by l5_td_game_rate
  ) as l5_td_rate_pct,

  percent_rank() over (
    partition by position
    order by opportunity_role_index
  ) as opportunity_role_pct,

  percent_rank() over (
    partition by position
    order by snap_role_index
  ) as snap_role_pct

from base;
