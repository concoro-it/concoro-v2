create table if not exists public.user_alert_preferences (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    deadline_enabled boolean not null default true,
    deadline_offsets int[] not null default '{7,3,1}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint user_alert_preferences_deadline_offsets_allowed_chk check (
        coalesce(deadline_offsets <@ array[1, 3, 7]::int[], false)
    ),
    constraint user_alert_preferences_deadline_offsets_nonempty_when_enabled_chk check (
        (not deadline_enabled) or cardinality(deadline_offsets) > 0
    ),
    constraint user_alert_preferences_deadline_offsets_no_null_chk check (
        array_position(deadline_offsets, null) is null
    )
);

alter table public.user_alert_preferences enable row level security;

create policy "user_alert_preferences_select_own"
    on public.user_alert_preferences
    for select
    using (auth.uid() = user_id);

create policy "user_alert_preferences_insert_own"
    on public.user_alert_preferences
    for insert
    with check (auth.uid() = user_id);

create policy "user_alert_preferences_update_own"
    on public.user_alert_preferences
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
