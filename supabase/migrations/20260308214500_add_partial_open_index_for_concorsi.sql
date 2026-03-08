-- Open concorsi filtering index
-- Supports queries that always filter by is_active=true and data_scadenza >= now
create index if not exists idx_concorsi_open_data_scadenza
  on public.concorsi (data_scadenza)
  where is_active = true;
