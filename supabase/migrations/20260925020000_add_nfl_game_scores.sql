alter table public.nfl_games
  add column if not exists away_score integer,
  add column if not exists home_score integer;
