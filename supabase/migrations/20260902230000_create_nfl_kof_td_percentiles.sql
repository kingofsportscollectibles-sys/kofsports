create or replace view public.nfl_kof_td_percentiles as

with base as (
  select *
  from public.nfl_kof_td_candidates
  where position in ('RB', 'WR', 'TE')
),

scored as (
  select
    b.*,

    -- MARKET
    percent_rank() over (
      partition by external_event_id
      order by median_probability
    ) as market_pct,

    -- SEASON POSITION-RELATIVE USAGE
    case when has_usage_history then
      percent_rank() over (
        partition by position
        order by opportunities_per_game
      )
    end as opportunities_pct,

    case when has_usage_history and avg_snap_pct is not null then
      percent_rank() over (
        partition by position
        order by avg_snap_pct
      )
    end as snap_pct_rank,

    -- SEASON POSITION-RELATIVE SCORING OPPORTUNITY
    case when has_usage_history then
      percent_rank() over (
        partition by position
        order by red_zone_opportunities_per_game
      )
    end as red_zone_pct,

    case when has_usage_history then
      percent_rank() over (
        partition by position
        order by inside_10_opportunities_per_game
      )
    end as inside_10_pct,

    case when has_usage_history then
      percent_rank() over (
        partition by position
        order by inside_5_opportunities_per_game
      )
    end as inside_5_pct,

    -- RECENT POSITION-RELATIVE ROLE
    case when has_usage_history then
      percent_rank() over (
        partition by position
        order by l5_opportunities_per_game
      )
    end as l5_opportunities_pct,

    case when has_usage_history then
      percent_rank() over (
        partition by position
        order by l5_red_zone_opportunities_per_game
      )
    end as l5_red_zone_pct,

    case when has_usage_history then
      percent_rank() over (
        partition by position
        order by l5_td_game_rate
      )
    end as l5_td_rate_pct,

    case when has_usage_history
              and opportunity_role_index is not null then
      percent_rank() over (
        partition by position
        order by opportunity_role_index
      )
    end as opportunity_role_pct,

    case when has_usage_history
              and snap_role_index is not null then
      percent_rank() over (
        partition by position
        order by snap_role_index
      )
    end as snap_role_pct

  from base b
)

select *
from scored;
