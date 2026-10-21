alter table public.nba_players
  add column if not exists position text,
  add column if not exists position_group text;

alter table public.nba_players
  drop constraint if exists nba_players_position_group_check;

alter table public.nba_players
  add constraint nba_players_position_group_check
  check (
    position_group is null
    or position_group in ('G', 'F', 'C')
  );

create index if not exists nba_players_position_group_idx
  on public.nba_players (position_group);
