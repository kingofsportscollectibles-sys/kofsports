-- ============================================================
-- KofSports Growth OS v1
-- Internal social-growth CRM foundation
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- SHARED FUNCTIONS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- ============================================================
-- FOUNDATION TABLES
-- Some may already exist from manual setup.
-- ============================================================

create table if not exists public.growth_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.growth_tags
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists color text,
  add column if not exists description text,
  add column if not exists created_at timestamptz default now();

create table if not exists public.growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft',
  platform text,
  campaign_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  budget_cents integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.growth_campaigns
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists status text default 'draft',
  add column if not exists platform text,
  add column if not exists campaign_type text,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists budget_cents integer default 0,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.growth_daily_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  goal_type text not null,
  label text not null,
  target_value integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.growth_daily_goals
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade,
  add column if not exists goal_type text,
  add column if not exists label text,
  add column if not exists target_value integer default 0,
  add column if not exists is_active boolean default true,
  add column if not exists sort_order integer default 0,
  add column if not exists effective_from date default current_date,
  add column if not exists effective_to date,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.growth_scoring_rules (
  id uuid primary key default gen_random_uuid(),
  event_type text not null unique,
  label text not null,
  score_delta integer not null,
  is_active boolean not null default true,
  max_occurrences integer,
  cooldown_hours integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.growth_scoring_rules
  add column if not exists event_type text,
  add column if not exists label text,
  add column if not exists score_delta integer,
  add column if not exists is_active boolean default true,
  add column if not exists max_occurrences integer,
  add column if not exists cooldown_hours integer,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- ============================================================
-- LEADS
-- ============================================================

create table if not exists public.growth_leads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text,
  username text,
  normalized_username text,
  platform text not null default 'x',
  profile_url text,
  avatar_url text,
  location text,
  status text not null default 'new',
  lead_score integer not null default 0,
  source text,
  source_detail text,
  favorite_sports text[] not null default '{}',
  notes text,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  owner_id uuid references public.profiles(id) on delete set null,
  converted_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.growth_leads
  drop constraint if exists growth_leads_status_check;

alter table public.growth_leads
  add constraint growth_leads_status_check
  check (
    status in (
      'new',
      'contacted',
      'conversation_started',
      'interested',
      'trial',
      'premium',
      'renewed',
      'inactive',
      'lost'
    )
  );

alter table public.growth_leads
  drop constraint if exists growth_leads_score_check;

alter table public.growth_leads
  add constraint growth_leads_score_check
  check (lead_score >= 0 and lead_score <= 100);

create table if not exists public.growth_lead_identities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  platform text not null,
  username text,
  normalized_username text,
  profile_url text,
  avatar_url text,
  external_user_id text,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_lead_tags (
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  tag_id uuid not null references public.growth_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, tag_id)
);

-- ============================================================
-- ACTIVITY TIMELINE
-- ============================================================

create table if not exists public.growth_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete set null,
  activity_type text not null,
  platform text,
  direction text,
  title text,
  description text,
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  external_id text,
  external_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint growth_activities_direction_check
  check (
    direction is null
    or direction in ('inbound', 'outbound', 'internal', 'system')
  )
);

create table if not exists public.growth_activity_attachments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null
    references public.growth_activities(id)
    on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size integer,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FOLLOW-UPS AND TASKS
-- ============================================================

create table if not exists public.growth_followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  due_at timestamptz not null,
  priority text not null default 'medium',
  reason text,
  notes text,
  status text not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint growth_followups_priority_check
  check (priority in ('low', 'medium', 'high')),

  constraint growth_followups_status_check
  check (status in ('open', 'completed', 'cancelled'))
);

create table if not exists public.growth_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'medium',
  due_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  lead_id uuid references public.growth_leads(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint growth_tasks_priority_check
  check (priority in ('low', 'medium', 'high')),

  constraint growth_tasks_status_check
  check (status in ('open', 'in_progress', 'completed', 'cancelled'))
);

-- ============================================================
-- CAMPAIGN RELATIONSHIPS AND ATTRIBUTION
-- ============================================================

create table if not exists public.growth_campaign_members (
  campaign_id uuid not null
    references public.growth_campaigns(id)
    on delete cascade,
  lead_id uuid not null
    references public.growth_leads(id)
    on delete cascade,
  joined_at timestamptz not null default now(),
  attribution_type text not null default 'primary',
  primary key (campaign_id, lead_id)
);

create table if not exists public.growth_attributions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.growth_leads(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete set null,
  activity_id uuid references public.growth_activities(id) on delete set null,

  -- Stored without a foreign key until the current transaction-table
  -- schema is formally included in a migration.
  transaction_id uuid,

  attribution_type text not null,
  touchpoint_type text,
  revenue_cents integer not null default 0,
  attributed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- ============================================================
-- DAILY MISSION PROGRESS
-- ============================================================

create table if not exists public.growth_daily_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null
    references public.growth_daily_goals(id)
    on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  progress_date date not null default current_date,
  completed_value integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists growth_daily_progress_unique_idx
on public.growth_daily_progress (
  goal_id,
  coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid),
  progress_date
);

-- ============================================================
-- LEAD SCORING
-- ============================================================

create table if not exists public.growth_score_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.growth_leads(id) on delete cascade,
  rule_id uuid references public.growth_scoring_rules(id) on delete set null,
  activity_id uuid references public.growth_activities(id) on delete set null,
  score_delta integer not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- AI SUMMARIES
-- ============================================================

create table if not exists public.growth_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.growth_leads(id) on delete cascade,
  summary_type text not null,
  summary text not null,
  recommended_action text,
  model text,
  input_snapshot jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ============================================================
-- SAVED FILTERS
-- ============================================================

create table if not exists public.growth_saved_filters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  view_type text not null,
  filters jsonb not null default '{}'::jsonb,
  sort_config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create unique index if not exists growth_tags_slug_unique_idx
  on public.growth_tags(slug);

create unique index if not exists growth_campaigns_slug_unique_idx
  on public.growth_campaigns(slug);

create unique index if not exists growth_scoring_rules_event_type_unique_idx
  on public.growth_scoring_rules(event_type);

create unique index if not exists growth_leads_platform_username_unique_idx
  on public.growth_leads(platform, normalized_username)
  where normalized_username is not null;

create unique index if not exists growth_lead_identities_platform_username_unique_idx
  on public.growth_lead_identities(platform, normalized_username)
  where normalized_username is not null;

create index if not exists growth_leads_status_idx
  on public.growth_leads(status);

create index if not exists growth_leads_score_idx
  on public.growth_leads(lead_score desc);

create index if not exists growth_leads_follow_up_idx
  on public.growth_leads(next_follow_up_at);

create index if not exists growth_leads_profile_idx
  on public.growth_leads(profile_id);

create index if not exists growth_leads_platform_idx
  on public.growth_leads(platform);

create index if not exists growth_leads_created_at_idx
  on public.growth_leads(created_at desc);

create index if not exists growth_lead_identities_lead_idx
  on public.growth_lead_identities(lead_id);

create index if not exists growth_lead_identities_platform_idx
  on public.growth_lead_identities(platform);

create index if not exists growth_lead_tags_tag_idx
  on public.growth_lead_tags(tag_id);

create index if not exists growth_activities_lead_date_idx
  on public.growth_activities(lead_id, occurred_at desc);

create index if not exists growth_activities_campaign_idx
  on public.growth_activities(campaign_id);

create index if not exists growth_activities_type_idx
  on public.growth_activities(activity_type);

create index if not exists growth_activities_occurred_at_idx
  on public.growth_activities(occurred_at desc);

create index if not exists growth_followups_due_idx
  on public.growth_followups(status, due_at);

create index if not exists growth_followups_lead_idx
  on public.growth_followups(lead_id);

create index if not exists growth_tasks_due_idx
  on public.growth_tasks(status, due_at);

create index if not exists growth_tasks_lead_idx
  on public.growth_tasks(lead_id);

create index if not exists growth_tasks_campaign_idx
  on public.growth_tasks(campaign_id);

create index if not exists growth_campaigns_status_idx
  on public.growth_campaigns(status);

create index if not exists growth_campaign_members_lead_idx
  on public.growth_campaign_members(lead_id);

create index if not exists growth_attributions_campaign_idx
  on public.growth_attributions(campaign_id, attributed_at desc);

create index if not exists growth_score_events_lead_idx
  on public.growth_score_events(lead_id, created_at desc);

create index if not exists growth_ai_summaries_lead_idx
  on public.growth_ai_summaries(lead_id, generated_at desc);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'growth_campaigns',
    'growth_daily_goals',
    'growth_scoring_rules',
    'growth_leads',
    'growth_lead_identities',
    'growth_followups',
    'growth_tasks',
    'growth_saved_filters'
  ]
  loop
    trigger_name := 'set_' || table_name || '_updated_at';

    execute format(
      'drop trigger if exists %I on public.%I',
      trigger_name,
      table_name
    );

    execute format(
      'create trigger %I
       before update on public.%I
       for each row
       execute function public.set_updated_at()',
      trigger_name,
      table_name
    );
  end loop;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.growth_tags enable row level security;
alter table public.growth_campaigns enable row level security;
alter table public.growth_daily_goals enable row level security;
alter table public.growth_scoring_rules enable row level security;
alter table public.growth_leads enable row level security;
alter table public.growth_lead_identities enable row level security;
alter table public.growth_lead_tags enable row level security;
alter table public.growth_activities enable row level security;
alter table public.growth_activity_attachments enable row level security;
alter table public.growth_followups enable row level security;
alter table public.growth_tasks enable row level security;
alter table public.growth_campaign_members enable row level security;
alter table public.growth_attributions enable row level security;
alter table public.growth_daily_progress enable row level security;
alter table public.growth_score_events enable row level security;
alter table public.growth_ai_summaries enable row level security;
alter table public.growth_saved_filters enable row level security;

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'growth_tags',
    'growth_campaigns',
    'growth_daily_goals',
    'growth_scoring_rules',
    'growth_leads',
    'growth_lead_identities',
    'growth_lead_tags',
    'growth_activities',
    'growth_activity_attachments',
    'growth_followups',
    'growth_tasks',
    'growth_campaign_members',
    'growth_attributions',
    'growth_daily_progress',
    'growth_score_events',
    'growth_ai_summaries',
    'growth_saved_filters'
  ]
  loop
    policy_name := table_name || '_admin_all';

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I
         on public.%I
         for all
         to authenticated
         using (public.is_admin())
         with check (public.is_admin())',
        policy_name,
        table_name
      );
    end if;
  end loop;
end;
$$;

-- ============================================================
-- DEFAULT TAGS
-- ============================================================

insert into public.growth_tags (name, slug, color, description)
values
  ('NFL', 'nfl', 'blue', 'Interested in NFL betting content'),
  ('MLB', 'mlb', 'red', 'Interested in MLB betting content'),
  ('NBA', 'nba', 'orange', 'Interested in NBA betting content'),
  ('NHL', 'nhl', 'cyan', 'Interested in NHL betting content'),
  ('Golf', 'golf', 'green', 'Interested in golf betting content'),
  ('Player Props', 'player-props', 'purple', 'Interested in player props'),
  ('Parlays', 'parlays', 'pink', 'Interested in parlays'),
  ('Sharp', 'sharp', 'slate', 'Experienced or analytical bettor'),
  ('Beginner', 'beginner', 'emerald', 'Newer sports bettor'),
  ('Influencer', 'influencer', 'yellow', 'Social media influencer or creator'),
  ('Won Free Pick', 'won-free-pick', 'green', 'Received a winning free pick'),
  ('VIP Prospect', 'vip-prospect', 'amber', 'Strong premium membership prospect'),
  ('Needs Follow Up', 'needs-follow-up', 'red', 'Requires follow-up outreach')
on conflict (slug) do nothing;

-- ============================================================
-- DEFAULT SCORING RULES
-- ============================================================

insert into public.growth_scoring_rules (
  event_type,
  label,
  score_delta,
  is_active,
  max_occurrences,
  cooldown_hours
)
values
  ('followed_kofsports', 'Followed KofSports', 5, true, 1, null),
  ('comment_replied', 'Replied to Comment', 10, true, 5, 24),
  ('dm_replied', 'Replied to DM', 15, true, 5, 24),
  ('website_visit', 'Visited Website', 20, true, 5, 24),
  ('account_created', 'Created Account', 25, true, 1, null),
  ('trial_started', 'Started Trial', 35, true, 1, null),
  ('premium_purchased', 'Purchased Premium', 50, true, 1, null),
  ('email_opened', 'Opened Email', 10, true, 5, 24),
  ('won_free_pick', 'Won Free Pick', 15, true, 5, 24),
  ('pricing_page_visit', 'Visited Pricing Page', 20, true, 5, 24)
on conflict (event_type) do update
set
  label = excluded.label,
  score_delta = excluded.score_delta,
  is_active = excluded.is_active,
  max_occurrences = excluded.max_occurrences,
  cooldown_hours = excluded.cooldown_hours,
  updated_at = now();

-- ============================================================
-- DEFAULT DAILY MISSION GOALS
-- owner_id null means the global default template.
-- ============================================================

insert into public.growth_daily_goals (
  owner_id,
  goal_type,
  label,
  target_value,
  sort_order
)
select
  null,
  defaults.goal_type,
  defaults.label,
  defaults.target_value,
  defaults.sort_order
from (
  values
    ('reply_to_posts', 'Reply to betting posts', 25, 1),
    ('start_conversations', 'Start new conversations', 10, 2),
    ('follow_up_leads', 'Follow up with leads', 5, 3),
    ('publish_free_pick', 'Publish a free pick', 1, 4),
    ('publish_educational_post', 'Publish an educational post', 1, 5),
    ('publish_short_video', 'Publish a short-form video', 1, 6)
) as defaults(goal_type, label, target_value, sort_order)
where not exists (
  select 1
  from public.growth_daily_goals existing
  where existing.owner_id is null
    and existing.goal_type = defaults.goal_type
    and existing.effective_to is null
);

-- ============================================================
-- DOCUMENTATION COMMENTS
-- ============================================================

comment on table public.growth_leads is
  'Central Growth OS lead records linking social prospects to KofSports profiles.';

comment on table public.growth_activities is
  'Chronological event timeline for lead interactions and funnel activity.';

comment on table public.growth_followups is
  'Lead-specific follow-up commitments and reminders.';

comment on table public.growth_tasks is
  'General Growth OS operational tasks associated with leads or campaigns.';

comment on table public.growth_attributions is
  'Campaign and touchpoint attribution records for conversions and revenue.';

comment on table public.growth_score_events is
  'Auditable history of changes contributing to each lead score.';
