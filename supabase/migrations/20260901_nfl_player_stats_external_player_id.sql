alter table public.nfl_player_game_stats
add column if not exists external_player_id text;

create unique index if not exists nfl_player_game_stats_game_external_player_idx
on public.nfl_player_game_stats (
  game_id,
  external_player_id
);

create index if not exists nfl_player_game_stats_external_player_idx
on public.nfl_player_game_stats (
  external_player_id
);
