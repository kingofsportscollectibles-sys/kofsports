create or replace view public.nfl_anytime_td_prices_with_identity as

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
  o.external_event_id,
  o.player_name as source_player_name,

  coalesce(
    alias_roster.gsis_id,
    exact_roster.gsis_id
  ) as external_player_id,

  coalesce(
    alias_roster.player_name,
    exact_roster.player_name
  ) as canonical_player_name,

  o.bookmaker,
  o.yes_price,
  o.no_price,
  o.home_team,
  o.away_team,
  o.commence_time,
  o.market_last_update,
  o.fetched_at

from public.nfl_anytime_td_odds o

left join public.nfl_player_identity_aliases a
  on a.source = 'the_odds_api'
 and a.source_player_name = o.player_name

left join roster_players alias_roster
  on alias_roster.gsis_id = a.gsis_id
 and alias_roster.team in (o.home_team, o.away_team)

left join roster_players exact_roster
  on exact_roster.normalized_name =
     public.normalize_nfl_player_name(o.player_name)
 and exact_roster.team in (o.home_team, o.away_team);
