create or replace view public.nfl_anytime_td_best_prices as

with ranked_prices as (
  select
    external_event_id,
    external_player_id,
    canonical_player_name,
    bookmaker,
    yes_price,
    market_last_update,
    fetched_at,

    row_number() over (
      partition by external_event_id, external_player_id
      order by
        yes_price desc,
        market_last_update desc nulls last,
        bookmaker
    ) as price_rank

  from public.nfl_anytime_td_prices_with_identity

  where external_player_id is not null
    and yes_price is not null
)

select
  external_event_id,
  external_player_id,
  canonical_player_name,
  bookmaker as best_bookmaker,
  yes_price as best_price,
  market_last_update,
  fetched_at

from ranked_prices

where price_rank = 1;
