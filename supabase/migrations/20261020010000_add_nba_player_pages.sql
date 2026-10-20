create or replace view public.nba_player_pages as
select
  p.id as player_id,
  p.player_name,
  lower(
    trim(
      both '-' from regexp_replace(
        regexp_replace(
          p.player_name,
          '[''’\.\-]',
          '',
          'g'
        ),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      )
    )
  ) as slug,
  p.team,
  p.active
from public.nba_players p
where exists (
  select 1
  from public.nba_player_game_stats pgs
  where pgs.player_id = p.id
);
