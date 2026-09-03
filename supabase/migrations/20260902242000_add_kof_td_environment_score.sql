drop view if exists public.nfl_kof_td_components;

create view public.nfl_kof_td_components as

with environment as (
  select
    p.*,

    case
      when p.team = p.home_team
        then g.home_implied_total
      when p.team = p.away_team
        then g.away_implied_total
      else null
    end as implied_team_total,

    g.consensus_total as game_total,
    g.consensus_home_spread as home_spread,
    g.total_books as environment_books

  from public.nfl_kof_td_percentiles p

  left join public.nfl_game_odds_consensus g
    on g.external_event_id = p.external_event_id
)

select
  e.*,

  round(
    least(
      100,
      greatest(
        0,
        (e.median_probability / 0.75) * 100
      )
    )::numeric,
    1
  ) as market_score,

  round(
    (
      100 * (
        0.40 * e.red_zone_pct +
        0.35 * e.inside_10_pct +
        0.25 * e.inside_5_pct
      )
    )::numeric,
    1
  ) as red_zone_score,

  round(
    (
      100 *
      (
        (
          case when e.opportunities_pct is not null
            then 0.65 * e.opportunities_pct else 0 end
          +
          case when e.snap_pct_rank is not null
            then 0.35 * e.snap_pct_rank else 0 end
        )
        /
        nullif(
          (
            case when e.opportunities_pct is not null then 0.65 else 0 end
            +
            case when e.snap_pct_rank is not null then 0.35 else 0 end
          ),
          0
        )
      )
    )::numeric,
    1
  ) as usage_score,

  round(
    (
      100 *
      (
        (
          case when e.l5_opportunities_pct is not null
            then 0.25 * e.l5_opportunities_pct else 0 end
          +
          case when e.l5_red_zone_pct is not null
            then 0.25 * e.l5_red_zone_pct else 0 end
          +
          case when e.l5_td_rate_pct is not null
            then 0.30 * e.l5_td_rate_pct else 0 end
          +
          case when e.opportunity_role_pct is not null
            then 0.10 * e.opportunity_role_pct else 0 end
          +
          case when e.snap_role_pct is not null
            then 0.10 * e.snap_role_pct else 0 end
        )
        /
        nullif(
          (
            case when e.l5_opportunities_pct is not null then 0.25 else 0 end
            +
            case when e.l5_red_zone_pct is not null then 0.25 else 0 end
            +
            case when e.l5_td_rate_pct is not null then 0.30 else 0 end
            +
            case when e.opportunity_role_pct is not null then 0.10 else 0 end
            +
            case when e.snap_role_pct is not null then 0.10 else 0 end
          ),
          0
        )
      )
    )::numeric,
    1
  ) as recent_score,

  round(
    least(
      100,
      greatest(
        0,
        ((e.implied_team_total - 15.0) / 14.0) * 100
      )
    )::numeric,
    1
  ) as environment_score

from environment e;
