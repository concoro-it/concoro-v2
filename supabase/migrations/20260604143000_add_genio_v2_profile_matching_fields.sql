begin;

alter table public.profiles
    add column if not exists contract_type text,
    add column if not exists current_sector text,
    add column if not exists preferred_job_families text[],
    add column if not exists exclude_mobility boolean default false;

update public.profiles
set exclude_mobility = coalesce(exclude_mobility, false)
where exclude_mobility is null;

commit;
