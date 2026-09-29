create or replace view public.nfl_team_ats_results as

select
  g.id as game_id,
  g.season,
  g.week,
  g.game_date,
  g.commence_time,

  g.away_team as team,
  g.home_team as opponent,
  true as is_away,

  g.away_score as team_score,
  g.home_score as opponent_score,

  a.away_spread as spread,

  (
    g.away_score
    + a.away_spread
    - g.home_score
  )::numeric as cover_margin,

  case
    when (
      g.away_score
      + a.away_spread
      - g.home_score
    ) > 0 then 'W'
    when (
      g.away_score
      + a.away_spread
      - g.home_score
    ) < 0 then 'L'
    else 'P'
  end as ats_result,

  a.bookmaker,
  a.market_last_update,
  a.captured_at

from public.nfl_games g
join public.nfl_ats_grading_lines a
  on a.game_id = g.id

where
  g.game_type = 'REG'
  and a.bookmaker = 'draftkings'
  and g.away_score is not null
  and g.home_score is not null

union all

select
  g.id as game_id,
  g.season,
  g.week,
  g.game_date,
  g.commence_time,

  g.home_team as team,
  g.away_team as opponent,
  false as is_away,

  g.home_score as team_score,
  g.away_score as opponent_score,

  a.home_spread as spread,

  (
    g.home_score
    + a.home_spread
    - g.away_score
  )::numeric as cover_margin,

  case
    when (
      g.home_score
      + a.home_spread
      - g.away_score
    ) > 0 then 'W'
    when (
      g.home_score
      + a.home_spread
      - g.away_score
    ) < 0 then 'L'
    else 'P'
  end as ats_result,

  a.bookmaker,
  a.market_last_update,
  a.captured_at

from public.nfl_games g
join public.nfl_ats_grading_lines a
  on a.game_id = g.id

where
  g.game_type = 'REG'
  and a.bookmaker = 'draftkings'
  and g.away_score is not null
  and g.home_score is not null;
