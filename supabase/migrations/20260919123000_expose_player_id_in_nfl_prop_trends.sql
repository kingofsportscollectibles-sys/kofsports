create or replace view public.nfl_player_prop_identity as
select
  p.id as prop_id,
  r.gsis_id as external_player_id
from public.nfl_prop_lines p
left join public.nfl_player_current_teams r
  on r.season = 2026
 and public.normalize_nfl_player_name(r.player_name)
     = public.normalize_nfl_player_name(p.player_name);

create or replace view public.nfl_player_prop_trends_with_identity as
select
  t.*,
  i.external_player_id
from public.nfl_player_prop_trends t
left join public.nfl_player_prop_identity i
  on i.prop_id = t.prop_id;
