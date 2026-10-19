alter table public.profiles
add column if not exists last_active_at timestamptz;

alter table public.profiles
add column if not exists last_active_path text;

-- Remove the legacy no-argument activity function if it exists.
drop function if exists public.touch_last_active();

create or replace function public.touch_last_active(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_path text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Defense in depth: the client sends pathname only, but strip any
  -- query string or fragment if one is ever supplied accidentally.
  v_path := split_part(split_part(coalesce(p_path, '/'), '?', 1), '#', 1);

  -- Store only a pathname-shaped value and cap its size.
  if left(v_path, 1) <> '/' then
    v_path := '/';
  end if;

  v_path := left(v_path, 500);

  update public.profiles
  set
    last_active_at = now(),
    last_active_path = v_path
  where id = v_user_id;
end;
$$;

revoke all on function public.touch_last_active(text) from public;
revoke all on function public.touch_last_active(text) from anon;
grant execute on function public.touch_last_active(text) to authenticated;
