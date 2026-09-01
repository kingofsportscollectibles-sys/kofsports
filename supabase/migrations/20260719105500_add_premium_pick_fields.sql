alter table public.vip_picks
add column if not exists is_premium boolean not null default true;

alter table public.vip_picks
add column if not exists analysis text;

alter table public.vip_picks
add column if not exists best_sportsbook text;

alter table public.vip_picks
add column if not exists game_notes text;

create index if not exists vip_picks_is_premium_idx
on public.vip_picks (is_premium);