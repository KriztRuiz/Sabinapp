-- Sabinapp 1.0 - Base de datos para anuncios locales
-- Fecha: 2026-09-03
--
-- Objetivo:
-- Crear la base inicial para campañas publicitarias locales moderadas.
--
-- Importante:
-- - Este SQL no activa anuncios automáticamente.
-- - Campaña B queda apagada por defecto.
-- - Sólo admin recibe el permiso admin.manage_ads.
-- - No se prepara despliegue con este archivo.

begin;

-- =========================================================
-- 1. Permiso administrativo específico para anuncios
-- =========================================================

insert into public.permissions (
  key,
  name,
  description
)
values (
  'admin.manage_ads',
  'Administrar anuncios',
  'Permite crear, revisar, activar, pausar y archivar campañas publicitarias locales.'
)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.role_permissions (
  role_id,
  permission_id
)
select
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.key = 'admin'
  and p.key = 'admin.manage_ads'
on conflict do nothing;

-- =========================================================
-- 2. Tipos controlados
-- =========================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ad_campaign_type'
  ) then
    create type public.ad_campaign_type as enum (
      'fixed_banner',
      'interstitial'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ad_campaign_status'
  ) then
    create type public.ad_campaign_status as enum (
      'draft',
      'pending_review',
      'approved',
      'active',
      'paused',
      'expired',
      'rejected',
      'archived'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'ad_asset_type'
  ) then
    create type public.ad_asset_type as enum (
      'image',
      'video'
    );
  end if;
end $$;

-- =========================================================
-- 3. Función local para updated_at de anuncios
-- =========================================================

create or replace function public.set_ad_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 4. Configuración global de anuncios
-- =========================================================

create table if not exists public.ad_settings (
  id boolean primary key default true,
  fixed_banner_enabled boolean not null default true,
  interstitial_enabled boolean not null default false,
  interstitial_probability numeric(5, 4) not null default 0.1250,
  interstitial_cooldown_minutes integer not null default 30,
  interstitial_required_seconds integer not null default 10,
  max_interstitials_per_session integer not null default 1,
  max_assets_fixed_banner integer not null default 5,
  max_assets_interstitial integer not null default 6,
  max_image_size_kb integer not null default 500,
  max_video_size_kb integer not null default 8000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ad_settings_single_row check (id = true),
  constraint ad_settings_probability_range check (
    interstitial_probability >= 0
    and interstitial_probability <= 1
  ),
  constraint ad_settings_cooldown_valid check (
    interstitial_cooldown_minutes >= 0
  ),
  constraint ad_settings_required_seconds_valid check (
    interstitial_required_seconds >= 0
    and interstitial_required_seconds <= 60
  ),
  constraint ad_settings_max_interstitials_valid check (
    max_interstitials_per_session >= 0
    and max_interstitials_per_session <= 10
  ),
  constraint ad_settings_max_assets_fixed_valid check (
    max_assets_fixed_banner >= 1
    and max_assets_fixed_banner <= 10
  ),
  constraint ad_settings_max_assets_interstitial_valid check (
    max_assets_interstitial >= 1
    and max_assets_interstitial <= 10
  ),
  constraint ad_settings_max_image_size_valid check (
    max_image_size_kb >= 50
    and max_image_size_kb <= 5000
  ),
  constraint ad_settings_max_video_size_valid check (
    max_video_size_kb >= 500
    and max_video_size_kb <= 50000
  )
);

drop trigger if exists set_ad_settings_updated_at on public.ad_settings;

create trigger set_ad_settings_updated_at
before update on public.ad_settings
for each row
execute function public.set_ad_updated_at();

insert into public.ad_settings (id)
values (true)
on conflict (id) do update
set updated_at = now();

-- =========================================================
-- 5. Campañas
-- =========================================================

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),

  advertiser_business_id uuid null references public.businesses(id) on delete set null,

  title text not null,
  description text null,

  campaign_type public.ad_campaign_type not null,
  status public.ad_campaign_status not null default 'draft',

  price_mxn numeric(10, 2) not null default 0,

  starts_at timestamptz null,
  ends_at timestamptz null,

  target_label text null,
  target_url text null,

  placement_scope text[] not null default array[
    'home',
    'negocios',
    'productos',
    'noticias',
    'clima',
    'business_profile'
  ]::text[],

  priority integer not null default 0,
  probability_weight numeric(8, 4) not null default 1,

  max_impressions integer null,
  max_clicks integer null,

  created_by uuid null references public.profiles(id) on delete set null,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  reviewed_at timestamptz null,
  rejection_reason text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ad_campaigns_title_length check (
    char_length(trim(title)) between 3 and 120
  ),
  constraint ad_campaigns_description_length check (
    description is null
    or char_length(description) <= 500
  ),
  constraint ad_campaigns_price_valid check (
    price_mxn >= 0
  ),
  constraint ad_campaigns_date_range_valid check (
    starts_at is null
    or ends_at is null
    or ends_at >= starts_at
  ),
  constraint ad_campaigns_target_label_length check (
    target_label is null
    or char_length(target_label) <= 80
  ),
  constraint ad_campaigns_target_url_safe check (
    target_url is null
    or (
      target_url ~* '^https?://'
      and target_url !~* '^\s*javascript:'
    )
  ),
  constraint ad_campaigns_placement_scope_valid check (
    cardinality(placement_scope) > 0
    and placement_scope <@ array[
      'home',
      'negocios',
      'productos',
      'noticias',
      'clima',
      'business_profile'
    ]::text[]
  ),
  constraint ad_campaigns_probability_weight_valid check (
    probability_weight > 0
  ),
  constraint ad_campaigns_max_impressions_valid check (
    max_impressions is null
    or max_impressions > 0
  ),
  constraint ad_campaigns_max_clicks_valid check (
    max_clicks is null
    or max_clicks > 0
  ),
  constraint ad_campaigns_rejection_reason_length check (
    rejection_reason is null
    or char_length(rejection_reason) <= 500
  )
);

drop trigger if exists set_ad_campaigns_updated_at on public.ad_campaigns;

create trigger set_ad_campaigns_updated_at
before update on public.ad_campaigns
for each row
execute function public.set_ad_updated_at();

-- =========================================================
-- 6. Recursos visuales de anuncios
-- =========================================================

create table if not exists public.ad_assets (
  id uuid primary key default gen_random_uuid(),

  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,

  asset_type public.ad_asset_type not null,
  url text not null,
  alt_text text null,
  sort_order integer not null default 0,
  duration_seconds integer null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ad_assets_url_safe check (
    url ~* '^https?://'
    and url !~* '^\s*javascript:'
  ),
  constraint ad_assets_alt_text_length check (
    alt_text is null
    or char_length(alt_text) <= 160
  ),
  constraint ad_assets_sort_order_valid check (
    sort_order >= 0
  ),
  constraint ad_assets_duration_valid check (
    duration_seconds is null
    or (
      duration_seconds >= 1
      and duration_seconds <= 60
    )
  )
);

drop trigger if exists set_ad_assets_updated_at on public.ad_assets;

create trigger set_ad_assets_updated_at
before update on public.ad_assets
for each row
execute function public.set_ad_updated_at();

-- =========================================================
-- 7. Métricas mínimas
-- =========================================================

create table if not exists public.ad_impressions (
  id uuid primary key default gen_random_uuid(),

  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  asset_id uuid null references public.ad_assets(id) on delete set null,

  page_path text not null,
  business_id uuid null references public.businesses(id) on delete set null,
  session_key text not null,

  shown_at timestamptz not null default now(),

  constraint ad_impressions_page_path_valid check (
    page_path = '/'
    or page_path in (
      '/negocios',
      '/productos',
      '/noticias',
      '/clima'
    )
    or page_path ~ '^/negocio/[^/]+$'
  ),
  constraint ad_impressions_session_key_length check (
    char_length(session_key) between 8 and 200
  )
);

create table if not exists public.ad_clicks (
  id uuid primary key default gen_random_uuid(),

  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  asset_id uuid null references public.ad_assets(id) on delete set null,

  page_path text not null,
  business_id uuid null references public.businesses(id) on delete set null,
  session_key text not null,

  clicked_at timestamptz not null default now(),

  constraint ad_clicks_page_path_valid check (
    page_path = '/'
    or page_path in (
      '/negocios',
      '/productos',
      '/noticias',
      '/clima'
    )
    or page_path ~ '^/negocio/[^/]+$'
  ),
  constraint ad_clicks_session_key_length check (
    char_length(session_key) between 8 and 200
  )
);

-- =========================================================
-- 8. Índices básicos
-- =========================================================

create index if not exists ad_campaigns_status_type_idx
on public.ad_campaigns (status, campaign_type);

create index if not exists ad_campaigns_dates_idx
on public.ad_campaigns (starts_at, ends_at);

create index if not exists ad_campaigns_advertiser_business_idx
on public.ad_campaigns (advertiser_business_id);

create index if not exists ad_campaigns_placement_scope_idx
on public.ad_campaigns
using gin (placement_scope);

create index if not exists ad_assets_campaign_active_sort_idx
on public.ad_assets (campaign_id, is_active, sort_order);

create index if not exists ad_impressions_campaign_shown_at_idx
on public.ad_impressions (campaign_id, shown_at desc);

create index if not exists ad_impressions_page_path_shown_at_idx
on public.ad_impressions (page_path, shown_at desc);

create index if not exists ad_clicks_campaign_clicked_at_idx
on public.ad_clicks (campaign_id, clicked_at desc);

create index if not exists ad_clicks_page_path_clicked_at_idx
on public.ad_clicks (page_path, clicked_at desc);

-- =========================================================
-- 9. Función pública segura para leer anuncios visibles
-- =========================================================

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

create or replace function public.is_active_public_ad_asset(
  target_campaign_id uuid,
  target_asset_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ad_campaigns c
    left join public.ad_assets a
      on a.campaign_id = c.id
    cross join public.ad_settings s
    where c.id = target_campaign_id
      and (
        target_asset_id is null
        or a.id = target_asset_id
      )
      and c.status = 'active'
      and (
        target_asset_id is null
        or a.is_active = true
      )
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
        )
      )
  );
$$;

-- =========================================================
-- 10. Seguridad RLS
-- =========================================================

alter table public.ad_settings enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_assets enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_clicks enable row level security;

drop policy if exists ad_settings_select_public on public.ad_settings;
drop policy if exists ad_settings_manage_admin on public.ad_settings;

create policy ad_settings_select_public
on public.ad_settings
for select
to anon, authenticated
using (true);

create policy ad_settings_manage_admin
on public.ad_settings
for all
to authenticated
using (public.has_permission('admin.manage_ads'))
with check (public.has_permission('admin.manage_ads'));

drop policy if exists ad_campaigns_manage_admin on public.ad_campaigns;

create policy ad_campaigns_manage_admin
on public.ad_campaigns
for all
to authenticated
using (public.has_permission('admin.manage_ads'))
with check (public.has_permission('admin.manage_ads'));

drop policy if exists ad_assets_manage_admin on public.ad_assets;

create policy ad_assets_manage_admin
on public.ad_assets
for all
to authenticated
using (public.has_permission('admin.manage_ads'))
with check (public.has_permission('admin.manage_ads'));

drop policy if exists ad_impressions_insert_public_active_ads on public.ad_impressions;
drop policy if exists ad_impressions_manage_admin on public.ad_impressions;

create policy ad_impressions_insert_public_active_ads
on public.ad_impressions
for insert
to anon, authenticated
with check (
  public.is_active_public_ad_asset(campaign_id, asset_id)
);

create policy ad_impressions_manage_admin
on public.ad_impressions
for all
to authenticated
using (public.has_permission('admin.manage_ads'))
with check (public.has_permission('admin.manage_ads'));

drop policy if exists ad_clicks_insert_public_active_ads on public.ad_clicks;
drop policy if exists ad_clicks_manage_admin on public.ad_clicks;

create policy ad_clicks_insert_public_active_ads
on public.ad_clicks
for insert
to anon, authenticated
with check (
  public.is_active_public_ad_asset(campaign_id, asset_id)
);

create policy ad_clicks_manage_admin
on public.ad_clicks
for all
to authenticated
using (public.has_permission('admin.manage_ads'))
with check (public.has_permission('admin.manage_ads'));

-- =========================================================
-- 11. Grants
-- =========================================================

grant select on public.ad_settings to anon;
grant select on public.ad_settings to authenticated;

grant select, insert, update, delete on public.ad_settings to authenticated;
grant select, insert, update, delete on public.ad_campaigns to authenticated;
grant select, insert, update, delete on public.ad_assets to authenticated;
grant select, insert, update, delete on public.ad_impressions to authenticated;
grant select, insert, update, delete on public.ad_clicks to authenticated;

grant insert on public.ad_impressions to anon;
grant insert on public.ad_clicks to anon;

revoke all on function public.get_public_ads(text, uuid, boolean) from public;
grant execute on function public.get_public_ads(text, uuid, boolean) to anon;
grant execute on function public.get_public_ads(text, uuid, boolean) to authenticated;

revoke all on function public.is_active_public_ad_asset(uuid, uuid) from public;
grant execute on function public.is_active_public_ad_asset(uuid, uuid) to anon;
grant execute on function public.is_active_public_ad_asset(uuid, uuid) to authenticated;

-- =========================================================

commit;
