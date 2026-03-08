begin;

alter table public.profiles
    add column if not exists first_name text,
    add column if not exists last_name text,
    add column if not exists regione_interesse text,
    add column if not exists provincia_interesse text;

-- Best-effort backfill from existing full_name values.
update public.profiles
set
    first_name = coalesce(
        nullif(first_name, ''),
        nullif(split_part(trim(coalesce(full_name, '')), ' ', 1), '')
    ),
    last_name = coalesce(
        nullif(last_name, ''),
        nullif(
            regexp_replace(trim(coalesce(full_name, '')), '^\S+\s*', ''),
            ''
        )
    )
where coalesce(full_name, '') <> '';

commit;
