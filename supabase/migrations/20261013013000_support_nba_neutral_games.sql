alter table public.nba_games
  add column is_neutral boolean not null default false;

alter table public.nba_player_game_stats
  alter column is_home drop not null;

comment on column public.nba_games.is_neutral is
  'True when NBA.com does not designate a conventional home team, such as neutral or special-site games.';

comment on column public.nba_player_game_stats.is_home is
  'True for home, false for away, null when NBA.com does not designate home/away.';
