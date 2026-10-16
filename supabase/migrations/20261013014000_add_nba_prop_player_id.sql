alter table public.nba_prop_lines
  add column player_id bigint
  references public.nba_players(id)
  on delete set null;

create index nba_prop_lines_player_id_idx
  on public.nba_prop_lines (player_id);

alter table public.nba_prop_line_history
  add column player_id bigint
  references public.nba_players(id)
  on delete set null;

create index nba_prop_line_history_player_id_idx
  on public.nba_prop_line_history (player_id);
