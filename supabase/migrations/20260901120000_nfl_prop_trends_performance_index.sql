create index if not exists nfl_player_game_stats_normalized_player_date_idx
on public.nfl_player_game_stats (
  public.normalize_nfl_player_name(player_name),
  game_date desc
);