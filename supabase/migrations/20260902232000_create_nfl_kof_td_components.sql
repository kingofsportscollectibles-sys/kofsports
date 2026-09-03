create or replace view public.nfl_kof_td_components as

select
  p.*,

  -- MARKET SCORE
  -- 75% implied TD probability is treated as elite / 100.
  round(
    least(
      100,
      greatest(
        0,
        (p.median_probability / 0.75) * 100
      )
    )::numeric,
    1
  ) as market_score,

  -- RED ZONE SCORE
  round(
    (
      100 * (
        0.40 * p.red_zone_pct +
        0.35 * p.inside_10_pct +
        0.25 * p.inside_5_pct
      )
    )::numeric,
    1
  ) as red_zone_score,

  -- USAGE SCORE
  -- Reweight if snap data is unavailable.
  round(
    (
      100 *
      (
        (
          case when p.opportunities_pct is not null
            then 0.65 * p.opportunities_pct
            else 0
          end
          +
          case when p.snap_pct_rank is not null
            then 0.35 * p.snap_pct_rank
            else 0
          end
        )
        /
        nullif(
          (
            case when p.opportunities_pct is not null then 0.65 else 0 end
            +
            case when p.snap_pct_rank is not null then 0.35 else 0 end
          ),
          0
        )
      )
    )::numeric,
    1
  ) as usage_score,

  -- RECENT SCORE
  -- 50% recent opportunity,
  -- 30% TD production,
  -- 20% role trend.
  round(
    (
      100 *
      (
        (
          case when p.l5_opportunities_pct is not null
            then 0.25 * p.l5_opportunities_pct
            else 0
          end
          +
          case when p.l5_red_zone_pct is not null
            then 0.25 * p.l5_red_zone_pct
            else 0
          end
          +
          case when p.l5_td_rate_pct is not null
            then 0.30 * p.l5_td_rate_pct
            else 0
          end
          +
          case when p.opportunity_role_pct is not null
            then 0.10 * p.opportunity_role_pct
            else 0
          end
          +
          case when p.snap_role_pct is not null
            then 0.10 * p.snap_role_pct
            else 0
          end
        )
        /
        nullif(
          (
            case when p.l5_opportunities_pct is not null then 0.25 else 0 end
            +
            case when p.l5_red_zone_pct is not null then 0.25 else 0 end
            +
            case when p.l5_td_rate_pct is not null then 0.30 else 0 end
            +
            case when p.opportunity_role_pct is not null then 0.10 else 0 end
            +
            case when p.snap_role_pct is not null then 0.10 else 0 end
          ),
          0
        )
      )
    )::numeric,
    1
  ) as recent_score

from public.nfl_kof_td_percentiles p;
