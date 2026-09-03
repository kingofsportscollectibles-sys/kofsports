create or replace view public.nfl_anytime_td_consensus as

with priced as (
  select
    external_event_id,
    player_name,
    external_player_id,
    bookmaker,
    yes_price,
    home_team,
    away_team,
    commence_time,
    market_last_update,
    fetched_at,

    case
      when yes_price < 0 then
        (-yes_price::numeric)
        / ((-yes_price::numeric) + 100)

      when yes_price > 0 then
        100::numeric
        / (yes_price::numeric + 100)

      else null
    end as implied_probability

  from public.nfl_anytime_td_odds

  where yes_price is not null
),

aggregated as (
  select
    external_event_id,
    player_name,

    max(external_player_id)
      as external_player_id,

    max(home_team)
      as home_team,

    max(away_team)
      as away_team,

    max(commence_time)
      as commence_time,

    count(*)
      as books,

    avg(implied_probability)
      as consensus_probability,

    percentile_cont(0.5)
      within group (
        order by implied_probability
      ) as median_probability,

    min(implied_probability)
      as lowest_probability,

    max(implied_probability)
      as highest_probability,

    max(yes_price)
      as best_price,

    min(yes_price)
      as worst_price,

    max(fetched_at)
      as latest_fetch

  from priced

  group by
    external_event_id,
    player_name
)

select
  external_event_id,
  player_name,
  external_player_id,

  home_team,
  away_team,
  commence_time,

  books,

  round(
    consensus_probability,
    4
  ) as consensus_probability,

  round(
    median_probability::numeric,
    4
  ) as median_probability,

  round(
    lowest_probability,
    4
  ) as lowest_probability,

  round(
    highest_probability,
    4
  ) as highest_probability,

  best_price,
  worst_price,

  round(
    (
      highest_probability
      -
      lowest_probability
    ),
    4
  ) as market_disagreement,

  latest_fetch

from aggregated;
