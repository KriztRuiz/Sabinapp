-- =========================================================
-- Sabinapp 1.0 - Limpieza final de datos públicos
-- Fecha: 2026-08-30
-- =========================================================
--
-- Objetivo:
-- Desactivar items activos que pertenecían a negocios no públicos.
--
-- No elimina datos.
-- Sólo cambia business_items.is_active a false cuando el negocio padre
-- no debe mostrarse públicamente.
--
-- Resultado esperado después de aplicar:
-- - items_activos_de_negocios_no_publicos: 0
-- - items_publicamente_elegibles: 32
--
-- =========================================================

begin;

update public.business_items bi
set
  is_active = false,
  updated_at = now()
from public.businesses b
where b.id = bi.business_id
  and bi.is_active = true
  and (
    b.status <> 'published'::public.business_status
    or b.is_published = false
    or b.show_in_search = false
    or b.is_adult_content = true
    or (b.expires_at is not null and b.expires_at < now())
  );

commit;

-- =========================================================
-- Verificación consolidada
-- =========================================================

select
  'negocios_publicos_visibles' as revision,
  count(*) as total
from public.businesses
where status = 'published'::public.business_status
  and is_published = true
  and is_adult_content = false
  and show_in_search = true
  and (expires_at is null or expires_at >= now())

union all

select
  'no_publicados_con_banderas_publicas' as revision,
  count(*) as total
from public.businesses
where status <> 'published'::public.business_status
  and (
    is_published = true
    or show_in_home = true
    or show_in_search = true
  )

union all

select
  'adultos_visibles_por_error' as revision,
  count(*) as total
from public.businesses
where is_adult_content = true
  and (
    is_published = true
    or show_in_home = true
    or show_in_search = true
  )

union all

select
  'expirados_visibles_por_error' as revision,
  count(*) as total
from public.businesses
where expires_at is not null
  and expires_at < now()
  and (
    is_published = true
    or show_in_home = true
    or show_in_search = true
  )

union all

select
  'items_activos_de_negocios_no_publicos' as revision,
  count(*) as total
from public.business_items bi
join public.businesses b on b.id = bi.business_id
where bi.is_active = true
  and (
    b.status <> 'published'::public.business_status
    or b.is_published = false
    or b.show_in_search = false
    or b.is_adult_content = true
    or (b.expires_at is not null and b.expires_at < now())
  )

union all

select
  'items_publicamente_elegibles' as revision,
  count(*) as total
from public.business_items bi
join public.businesses b on b.id = bi.business_id
where bi.is_active = true
  and b.status = 'published'::public.business_status
  and b.is_published = true
  and b.show_in_search = true
  and b.is_adult_content = false
  and (b.expires_at is null or b.expires_at >= now())

union all

select
  'resenas_publicadas_de_negocios_no_publicos' as revision,
  count(*) as total
from public.reviews r
join public.businesses b on b.id = r.business_id
where r.status = 'published'::public.review_status
  and (
    b.status <> 'published'::public.business_status
    or b.is_published = false
    or b.show_reviews_publicly = false
    or b.is_adult_content = true
    or (b.expires_at is not null and b.expires_at < now())
  )

union all

select
  'comentarios_publicados_de_noticias_no_activas' as revision,
  count(*) as total
from public.news_comments nc
join public.local_news ln on ln.id = nc.news_id
where nc.status = 'published'::public.news_comment_status
  and (
    ln.is_active = false
    or (ln.expires_at is not null and ln.expires_at < now())
  )

union all

select
  'noticias_publicas_activas' as revision,
  count(*) as total
from public.local_news
where is_active = true
  and (expires_at is null or expires_at >= now())

union all

select
  'reportes_pendientes' as revision,
  count(*) as total
from public.reports
where status in (
  'new'::public.report_status,
  'in_review'::public.report_status
);
