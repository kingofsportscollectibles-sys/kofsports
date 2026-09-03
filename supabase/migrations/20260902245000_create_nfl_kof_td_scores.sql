create or replace view public.nfl_kof_td_scores as

with players_with_opponent as (
  select
    c.*,

    case
      when c.team = c.home_team then c.away_team
      when c.team = c.away_team then c.home_team
      else null
    end as opponent

  from public.nfl_kof_td_components c
),

scored as (
  select
    c.*,

    d.matchup_score,
    d.tds_allowed_per_game as opponent_tds_allowed_per_game,
    d.red_zone_opportunities_allowed_per_game
      as opponent_rz_allowed_per_game,
    d.inside_10_opportunities_allowed_per_game
      as opponent_i10_allowed_per_game,
    d.inside_5_opportunities_allowed_per_game
      as opponent_i5_allowed_per_game

  from players_with_opponent c

  left join public.nfl_defense_position_td_percentiles d
    on d.season = 2025
    and d.defense_team = c.opponent
    and d.position = c.position
)

select
  s.*,

  round(
    (
      0.25 * s.market_score
      +
      0.25 * s.red_zone_score
      +
      0.15 * s.usage_score
      +
      0.15 * s.recent_score
      +
      0.10 * s.matchup_score
      +
      0.10 * s.environment_score
    )::numeric,
    1
  ) as kof_score

from scored s;
