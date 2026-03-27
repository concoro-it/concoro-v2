create or replace function public.get_regioni_with_count_active()
returns table(regione text, count bigint)
language sql
stable
as $$
  with parsed as (
    select
      case
        when jsonb_typeof(raw.elem) = 'string' then (raw.elem #>> '{}')::jsonb
        else raw.elem
      end as obj
    from public.concorsi c
    cross join lateral jsonb_array_elements(coalesce(to_jsonb(c.regioni_array), '[]'::jsonb)) as raw(elem)
    where c.is_active = true
      and c.data_scadenza >= now()
  )
  select
    coalesce(obj->'regione'->>'denominazione', obj->>'denominazione', obj->>'nome') as regione,
    count(*)::bigint as count
  from parsed
  where coalesce(obj->'regione'->>'denominazione', obj->>'denominazione', obj->>'nome') is not null
  group by 1
  order by 2 desc;
$$;

create or replace function public.get_province_with_count_active()
returns table(provincia text, sigla text, regione text, count bigint)
language sql
stable
as $$
  with parsed as (
    select
      case
        when jsonb_typeof(raw.elem) = 'string' then (raw.elem #>> '{}')::jsonb
        else raw.elem
      end as obj
    from public.concorsi c
    cross join lateral jsonb_array_elements(coalesce(to_jsonb(c.province_array), '[]'::jsonb)) as raw(elem)
    where c.is_active = true
      and c.data_scadenza >= now()
  ),
  normalized as (
    select
      coalesce(obj->'provincia'->>'denominazione', obj->>'denominazione', obj->>'nome') as provincia,
      coalesce(obj->'provincia'->>'sigla', obj->'provincia'->>'codice', obj->>'sigla', obj->>'codice') as sigla,
      coalesce(
        case
          when jsonb_typeof(obj->'regione') = 'string' then obj->>'regione'
          else obj->'regione'->>'denominazione'
        end,
        null
      ) as regione
    from parsed
  )
  select
    provincia,
    sigla,
    max(regione)::text as regione,
    count(*)::bigint as count
  from normalized
  where provincia is not null
    and sigla is not null
    and btrim(provincia) <> ''
    and btrim(sigla) <> ''
  group by provincia, sigla
  order by count desc, provincia asc;
$$;

create or replace function public.get_enti_with_count_active()
returns table(ente_nome text, ente_slug text, count bigint)
language sql
stable
as $$
  select
    coalesce(c.ente_nome, '')::text as ente_nome,
    c.ente_slug::text as ente_slug,
    count(*)::bigint as count
  from public.concorsi c
  where c.is_active = true
    and c.data_scadenza >= now()
    and c.ente_slug is not null
  group by c.ente_slug, c.ente_nome
  order by count desc, ente_nome asc;
$$;
