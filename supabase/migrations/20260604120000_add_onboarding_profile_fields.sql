begin;

alter table public.profiles
    add column if not exists onboarding_completed boolean default false,
    add column if not exists onboarding_completed_at timestamptz,
    add column if not exists profile_completion_score integer default 0,
    add column if not exists disponibilita_trasferimento text,
    add column if not exists livello_preparazione text,
    add column if not exists public_admin_experience boolean,
    add column if not exists skills text[],
    add column if not exists languages text[],
    add column if not exists driving_licenses text[],
    add column if not exists profile_source text,
    add column if not exists education_history jsonb,
    add column if not exists experience_history jsonb;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_profile_completion_score_range'
    ) then
        alter table public.profiles
            add constraint profiles_profile_completion_score_range
            check (
                profile_completion_score is null
                or (profile_completion_score >= 0 and profile_completion_score <= 100)
            );
    end if;
end $$;

update public.profiles
set
    onboarding_completed = coalesce(onboarding_completed, false),
    profile_completion_score = coalesce(profile_completion_score, 0)
where onboarding_completed is null
   or profile_completion_score is null;

commit;
