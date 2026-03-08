create or replace function public.get_regioni_with_count()
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
  )
  select
    coalesce(obj->'regione'->>'denominazione', obj->>'denominazione') as regione,
    count(*)::bigint as count
  from parsed
  where coalesce(obj->'regione'->>'denominazione', obj->>'denominazione') is not null
  group by 1
  order by 2 desc;
$$;

create or replace function public.get_settori_with_count()
returns table(settore text, count bigint)
language sql
stable
as $$
  select
    settore,
    count(*)::bigint as count
  from public.concorsi c
  cross join lateral unnest(coalesce(c.settori, array[]::text[])) as settore
  where c.is_active = true
    and settore is not null
    and btrim(settore) <> ''
  group by 1
  order by 2 desc;
$$;
