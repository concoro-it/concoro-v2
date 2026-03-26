do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'saved_search_alert_matches'
          and policyname = 'saved_search_alert_matches_insert_own'
    ) then
        create policy "saved_search_alert_matches_insert_own"
            on public.saved_search_alert_matches
            for insert
            with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'saved_search_alert_matches'
          and policyname = 'saved_search_alert_matches_update_own'
    ) then
        create policy "saved_search_alert_matches_update_own"
            on public.saved_search_alert_matches
            for update
            using (auth.uid() = user_id)
            with check (auth.uid() = user_id);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'saved_search_alert_matches'
          and policyname = 'saved_search_alert_matches_delete_own'
    ) then
        create policy "saved_search_alert_matches_delete_own"
            on public.saved_search_alert_matches
            for delete
            using (auth.uid() = user_id);
    end if;
end $$;
