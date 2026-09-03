create or replace view public.nfl_anytime_td_with_identity as

with roster_players as (
  select distinct
    gsis_id,
    player_name,
    team,
    position,
    public.normalize_nfl_player_name(player_name) as normalized_name
  from public.nfl_player_current_teams
  where season = 2026
)

select
  c.external_event_id,
  c.player_name,
  r.gsis_id as external_player_id,
  r.player_name as roster_player_name,
  r.team,
  r.position,

  c.away_team,
  c.home_team,
  c.commence_time,

  c.books,
  c.consensus_probability,
  c.median_probability,
  c.lowest_probability,
  c.highest_probability,

  c.best_price,
  c.worst_price,
  c.market_disagreement,
  c.latest_fetch

from public.nfl_anytime_td_consensus c

left join roster_players r
  on r.normalized_name =
     public.normalize_nfl_player_name(c.player_name)
 and r.team in (c.home_team, c.away_team);
