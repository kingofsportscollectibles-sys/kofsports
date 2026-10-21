create or replace view public.nba_defense_vs_position as
with defense_games as (
  select
    s.season,
    s.opponent as defense,
    s.game_id,
    s.game_date,
    row_number() over (
      partition by s.season, s.opponent
      order by s.game_date desc, s.game_id desc
    ) as team_game_number
  from public.nba_player_game_stats s
  where s.game_type = 'regular'
    and s.opponent is not null
  group by
    s.season,
    s.opponent,
    s.game_id,
    s.game_date
),
game_position_totals as (
  select
    s.season,
    s.opponent as defense,
    s.game_id,
    s.game_date,
    p.position_group,
    sum(coalesce(s.points, 0)) as points_allowed,
    sum(coalesce(s.rebounds, 0)) as rebounds_allowed,
    sum(coalesce(s.assists, 0)) as assists_allowed,
    sum(coalesce(s.three_pointers_made, 0)) as threes_allowed
  from public.nba_player_game_stats s
  join public.nba_players p
    on p.id = s.player_id
  where s.game_type = 'regular'
    and s.opponent is not null
    and p.position_group in ('G', 'F', 'C')
  group by
    s.season,
    s.opponent,
    s.game_id,
    s.game_date,
    p.position_group
),
ranked_game_position_totals as (
  select
    gpt.*,
    dg.team_game_number
  from game_position_totals gpt
  join defense_games dg
    on dg.season = gpt.season
   and dg.defense = gpt.defense
   and dg.game_id = gpt.game_id
),
aggregated as (
  select
    season,
    defense,
    position_group,

    count(*) as season_games,
    round(avg(points_allowed)::numeric, 1) as points_allowed_per_game,
    round(avg(rebounds_allowed)::numeric, 1) as rebounds_allowed_per_game,
    round(avg(assists_allowed)::numeric, 1) as assists_allowed_per_game,
    round(avg(threes_allowed)::numeric, 1) as threes_allowed_per_game,

    count(*) filter (
      where team_game_number <= 5
    ) as last_5_games,
    round(
      avg(points_allowed) filter (
        where team_game_number <= 5
      )::numeric,
      1
    ) as last_5_points_allowed_per_game,
    round(
      avg(rebounds_allowed) filter (
        where team_game_number <= 5
      )::numeric,
      1
    ) as last_5_rebounds_allowed_per_game,
    round(
      avg(assists_allowed) filter (
        where team_game_number <= 5
      )::numeric,
      1
    ) as last_5_assists_allowed_per_game,
    round(
      avg(threes_allowed) filter (
        where team_game_number <= 5
      )::numeric,
      1
    ) as last_5_threes_allowed_per_game,

    count(*) filter (
      where team_game_number <= 10
    ) as last_10_games,
    round(
      avg(points_allowed) filter (
        where team_game_number <= 10
      )::numeric,
      1
    ) as last_10_points_allowed_per_game,
    round(
      avg(rebounds_allowed) filter (
        where team_game_number <= 10
      )::numeric,
      1
    ) as last_10_rebounds_allowed_per_game,
    round(
      avg(assists_allowed) filter (
        where team_game_number <= 10
      )::numeric,
      1
    ) as last_10_assists_allowed_per_game,
    round(
      avg(threes_allowed) filter (
        where team_game_number <= 10
      )::numeric,
      1
    ) as last_10_threes_allowed_per_game,

    max(game_date) as through_date
  from ranked_game_position_totals
  group by
    season,
    defense,
    position_group
)
select
  season,
  defense,
  position_group,
  season_games,
  points_allowed_per_game,
  rebounds_allowed_per_game,
  assists_allowed_per_game,
  threes_allowed_per_game,
  last_5_games,
  last_5_points_allowed_per_game,
  last_5_rebounds_allowed_per_game,
  last_5_assists_allowed_per_game,
  last_5_threes_allowed_per_game,
  last_10_games,
  last_10_points_allowed_per_game,
  last_10_rebounds_allowed_per_game,
  last_10_assists_allowed_per_game,
  last_10_threes_allowed_per_game,
  through_date,

  rank() over (
    partition by season, position_group
    order by points_allowed_per_game desc
  ) as points_allowed_rank,

  rank() over (
    partition by season, position_group
    order by rebounds_allowed_per_game desc
  ) as rebounds_allowed_rank,

  rank() over (
    partition by season, position_group
    order by assists_allowed_per_game desc
  ) as assists_allowed_rank,

  rank() over (
    partition by season, position_group
    order by threes_allowed_per_game desc
  ) as threes_allowed_rank
from aggregated;

grant select on public.nba_defense_vs_position
  to anon, authenticated;
