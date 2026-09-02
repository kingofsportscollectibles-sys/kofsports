alter table public.profiles
add column if not exists premium_trial_used_at timestamptz;

alter table public.profiles
add column if not exists premium_trial_source text;

create index if not exists profiles_premium_trial_used_at_idx
on public.profiles (premium_trial_used_at)
where premium_trial_used_at is not null;
