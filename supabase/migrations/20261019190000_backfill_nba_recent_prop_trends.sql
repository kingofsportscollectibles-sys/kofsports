create or replace view public.nba_player_prop_trends as
with props as (
  select
    p.id as prop_id,
    p.external_event_id as event_id,
    p.player_id,
    p.player_name,
    pl.team as player_team,
    p.market,
    p.line,
    p.over_price,
    p.under_price,
    p.bookmaker,
    p.home_team,
    p.away_team,
    case
      when pl.team = p.home_team then p.away_team
      when pl.team = p.away_team then p.home_team
      else null
    end as upcoming_opponent,
    p.commence_time,
    p.fetched_at
  from public.nba_prop_lines p
  join public.nba_players pl
    on pl.id = p.player_id
  where p.bookmaker = 'draftkings'
    and p.commence_time >= now()
    and p.player_id is not null
    and p.market in (
      'player_points',
      'player_rebounds',
      'player_assists',
      'player_threes',
      'player_points_rebounds_assists'
    )
),

history as (
  select
    p.*,
    gs.game_id,
    gs.game_date,
    gs.season,
    gs.opponent,
    case p.market
      when 'player_points'
        then gs.points::numeric
      when 'player_rebounds'
        then gs.rebounds::numeric
      when 'player_assists'
        then gs.assists::numeric
      when 'player_threes'
        then gs.three_pointers_made::numeric
      when 'player_points_rebounds_assists'
        then (
          gs.points +
          gs.rebounds +
          gs.assists
        )::numeric
    end as stat_value
  from props p
  join public.nba_player_game_stats gs
    on gs.player_id = p.player_id
   and gs.season in (2026, 2025)
   and gs.game_type = 'regular'
),

ranked_history as (
  select
    h.*,
    row_number() over (
      partition by h.prop_id
      order by h.game_date desc, h.game_id desc
    ) as game_number
  from history h
  where h.stat_value is not null
),

aggregated as (
  select
    p.prop_id,

    count(r.game_id)
      filter (where r.game_number <= 5) as l5_games,

    count(r.game_id)
      filter (
        where r.game_number <= 5
          and r.stat_value > p.line
      ) as l5_overs,

    count(r.game_id)
      filter (
        where r.game_number <= 5
          and r.stat_value < p.line
      ) as l5_unders,

    count(r.game_id)
      filter (
        where r.game_number <= 5
          and r.stat_value = p.line
      ) as l5_pushes,

    avg(r.stat_value)
      filter (where r.game_number <= 5) as l5_avg,

    count(r.game_id)
      filter (where r.game_number <= 10) as l10_games,

    count(r.game_id)
      filter (
        where r.game_number <= 10
          and r.stat_value > p.line
      ) as l10_overs,

    count(r.game_id)
      filter (
        where r.game_number <= 10
          and r.stat_value < p.line
      ) as l10_unders,

    count(r.game_id)
      filter (
        where r.game_number <= 10
          and r.stat_value = p.line
      ) as l10_pushes,

    avg(r.stat_value)
      filter (where r.game_number <= 10) as l10_avg,

    count(r.game_id)
      filter (where r.season = 2026) as season_games,

    count(r.game_id)
      filter (
        where r.season = 2026
          and r.stat_value > p.line
      ) as season_overs,

    count(r.game_id)
      filter (
        where r.season = 2026
          and r.stat_value < p.line
      ) as season_unders,

    count(r.game_id)
      filter (
        where r.season = 2026
          and r.stat_value = p.line
      ) as season_pushes,

    avg(r.stat_value)
      filter (where r.season = 2026) as season_avg,

    count(r.game_id)
      filter (
        where r.season = 2026
          and r.opponent = p.upcoming_opponent
      ) as h2h_games,

    count(r.game_id)
      filter (
        where r.season = 2026
          and r.opponent = p.upcoming_opponent
          and r.stat_value > p.line
      ) as h2h_overs,

    count(r.game_id)
      filter (
        where r.season = 2026
          and r.opponent = p.upcoming_opponent
          and r.stat_value < p.line
      ) as h2h_unders,

    count(r.game_id)
      filter (
        where r.season = 2026
          and r.opponent = p.upcoming_opponent
          and r.stat_value = p.line
      ) as h2h_pushes,

    avg(r.stat_value)
      filter (
        where r.season = 2026
          and r.opponent = p.upcoming_opponent
      ) as h2h_avg,

    jsonb_agg(
      jsonb_build_object(
        'gameId', r.game_id,
        'gameDate', r.game_date,
        'season', r.season,
        'opponent', r.opponent,
        'value', r.stat_value
      )
      order by r.game_date desc, r.game_id desc
    ) filter (
      where r.game_number <= 10
    ) as last_ten

  from props p
  left join ranked_history r
    on r.prop_id = p.prop_id
  group by p.prop_id
)

select
  p.prop_id,
  p.event_id,
  p.player_id,
  p.player_name,
  p.player_team,
  p.market,
  p.line,
  p.over_price,
  p.under_price,
  p.bookmaker,
  p.home_team,
  p.away_team,
  p.upcoming_opponent,
  p.commence_time,
  p.fetched_at,

  coalesce(a.l5_games, 0) as l5_games,
  coalesce(a.l5_overs, 0) as l5_overs,
  coalesce(a.l5_unders, 0) as l5_unders,
  coalesce(a.l5_pushes, 0) as l5_pushes,

  case
    when coalesce(a.l5_overs, 0) +
         coalesce(a.l5_unders, 0) > 0
    then round(
      100.0 * a.l5_overs /
      (a.l5_overs + a.l5_unders),
      1
    )
    else null
  end as l5_over_pct,

  round(a.l5_avg, 2) as l5_avg,

  coalesce(a.l10_games, 0) as l10_games,
  coalesce(a.l10_overs, 0) as l10_overs,
  coalesce(a.l10_unders, 0) as l10_unders,
  coalesce(a.l10_pushes, 0) as l10_pushes,

  case
    when coalesce(a.l10_overs, 0) +
         coalesce(a.l10_unders, 0) > 0
    then round(
      100.0 * a.l10_overs /
      (a.l10_overs + a.l10_unders),
      1
    )
    else null
  end as l10_over_pct,

  round(a.l10_avg, 2) as l10_avg,

  coalesce(a.season_games, 0) as season_games,
  coalesce(a.season_overs, 0) as season_overs,
  coalesce(a.season_unders, 0) as season_unders,
  coalesce(a.season_pushes, 0) as season_pushes,

  case
    when coalesce(a.season_overs, 0) +
         coalesce(a.season_unders, 0) > 0
    then round(
      100.0 * a.season_overs /
      (a.season_overs + a.season_unders),
      1
    )
    else null
  end as season_over_pct,

  round(a.season_avg, 2) as season_avg,

  coalesce(a.h2h_games, 0) as h2h_games,
  coalesce(a.h2h_overs, 0) as h2h_overs,
  coalesce(a.h2h_unders, 0) as h2h_unders,
  coalesce(a.h2h_pushes, 0) as h2h_pushes,

  case
    when coalesce(a.h2h_overs, 0) +
         coalesce(a.h2h_unders, 0) > 0
    then round(
      100.0 * a.h2h_overs /
      (a.h2h_overs + a.h2h_unders),
      1
    )
    else null
  end as h2h_over_pct,

  round(a.h2h_avg, 2) as h2h_avg,

  coalesce(a.last_ten, '[]'::jsonb) as last_ten

from props p
left join aggregated a
  on a.prop_id = p.prop_id;
