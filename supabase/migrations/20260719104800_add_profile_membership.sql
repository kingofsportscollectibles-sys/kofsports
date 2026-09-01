alter table public.profiles
add column if not exists membership text not null default 'free';

alter table public.profiles
drop constraint if exists profiles_membership_check;

alter table public.profiles
add constraint profiles_membership_check
check (membership in ('free', 'premium'));

create index if not exists profiles_membership_idx
on public.profiles (membership);