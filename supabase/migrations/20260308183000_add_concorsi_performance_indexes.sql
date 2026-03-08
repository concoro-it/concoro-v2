-- Performance indexes for concorsi list/filter queries.
-- Safe to run multiple times thanks to IF NOT EXISTS.

create index if not exists idx_concorsi_is_active_data_scadenza
  on public.concorsi (is_active, data_scadenza);

create index if not exists idx_concorsi_data_scadenza
  on public.concorsi (data_scadenza);

create index if not exists idx_concorsi_is_active_data_pubblicazione
  on public.concorsi (is_active, data_pubblicazione desc);

create index if not exists idx_concorsi_ente_slug_is_active_data_scadenza
  on public.concorsi (ente_slug, is_active, data_scadenza);

create index if not exists idx_concorsi_tipo_procedura_is_active_data_scadenza
  on public.concorsi (tipo_procedura, is_active, data_scadenza);

create index if not exists idx_concorsi_settori_gin
  on public.concorsi using gin (settori);
