-- Encuesta de interés de productos para la tienda Retiru
-- Los usuarios pueden votar qué tipo de productos quieren ver en la tienda

create table if not exists public.shop_product_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  product_category text not null,
  interest_level int not null check (interest_level between 1 and 5),
  comments text,
  created_at timestamptz default now(),
  
  -- Evitar votos duplicados por usuario/sesión + categoría
  unique nulls not distinct (user_id, product_category),
  unique nulls not distinct (session_id, product_category)
);

-- Índices
create index idx_shop_interests_category on public.shop_product_interests(product_category);
create index idx_shop_interests_created on public.shop_product_interests(created_at desc);
create index idx_shop_interests_user on public.shop_product_interests(user_id) where user_id is not null;

-- RLS
alter table public.shop_product_interests enable row level security;

-- Cualquiera puede insertar (anónimo o autenticado)
create policy "Anyone can submit interest"
  on public.shop_product_interests for insert
  with check (true);

-- Los usuarios pueden ver solo sus propias respuestas
create policy "Users can view own responses"
  on public.shop_product_interests for select
  using (
    auth.uid() = user_id
    or session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Los admins pueden ver todo
create policy "Admins can view all"
  on public.shop_product_interests for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Función para obtener estadísticas agregadas (acceso público de solo lectura)
create or replace function public.get_shop_interest_stats()
returns table (
  category text,
  total_votes bigint,
  avg_interest numeric,
  level_1 bigint,
  level_2 bigint,
  level_3 bigint,
  level_4 bigint,
  level_5 bigint
) as $$
begin
  return query
  select
    product_category as category,
    count(*) as total_votes,
    round(avg(interest_level), 2) as avg_interest,
    count(*) filter (where interest_level = 1) as level_1,
    count(*) filter (where interest_level = 2) as level_2,
    count(*) filter (where interest_level = 3) as level_3,
    count(*) filter (where interest_level = 4) as level_4,
    count(*) filter (where interest_level = 5) as level_5
  from public.shop_product_interests
  group by product_category
  order by avg(interest_level) desc, count(*) desc;
end;
$$ language plpgsql security definer stable;
