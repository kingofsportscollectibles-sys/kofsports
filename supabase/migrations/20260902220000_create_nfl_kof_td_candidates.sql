create or replace view public.nfl_kof_td_candidates as

select
  m.external_event_id,
  m.player_name,
  m.roster_player_name,
  m.external_player_id,
  m.team,
  m.position,

  m.away_team,
  m.home_team,
  m.commence_time,

  -- Market
  m.books,
  m.consensus_probability,
  m.median_probability,
  m.lowest_probability,
  m.highest_probability,
  m.best_price,
  m.worst_price,
  m.market_disagreement,

  -- History availability
  (u.external_player_id is not null) as has_usage_history,
  u.games as historical_games,

  -- Season usage
  u.carries_per_game,
  u.targets_per_game,
  u.opportunities_per_game,
  u.red_zone_opportunities_per_game,
  u.inside_10_opportunities_per_game,
  u.inside_5_opportunities_per_game,
  u.avg_snap_pct,
  u.total_tds,
  u.td_game_rate,

  -- Last 5
  u.l5_opportunities_per_game,
  u.l5_red_zone_opportunities_per_game,
  u.l5_inside_10_opportunities_per_game,
  u.l5_inside_5_opportunities_per_game,
  u.l5_avg_snap_pct,
  u.l5_td_game_rate,

  -- Role trend
  case
    when u.opportunities_per_game is null
      or u.opportunities_per_game = 0
      or u.l5_opportunities_per_game is null
    then null
    else round(
      (
        u.l5_opportunities_per_game
        / nullif(u.opportunities_per_game, 0)
      )::numeric,
      4
    )
  end as opportunity_role_index,

  case
    when u.avg_snap_pct is null
      or u.avg_snap_pct = 0
      or u.l5_avg_snap_pct is null
    then null
    else round(
      (
        u.l5_avg_snap_pct
        / nullif(u.avg_snap_pct, 0)
      )::numeric,
      4
    )
  end as snap_role_index

from public.nfl_anytime_td_with_identity m

left join public.nfl_player_usage_summary u
  on u.external_player_id = m.external_player_id

where m.external_player_id is not null;
