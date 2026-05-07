create table if not exists public.google_indexing_notifications (
    id uuid primary key default gen_random_uuid(),
    url text not null,
    notification_type text not null check (notification_type in ('URL_UPDATED', 'URL_DELETED')),
    concorso_slug text,
    concorso_last_modified timestamptz,
    last_success_at timestamptz,
    last_attempt_at timestamptz,
    last_status integer,
    last_error text,
    attempt_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint google_indexing_notifications_url_type_unique unique (url, notification_type)
);

create index if not exists google_indexing_notifications_type_success_idx
    on public.google_indexing_notifications (notification_type, last_success_at desc);

create index if not exists google_indexing_notifications_slug_type_idx
    on public.google_indexing_notifications (concorso_slug, notification_type);

alter table public.google_indexing_notifications enable row level security;
