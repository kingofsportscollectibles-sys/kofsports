create or replace view public.nfl_betting_power_rankings as

with team_summary as (
  select
    season,
    team,

    count(*) as games,

    count(*) filter (
      where ats_result = 'W'
    ) as wins,

    count(*) filter (
      where ats_result = 'L'
    ) as losses,

    count(*) filter (
      where ats_result = 'P'
    ) as pushes,

    count(*) filter (
      where ats_result in ('W', 'L')
    ) as decisions,

    (
      count(*) filter (
        where ats_result = 'W'
      )::numeric
      /
      nullif(
        count(*) filter (
          where ats_result in ('W', 'L')
        ),
        0
      )
    ) as ats_pct,

    avg(cover_margin) as avg_cover_margin,
    sum(cover_margin) as total_cover_margin

  from public.nfl_team_ats_results

  group by
    season,
    team
)

select
  season,
  team,
  games,
  wins,
  losses,
  pushes,
  decisions,
  ats_pct,
  avg_cover_margin,
  total_cover_margin,

  row_number() over (
    partition by season
    order by
      ats_pct desc nulls last,
      avg_cover_margin desc,
      total_cover_margin desc,
      team
  ) as rank

from team_summary;
