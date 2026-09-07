-- Sabinapp 1.0 - Permitir anuncios propios en paginas de negocio
-- Fecha: 2026-09-07
--
-- Objetivo:
-- Actualizar get_public_ads para que una campana activa pueda mostrarse
-- tambien dentro de la pagina publica del negocio anunciante.
--
-- Importante:
-- - Campana B sigue apagada por configuracion.
-- - current_business_id se conserva como parametro para metricas/futuras reglas.
-- - No se prepara despliegue con este archivo.

begin;

create or replace function public.get_public_ads(
  requested_placement text,
  current_business_id uuid default null,
  include_interstitial boolean default false
)
returns table (
  campaign_id uuid,
  campaign_type public.ad_campaign_type,
  title text,
  description text,
  target_label text,
  target_url text,
  advertiser_business_id uuid,
  priority integer,
  probability_weight numeric,
  asset_id uuid,
  asset_type public.ad_asset_type,
  asset_url text,
  asset_alt_text text,
  asset_sort_order integer,
  asset_duration_seconds integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as campaign_id,
    c.campaign_type,
    c.title,
    c.description,
    c.target_label,
    c.target_url,
    c.advertiser_business_id,
    c.priority,
    c.probability_weight,
    a.id as asset_id,
    a.asset_type,
    a.url as asset_url,
    a.alt_text as asset_alt_text,
    a.sort_order as asset_sort_order,
    a.duration_seconds as asset_duration_seconds
  from public.ad_campaigns c
  join public.ad_assets a
    on a.campaign_id = c.id
  cross join public.ad_settings s
  where c.status = 'active'
    and a.is_active = true
    and requested_placement = any(c.placement_scope)
    and (
      c.starts_at is null
      or c.starts_at <= now()
    )
    and (
      c.ends_at is null
      or c.ends_at >= now()
    )
    and (
      (
        c.campaign_type = 'fixed_banner'
        and s.fixed_banner_enabled = true
      )
      or (
        c.campaign_type = 'interstitial'
        and s.interstitial_enabled = true
        and include_interstitial = true
      )
    )
  order by
    c.priority desc,
    c.created_at desc,
    a.sort_order asc,
    a.created_at asc;
$$;

revoke all on function public.get_public_ads(text, uuid, boolean) from public;
grant execute on function public.get_public_ads(text, uuid, boolean) to anon;
grant execute on function public.get_public_ads(text, uuid, boolean) to authenticated;

commit;

-- Verificacion esperada:
-- business_profile_same_business_rows debe ser mayor que 0.
-- own_ad_rows debe ser mayor que 0 si la campana demo de Taqueria El Primo sigue activa.

with target_business as (
  select id
  from public.businesses
  where slug = 'taqueria-el-primo'
  limit 1
),
same_business_ads as (
  select *
  from public.get_public_ads(
    'business_profile',
    (select id from target_business),
    false
  )
),
home_ads as (
  select *
  from public.get_public_ads('home', null, false)
)
select
  (select id from target_business) as target_business_id,
  (select count(*) from same_business_ads) as business_profile_same_business_rows,
  (
    select count(*)
    from same_business_ads
    where advertiser_business_id = (select id from target_business)
  ) as own_ad_rows,
  (select count(*) from home_ads) as home_rows;
