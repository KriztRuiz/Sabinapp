-- Sabinapp 1.0 - Política admin para local_news
-- Estado: aplicar en Supabase SQL Editor
-- Objetivo:
-- Permitir que usuarios admin puedan insertar, actualizar y administrar noticias
-- desde endpoints protegidos, sin abrir escritura pública.

begin;

drop policy if exists local_news_manage_admin on public.local_news;

create policy local_news_manage_admin
on public.local_news
for all
to authenticated
using (
  public.has_role('admin')
)
with check (
  public.has_role('admin')
);

grant select, insert, update, delete on public.local_news to authenticated;

commit;

-- Verificación:
--
-- select
--   tablename,
--   policyname,
--   roles,
--   cmd,
--   qual,
--   with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'local_news'
-- order by policyname;
