create or replace view public.nhl_player_prop_trends as

with props as (
  select
    p.id as prop_id,
    p.event_id,
    p.player_id,
    p.player_name,
    pl.team as player_team,
    pl.position,
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
      else null::text
    end as upcoming_opponent,
    p.commence_time,
    p.bookmaker_last_update,
    p.fetched_at
  from public.nhl_prop_lines p
  left join public.nhl_players pl
    on pl.id = p.player_id
),

history as (
  select
    p.*,
    gs.game_id,
    gs.season,
    gs.game_date,
    gs.team,
    gs.opponent,
    gs.is_home,
    case
      when p.market = 'player_shots_on_goal'
        then gs.shots::numeric
      when p.market = 'player_points'
        then gs.points::numeric
      when p.market = 'player_assists'
        then gs.assists::numeric
      when p.market = 'player_total_saves'
        and gs.position = 'G'
        then gs.saves::numeric
      else null::numeric
    end as stat_value
  from props p
  left join public.nhl_player_game_stats gs
    on gs.player_id = p.player_id
   and gs.game_type = 2
),

ranked_history as (
  select
    history.*,
    case
      when history.stat_value is not null
      then row_number() over (
        partition by history.prop_id
        order by history.game_date desc nulls last
      )
      else null
    end as game_number,
    max(history.season) filter (
      where history.stat_value is not null
    ) over (
      partition by history.prop_id
    ) as latest_season
  from history
),

aggregated as (
  select
    p.prop_id,
    p.event_id,
    p.player_id,
    p.player_name,
    p.player_team,
    p.position,
    p.market,
    p.line,
    p.over_price,
    p.under_price,
    p.bookmaker,
    p.home_team,
    p.away_team,
    p.upcoming_opponent,
    p.commence_time,
    p.bookmaker_last_update,
    p.fetched_at,

    count(rh.stat_value) filter (
      where rh.game_number <= 5
    ) as l5_games,

    count(rh.stat_value) filter (
      where rh.game_number <= 5
        and rh.stat_value > rh.line
    ) as l5_overs,

    count(rh.stat_value) filter (
      where rh.game_number <= 5
        and rh.stat_value < rh.line
    ) as l5_unders,

    count(rh.stat_value) filter (
      where rh.game_number <= 5
        and rh.stat_value = rh.line
    ) as l5_pushes,

    round(
      avg(rh.stat_value) filter (
        where rh.game_number <= 5
      ),
      1
    ) as avg_l5,

    count(rh.stat_value) filter (
      where rh.game_number <= 10
    ) as l10_games,

    count(rh.stat_value) filter (
      where rh.game_number <= 10
        and rh.stat_value > rh.line
    ) as l10_overs,

    count(rh.stat_value) filter (
      where rh.game_number <= 10
        and rh.stat_value < rh.line
    ) as l10_unders,

    count(rh.stat_value) filter (
      where rh.game_number <= 10
        and rh.stat_value = rh.line
    ) as l10_pushes,

    round(
      avg(rh.stat_value) filter (
        where rh.game_number <= 10
      ),
      1
    ) as avg_l10,

    count(rh.stat_value) filter (
      where rh.season = rh.latest_season
    ) as season_games,

    count(rh.stat_value) filter (
      where rh.season = rh.latest_season
        and rh.stat_value > rh.line
    ) as season_overs,

    round(
      avg(rh.stat_value) filter (
        where rh.season = rh.latest_season
      ),
      1
    ) as avg_season,

    count(rh.stat_value) filter (
      where rh.opponent = p.upcoming_opponent
    ) as h2h_games,

    count(rh.stat_value) filter (
      where rh.opponent = p.upcoming_opponent
        and rh.stat_value > rh.line
    ) as h2h_overs,

    round(
      avg(rh.stat_value) filter (
        where rh.opponent = p.upcoming_opponent
      ),
      1
    ) as avg_h2h,

    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'game_date', rh.game_date,
          'opponent', rh.opponent,
          'value', rh.stat_value,
          'is_home', rh.is_home,
          'result',
            case
              when rh.stat_value > rh.line then 'over'
              when rh.stat_value < rh.line then 'under'
              else 'push'
            end
        )
        order by rh.game_date desc
      ) filter (
        where rh.game_number <= 10
          and rh.stat_value is not null
      ),
      '[]'::jsonb
    ) as last_ten

  from props p
  left join ranked_history rh
    on rh.prop_id = p.prop_id
   and rh.stat_value is not null

  group by
    p.prop_id,
    p.event_id,
    p.player_id,
    p.player_name,
    p.player_team,
    p.position,
    p.market,
    p.line,
    p.over_price,
    p.under_price,
    p.bookmaker,
    p.home_team,
    p.away_team,
    p.upcoming_opponent,
    p.commence_time,
    p.bookmaker_last_update,
    p.fetched_at
)

select
  prop_id,
  event_id,
  player_id,
  player_name,
  player_team,
  position,
  market,
  line,
  over_price,
  under_price,
  bookmaker,
  home_team,
  away_team,
  upcoming_opponent,
  commence_time,
  bookmaker_last_update,
  fetched_at,

  l5_games,
  l5_overs,
  l5_unders,
  l5_pushes,
  avg_l5,

  l10_games,
  l10_overs,
  l10_unders,
  l10_pushes,
  avg_l10,

  season_games,
  season_overs,
  avg_season,

  h2h_games,
  h2h_overs,
  avg_h2h,

  last_ten,

  round(
    100.0 * l5_overs::numeric
    / nullif(l5_games - l5_pushes, 0)::numeric,
    1
  ) as l5_over_pct,

  round(
    100.0 * l10_overs::numeric
    / nullif(l10_games - l10_pushes, 0)::numeric,
    1
  ) as l10_over_pct,

  round(
    100.0 * season_overs::numeric
    / nullif(season_games, 0)::numeric,
    1
  ) as season_over_pct,

  round(
    100.0 * h2h_overs::numeric
    / nullif(h2h_games, 0)::numeric,
    1
  ) as h2h_over_pct

from aggregated;
