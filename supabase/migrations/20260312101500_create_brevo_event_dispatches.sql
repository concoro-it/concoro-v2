create table if not exists public.brevo_event_dispatches (
    id uuid primary key default gen_random_uuid(),
    event_name text not null,
    event_key text not null,
    email text,
    user_id uuid,
    source text not null,
    payload jsonb not null default '{}'::jsonb,
    dispatched_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create unique index if not exists brevo_event_dispatches_event_name_event_key_uidx
    on public.brevo_event_dispatches (event_name, event_key);

create index if not exists brevo_event_dispatches_user_id_idx
    on public.brevo_event_dispatches (user_id);

create index if not exists brevo_event_dispatches_dispatched_at_idx
    on public.brevo_event_dispatches (dispatched_at desc);
