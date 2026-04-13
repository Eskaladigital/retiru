-- Corrige unicidad de la encuesta de tienda: con UNIQUE NULLS NOT DISTINCT (user_id, product_category),
-- todas las filas anónimas (user_id NULL) chocaban entre sí por categoría.
-- Sustitución: índices únicos parciales (usuario logueado vs sesión anónima).

do $$
declare
  r text;
begin
  for r in
    select c.conname::text
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'shop_product_interests'
      and c.contype = 'u'
  loop
    execute format('alter table public.shop_product_interests drop constraint if exists %I', r);
  end loop;
end $$;

create unique index if not exists shop_product_interests_user_category_uq
  on public.shop_product_interests (user_id, product_category)
  where user_id is not null;

create unique index if not exists shop_product_interests_session_category_uq
  on public.shop_product_interests (session_id, product_category)
  where session_id is not null;
