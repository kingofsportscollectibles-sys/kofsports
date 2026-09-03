create or replace view public.nfl_game_odds_consensus as

with consensus as (
  select
    external_event_id,
    away_team,
    home_team,
    commence_time,

    count(*) filter (
      where home_spread is not null
    ) as spread_books,

    count(*) filter (
      where game_total is not null
    ) as total_books,

    percentile_cont(0.5) within group (
      order by home_spread
    ) filter (
      where home_spread is not null
    ) as consensus_home_spread,

    percentile_cont(0.5) within group (
      order by game_total
    ) filter (
      where game_total is not null
    ) as consensus_total,

    min(game_total) filter (
      where game_total is not null
    ) as lowest_total,

    max(game_total) filter (
      where game_total is not null
    ) as highest_total,

    max(fetched_at) as latest_fetch

  from public.nfl_game_odds

  group by
    external_event_id,
    away_team,
    home_team,
    commence_time
)

select
  *,

  (
    consensus_total - consensus_home_spread
  ) / 2.0 as home_implied_total,

  (
    consensus_total + consensus_home_spread
  ) / 2.0 as away_implied_total

from consensus;
