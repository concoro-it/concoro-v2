begin;

alter table public.profiles
    add column if not exists profilo_professionale text,
    add column if not exists titolo_studio text,
    add column if not exists anni_esperienza integer,
    add column if not exists settori_interesse text[],
    add column if not exists sede_preferita text,
    add column if not exists remote_preferito boolean default false;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_anni_esperienza_non_negative'
    ) then
        alter table public.profiles
            add constraint profiles_anni_esperienza_non_negative
            check (anni_esperienza is null or anni_esperienza >= 0);
    end if;
end $$;

-- Best-effort initialization from existing profile preference fields.
update public.profiles
set
    settori_interesse = coalesce(settori_interesse, preferred_settori),
    sede_preferita = coalesce(
        nullif(sede_preferita, ''),
        nullif(provincia_interesse, ''),
        nullif(regione_interesse, '')
    ),
    remote_preferito = coalesce(remote_preferito, false);

commit;
