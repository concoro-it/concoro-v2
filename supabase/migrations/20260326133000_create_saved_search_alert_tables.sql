create table if not exists public.saved_search_alert_preferences (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.saved_search_alert_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    saved_search_id uuid not null references public.saved_searches(id) on delete cascade,
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint saved_search_alert_subscriptions_user_saved_unique unique (user_id, saved_search_id)
);

create index if not exists saved_search_alert_subscriptions_user_idx
    on public.saved_search_alert_subscriptions (user_id);

create table if not exists public.saved_search_alert_matches (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    saved_search_id uuid not null references public.saved_searches(id) on delete cascade,
    concorso_id text not null references public.concorsi(concorso_id) on delete cascade,
    first_seen_at timestamptz not null default now(),
    last_notified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint saved_search_alert_matches_user_saved_concorso_unique unique (user_id, saved_search_id, concorso_id)
);

create index if not exists saved_search_alert_matches_user_first_seen_idx
    on public.saved_search_alert_matches (user_id, first_seen_at desc);

create index if not exists saved_search_alert_matches_user_notified_idx
    on public.saved_search_alert_matches (user_id, last_notified_at);

alter table public.saved_search_alert_preferences enable row level security;
alter table public.saved_search_alert_subscriptions enable row level security;
alter table public.saved_search_alert_matches enable row level security;

create policy "saved_search_alert_preferences_select_own"
    on public.saved_search_alert_preferences
    for select
    using (auth.uid() = user_id);

create policy "saved_search_alert_preferences_insert_own"
    on public.saved_search_alert_preferences
    for insert
    with check (auth.uid() = user_id);

create policy "saved_search_alert_preferences_update_own"
    on public.saved_search_alert_preferences
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "saved_search_alert_subscriptions_select_own"
    on public.saved_search_alert_subscriptions
    for select
    using (auth.uid() = user_id);

create policy "saved_search_alert_subscriptions_insert_own"
    on public.saved_search_alert_subscriptions
    for insert
    with check (auth.uid() = user_id);

create policy "saved_search_alert_subscriptions_update_own"
    on public.saved_search_alert_subscriptions
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "saved_search_alert_subscriptions_delete_own"
    on public.saved_search_alert_subscriptions
    for delete
    using (auth.uid() = user_id);

create policy "saved_search_alert_matches_select_own"
    on public.saved_search_alert_matches
    for select
    using (auth.uid() = user_id);
