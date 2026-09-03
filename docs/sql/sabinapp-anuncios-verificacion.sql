-- Sabinapp 1.0 - Verificación de base de datos para anuncios locales
-- Fecha: 2026-09-03
--
-- Ejecutar después de docs/sql/sabinapp-anuncios-base.sql

select
  'permission' as check_type,
  p.key,
  p.name,
  p.description
from public.permissions p
where p.key = 'admin.manage_ads';

select
  'role_permission' as check_type,
  r.key as role_key,
  p.key as permission_key
from public.role_permissions rp
join public.roles r on r.id = rp.role_id
join public.permissions p on p.id = rp.permission_id
where p.key = 'admin.manage_ads'
order by r.key;

select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ad_settings',
    'ad_campaigns',
    'ad_assets',
    'ad_impressions',
    'ad_clicks'
  )
order by table_name;

select
  id,
  fixed_banner_enabled,
  interstitial_enabled,
  interstitial_probability,
  interstitial_cooldown_minutes,
  interstitial_required_seconds,
  max_interstitials_per_session,
  max_assets_fixed_banner,
  max_assets_interstitial
from public.ad_settings;

select
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ad_settings',
    'ad_campaigns',
    'ad_assets',
    'ad_impressions',
    'ad_clicks'
  )
order by tablename, policyname;

select
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as result_type
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'get_public_ads',
    'is_active_public_ad_asset',
    'set_ad_updated_at'
  )
order by proname;

select *
from public.get_public_ads('home', null, false);
