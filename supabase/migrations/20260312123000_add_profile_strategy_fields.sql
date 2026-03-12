begin;

alter table public.profiles
    add column if not exists obiettivo_concorso text,
    add column if not exists disponibilita_mobilita boolean default false,
    add column if not exists tempo_studio_settimanale integer;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_tempo_studio_settimanale_non_negative'
    ) then
        alter table public.profiles
            add constraint profiles_tempo_studio_settimanale_non_negative
            check (tempo_studio_settimanale is null or tempo_studio_settimanale >= 0);
    end if;
end $$;

update public.profiles
set disponibilita_mobilita = coalesce(disponibilita_mobilita, false)
where disponibilita_mobilita is null;

commit;
