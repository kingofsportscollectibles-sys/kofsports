create or replace view public.nfl_kof_td_percentiles as

with base as (
  select *
  from public.nfl_kof_td_candidates
  where position in ('RB', 'WR', 'TE')
    and commence_time > now()
),

market_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      order by median_probability
    ) as market_pct
  from base
  where median_probability is not null
),

opp_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by opportunities_per_game
    ) as opportunities_pct
  from base
  where opportunities_per_game is not null
),

snap_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by avg_snap_pct
    ) as snap_pct_rank
  from base
  where avg_snap_pct is not null
),

rz_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by red_zone_opportunities_per_game
    ) as red_zone_pct
  from base
  where red_zone_opportunities_per_game is not null
),

i10_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by inside_10_opportunities_per_game
    ) as inside_10_pct
  from base
  where inside_10_opportunities_per_game is not null
),

i5_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by inside_5_opportunities_per_game
    ) as inside_5_pct
  from base
  where inside_5_opportunities_per_game is not null
),

l5_opp_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by l5_opportunities_per_game
    ) as l5_opportunities_pct
  from base
  where l5_opportunities_per_game is not null
),

l5_rz_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by l5_red_zone_opportunities_per_game
    ) as l5_red_zone_pct
  from base
  where l5_red_zone_opportunities_per_game is not null
),

l5_td_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by l5_td_game_rate
    ) as l5_td_rate_pct
  from base
  where l5_td_game_rate is not null
),

opp_role_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by opportunity_role_index
    ) as opportunity_role_pct
  from base
  where opportunity_role_index is not null
),

snap_role_ranked as (
  select
    external_event_id,
    player_name,
    percent_rank() over (
      partition by position
      order by snap_role_index
    ) as snap_role_pct
  from base
  where snap_role_index is not null
)

select
  b.*,
  m.market_pct,
  o.opportunities_pct,
  s.snap_pct_rank,
  rz.red_zone_pct,
  i10.inside_10_pct,
  i5.inside_5_pct,
  l5o.l5_opportunities_pct,
  l5r.l5_red_zone_pct,
  l5t.l5_td_rate_pct,
  orr.opportunity_role_pct,
  sr.snap_role_pct

from base b

left join market_ranked m
  using (external_event_id, player_name)

left join opp_ranked o
  using (external_event_id, player_name)

left join snap_ranked s
  using (external_event_id, player_name)

left join rz_ranked rz
  using (external_event_id, player_name)

left join i10_ranked i10
  using (external_event_id, player_name)

left join i5_ranked i5
  using (external_event_id, player_name)

left join l5_opp_ranked l5o
  using (external_event_id, player_name)

left join l5_rz_ranked l5r
  using (external_event_id, player_name)

left join l5_td_ranked l5t
  using (external_event_id, player_name)

left join opp_role_ranked orr
  using (external_event_id, player_name)

left join snap_role_ranked sr
  using (external_event_id, player_name);
