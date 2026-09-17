-- =========================================================
-- SABINAPP 1.0
-- 118E-4 - SUPABASE STORAGE
--
-- Migración incremental para:
-- - imágenes de negocios;
-- - imágenes de productos/servicios;
-- - assets de publicidad Campaña A;
-- - políticas Storage;
-- - RPC publicitarias basadas en Storage;
-- - hardening de escritura de ad_assets.
--
-- PRECONDICIONES:
-- - tablas businesses, business_media, business_items;
-- - tablas ad_campaigns, ad_assets, ad_payments, ad_settings;
-- - tipos ad_campaign_type, ad_campaign_status, ad_asset_type;
-- - función get_ad_contact_target_url(...);
-- - función set_ad_updated_at().
--
-- Este archivo NO elimina los assets históricos URL-only.
-- Se conservan para preservar métricas e historial.
-- =========================================================


begin;


-- =========================================================
-- 1. BUCKETS
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'business-media',
    'business-media',
    true,
    5242880,
    array[
      'image/jpeg',
      'image/png',
      'image/webp'
    ]::text[]
  ),
  (
    'ad-assets',
    'ad-assets',
    true,
    16777216,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm'
    ]::text[]
  )
on conflict (id)
do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =========================================================
-- 2. COLUMNAS STORAGE
-- =========================================================

alter table public.business_media
  add column if not exists storage_bucket text,
  add column if not exists storage_path text;

alter table public.business_items
  add column if not exists image_storage_bucket text,
  add column if not exists image_storage_path text;

alter table public.ad_assets
  add column if not exists storage_bucket text,
  add column if not exists storage_path text;


-- Permitir migración progresiva desde URLs históricas.
alter table public.business_media
  alter column url drop not null;

alter table public.business_items
  alter column image_url drop not null;

alter table public.ad_assets
  alter column url drop not null;


-- =========================================================
-- 3. CONSTRAINTS BUSINESS MEDIA
-- =========================================================

alter table public.business_media
  drop constraint if exists business_media_storage_pair_check;

alter table public.business_media
  add constraint business_media_storage_pair_check
  check (
    (
      storage_bucket is null
      and storage_path is null
    )
    or
    (
      storage_bucket is not null
      and btrim(storage_bucket) <> ''
      and storage_path is not null
      and btrim(storage_path) <> ''
    )
  );


alter table public.business_media
  drop constraint if exists business_media_source_required_check;

alter table public.business_media
  add constraint business_media_source_required_check
  check (
    (
      url is not null
      and btrim(url) <> ''
    )
    or
    (
      storage_bucket is not null
      and btrim(storage_bucket) <> ''
      and storage_path is not null
      and btrim(storage_path) <> ''
    )
  );


-- =========================================================
-- 4. CONSTRAINTS BUSINESS ITEMS
-- =========================================================

alter table public.business_items
  drop constraint if exists business_items_storage_pair_check;

alter table public.business_items
  add constraint business_items_storage_pair_check
  check (
    (
      image_storage_bucket is null
      and image_storage_path is null
    )
    or
    (
      image_storage_bucket is not null
      and btrim(image_storage_bucket) <> ''
      and image_storage_path is not null
      and btrim(image_storage_path) <> ''
    )
  );


-- =========================================================
-- 5. CONSTRAINTS AD ASSETS
-- =========================================================

alter table public.ad_assets
  drop constraint if exists ad_assets_storage_pair_check;

alter table public.ad_assets
  add constraint ad_assets_storage_pair_check
  check (
    (
      storage_bucket is null
      and storage_path is null
    )
    or
    (
      storage_bucket is not null
      and btrim(storage_bucket) <> ''
      and storage_path is not null
      and btrim(storage_path) <> ''
    )
  );


alter table public.ad_assets
  drop constraint if exists ad_assets_source_required_check;

alter table public.ad_assets
  add constraint ad_assets_source_required_check
  check (
    (
      url is not null
      and btrim(url) <> ''
    )
    or
    (
      storage_bucket is not null
      and btrim(storage_bucket) <> ''
      and storage_path is not null
      and btrim(storage_path) <> ''
    )
  );


-- =========================================================
-- 6. POLITICAS STORAGE - BUSINESS MEDIA
-- =========================================================

drop policy if exists business_media_owner_select
on storage.objects;

drop policy if exists business_media_owner_insert
on storage.objects;

drop policy if exists business_media_owner_update
on storage.objects;

drop policy if exists business_media_owner_delete
on storage.objects;


create policy business_media_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


create policy business_media_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


create policy business_media_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
)
with check (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


create policy business_media_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'business-media'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


-- =========================================================
-- 7. POLITICAS STORAGE - AD ASSETS
-- =========================================================

drop policy if exists ad_assets_owner_select
on storage.objects;

drop policy if exists ad_assets_owner_insert
on storage.objects;

drop policy if exists ad_assets_owner_update
on storage.objects;

drop policy if exists ad_assets_owner_delete
on storage.objects;


create policy ad_assets_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ad-assets'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


create policy ad_assets_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ad-assets'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


create policy ad_assets_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'ad-assets'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
)
with check (
  bucket_id = 'ad-assets'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


create policy ad_assets_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ad-assets'
  and exists (
    select 1
    from public.businesses b
    where b.owner_id = auth.uid()
      and b.id::text =
        (storage.foldername(storage.objects.name))[1]
  )
);


-- =========================================================
-- 8. TRIGGER: UNA SOLA IMAGEN ACTIVA EN FIXED BANNER
-- =========================================================

create or replace function public.enforce_requested_ad_single_asset()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  campaign_row record;
begin

  select
    c.campaign_type,
    c.requested_days
  into campaign_row
  from public.ad_campaigns c
  where c.id = new.campaign_id;

  if not found then
    return new;
  end if;


  if campaign_row.campaign_type =
     'fixed_banner'::public.ad_campaign_type then

    if new.asset_type <>
       'image'::public.ad_asset_type then

      raise exception
        'Los anuncios fijos sólo admiten imágenes.';

    end if;


    if new.is_active = true
       and exists (
         select 1
         from public.ad_assets a
         where a.campaign_id = new.campaign_id
           and a.id <> new.id
           and a.is_active = true
       ) then

      raise exception
        'Los anuncios fijos sólo pueden tener una imagen activa.';

    end if;

  end if;


  return new;

end;
$function$;


drop trigger if exists
  enforce_requested_ad_single_asset_trigger
on public.ad_assets;

create trigger enforce_requested_ad_single_asset_trigger
before insert or update
on public.ad_assets
for each row
execute function public.enforce_requested_ad_single_asset();


-- =========================================================
-- 9. RPC PUBLICA DE LECTURA
-- =========================================================

create or replace function public.get_public_ads_storage(
  requested_placement text,
  current_business_id uuid default null::uuid,
  include_interstitial boolean default false
)
returns table(
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
  asset_storage_bucket text,
  asset_storage_path text,
  asset_alt_text text,
  asset_sort_order integer,
  asset_duration_seconds integer
)
language sql
stable
security definer
set search_path to 'public'
as $function$

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
    a.storage_bucket as asset_storage_bucket,
    a.storage_path as asset_storage_path,
    a.alt_text as asset_alt_text,
    a.sort_order as asset_sort_order,
    a.duration_seconds as asset_duration_seconds

  from public.ad_campaigns c

  join public.ad_assets a
    on a.campaign_id = c.id

  cross join public.ad_settings s

  where c.status = 'active'

    and a.is_active = true

    and requested_placement =
        any(c.placement_scope)

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

      or

      (
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

$function$;


-- =========================================================
-- 10. RPC: CREAR CAMPAÑA A CON STORAGE
-- =========================================================

create or replace function public.submit_ad_request_storage(
  p_business_id uuid,
  p_title text,
  p_description text,
  p_requested_days integer,
  p_start_mode text,
  p_requested_start_at timestamp with time zone,
  p_target_kind text,
  p_target_contact_method_id uuid,
  p_storage_bucket text,
  p_storage_path text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  current_user_id uuid;

  business_row record;
  contact_row record;

  clean_title text;
  clean_description text;

  clean_storage_bucket text;
  clean_storage_path text;

  storage_metadata jsonb;
  storage_mime_type text;
  storage_size_bytes bigint;

  resolved_target_url text;
  resolved_target_label text;

  new_campaign_id uuid;

  final_requested_start_at timestamptz;
begin

  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'Debes iniciar sesión para solicitar un anuncio.';
  end if;


  if not exists (
    select 1
    from public.profiles p
    where p.id = current_user_id
      and p.status = 'active'
      and p.profile_completed_at is not null
  ) then
    raise exception
      'Debes tener un perfil activo y completo para solicitar anuncios.';
  end if;


  select
    b.id,
    b.name,
    b.slug,
    b.owner_id,
    b.status,
    b.is_published,
    b.expires_at
  into business_row
  from public.businesses b
  where b.id = p_business_id
    and b.owner_id = current_user_id
    and b.status = 'published'
    and b.is_published = true
    and (
      b.expires_at is null
      or b.expires_at >= now()
    )
  limit 1;

  if not found then
    raise exception
      'Sólo puedes solicitar anuncios para uno de tus negocios publicados.';
  end if;


  clean_title := trim(coalesce(p_title, ''));

  if char_length(clean_title) < 3
     or char_length(clean_title) > 120 then
    raise exception
      'El título debe tener entre 3 y 120 caracteres.';
  end if;


  clean_description :=
    nullif(trim(coalesce(p_description, '')), '');

  if clean_description is not null
     and char_length(clean_description) > 500 then
    raise exception
      'La descripción no puede superar 500 caracteres.';
  end if;


  if p_requested_days is null
     or p_requested_days < 1 then
    raise exception
      'Debes contratar al menos un día de publicidad.';
  end if;


  if p_start_mode not in ('asap', 'scheduled') then
    raise exception
      'La opción de inicio seleccionada no es válida.';
  end if;

  if p_start_mode = 'asap' then
    final_requested_start_at := null;
  else
    if p_requested_start_at is null then
      raise exception
        'Debes seleccionar fecha y hora para un anuncio programado.';
    end if;

    if p_requested_start_at <= now() then
      raise exception
        'La fecha y hora solicitadas deben estar en el futuro.';
    end if;

    final_requested_start_at :=
      p_requested_start_at;
  end if;


  clean_storage_bucket :=
    trim(coalesce(p_storage_bucket, ''));

  clean_storage_path :=
    trim(
      both '/'
      from trim(coalesce(p_storage_path, ''))
    );

  if clean_storage_bucket <> 'ad-assets' then
    raise exception
      'El archivo del anuncio debe almacenarse en ad-assets.';
  end if;

  if clean_storage_path = '' then
    raise exception
      'No se recibió la ruta del archivo del anuncio.';
  end if;

  if split_part(clean_storage_path, '/', 1)
     <> p_business_id::text then
    raise exception
      'La ruta Storage no pertenece al negocio seleccionado.';
  end if;


  select o.metadata
  into storage_metadata
  from storage.objects o
  where o.bucket_id = clean_storage_bucket
    and o.name = clean_storage_path
  limit 1;

  if not found then
    raise exception
      'No se encontró el archivo del anuncio en Storage.';
  end if;


  storage_mime_type :=
    lower(
      coalesce(
        storage_metadata ->> 'mimetype',
        ''
      )
    );

  storage_size_bytes :=
    coalesce(
      nullif(
        storage_metadata ->> 'size',
        ''
      )::bigint,
      0
    );


  if storage_mime_type not in (
    'image/jpeg',
    'image/png',
    'image/webp'
  ) then
    raise exception
      'Campaña A sólo acepta imágenes JPEG, PNG o WebP.';
  end if;

  if storage_size_bytes <= 0 then
    raise exception
      'El archivo del anuncio está vacío o no tiene tamaño válido.';
  end if;

  if storage_size_bytes > (1000 * 1024) then
    raise exception
      'La imagen del anuncio no puede superar 1000 KB.';
  end if;


  if p_target_kind = 'business_page' then

    if p_target_contact_method_id is not null then
      raise exception
        'La página del negocio no requiere seleccionar un contacto.';
    end if;

    resolved_target_url :=
      '/negocio/' || business_row.slug;

    resolved_target_label :=
      'Ver negocio';


  elsif p_target_kind = 'contact' then

    if p_target_contact_method_id is null then
      raise exception
        'Debes seleccionar un contacto del negocio.';
    end if;

    select
      cm.id,
      cm.type,
      cm.label
    into contact_row
    from public.contact_methods cm
    where cm.id = p_target_contact_method_id
      and cm.business_id = p_business_id
      and cm.is_active = true
      and cm.is_approved = true
    limit 1;

    if not found then
      raise exception
        'El contacto seleccionado no está disponible para este negocio.';
    end if;

    resolved_target_url :=
      public.get_ad_contact_target_url(
        p_business_id,
        p_target_contact_method_id
      );

    resolved_target_label :=
      left(
        coalesce(
          nullif(trim(contact_row.label), ''),
          case lower(contact_row.type::text)
            when 'whatsapp' then 'WhatsApp'
            when 'phone' then 'Llamar'
            when 'email' then 'Enviar correo'
            when 'facebook' then 'Facebook'
            when 'instagram' then 'Instagram'
            when 'tiktok' then 'TikTok'
            when 'x' then 'X'
            when 'messenger' then 'Messenger'
            when 'website' then 'Sitio web'
            else 'Contactar'
          end
        ),
        80
      );

  else

    raise exception
      'El destino seleccionado no es válido.';

  end if;


  insert into public.ad_campaigns (
    advertiser_business_id,
    title,
    description,
    campaign_type,
    status,
    price_mxn,
    requested_days,
    daily_price_mxn,
    start_mode,
    requested_start_at,
    starts_at,
    ends_at,
    target_kind,
    target_contact_method_id,
    target_label,
    target_url,
    placement_scope,
    priority,
    probability_weight,
    created_by,
    submitted_at,
    reviewed_by,
    reviewed_at,
    rejection_reason,
    correction_requested_at,
    correction_notes
  )
  values (
    p_business_id,
    clean_title,
    clean_description,
    'fixed_banner'::public.ad_campaign_type,
    'pending_review'::public.ad_campaign_status,
    p_requested_days * 50,
    p_requested_days,
    50,
    p_start_mode,
    final_requested_start_at,
    null,
    null,
    p_target_kind,
    case
      when p_target_kind = 'contact'
        then p_target_contact_method_id
      else null
    end,
    resolved_target_label,
    resolved_target_url,
    array[
      'home',
      'negocios',
      'productos',
      'noticias',
      'clima',
      'business_profile'
    ]::text[],
    0,
    1,
    current_user_id,
    now(),
    null,
    null,
    null,
    null,
    null
  )
  returning id
  into new_campaign_id;


  insert into public.ad_assets (
    campaign_id,
    asset_type,
    url,
    storage_bucket,
    storage_path,
    alt_text,
    sort_order,
    duration_seconds,
    is_active
  )
  values (
    new_campaign_id,
    'image'::public.ad_asset_type,
    null,
    clean_storage_bucket,
    clean_storage_path,
    left(
      clean_title ||
      ' - anuncio de ' ||
      business_row.name,
      160
    ),
    0,
    null,
    true
  );


  return new_campaign_id;

end;
$function$;


-- =========================================================
-- 11. RPC: REENVIAR CORRECCION DE CAMPAÑA A
-- =========================================================

create or replace function public.resubmit_ad_request_storage(
  p_campaign_id uuid,
  p_title text,
  p_description text,
  p_requested_days integer,
  p_start_mode text,
  p_requested_start_at timestamp with time zone,
  p_target_kind text,
  p_target_contact_method_id uuid,
  p_storage_bucket text,
  p_storage_path text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  current_user_id uuid;

  campaign_row record;
  business_row record;
  contact_row record;

  clean_title text;
  clean_description text;

  clean_storage_bucket text;
  clean_storage_path text;

  storage_metadata jsonb;
  storage_mime_type text;
  storage_size_bytes bigint;

  final_requested_start_at timestamptz;

  resolved_target_url text;
  resolved_target_label text;

  existing_asset_id uuid;
  asset_count bigint;
begin

  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception
      'Debes iniciar sesión para corregir un anuncio.';
  end if;


  if not exists (
    select 1
    from public.profiles p
    where p.id = current_user_id
      and p.status = 'active'
      and p.profile_completed_at is not null
  ) then
    raise exception
      'Debes tener un perfil activo y completo.';
  end if;


  select
    c.id,
    c.advertiser_business_id,
    c.campaign_type,
    c.status,
    c.requested_days,
    c.correction_requested_at
  into campaign_row
  from public.ad_campaigns c
  where c.id = p_campaign_id
  for update;

  if not found then
    raise exception
      'No se encontró el anuncio.';
  end if;


  if campaign_row.campaign_type <>
     'fixed_banner'::public.ad_campaign_type then
    raise exception
      'Este tipo de campaña no puede editarse desde este formulario.';
  end if;


  if campaign_row.requested_days is null then
    raise exception
      'Este anuncio pertenece al modelo anterior.';
  end if;


  if campaign_row.status <>
       'draft'::public.ad_campaign_status
     or campaign_row.correction_requested_at is null then
    raise exception
      'Este anuncio no está disponible para correcciones.';
  end if;


  if exists (
    select 1
    from public.ad_payments p
    where p.campaign_id = p_campaign_id
  ) then
    raise exception
      'No se puede modificar un anuncio que ya tiene un pago asociado.';
  end if;


  select
    b.id,
    b.name,
    b.slug,
    b.owner_id,
    b.status,
    b.is_published,
    b.expires_at
  into business_row
  from public.businesses b
  where b.id = campaign_row.advertiser_business_id
    and b.owner_id = current_user_id
    and b.status = 'published'
    and b.is_published = true
    and (
      b.expires_at is null
      or b.expires_at >= now()
    )
  limit 1;

  if not found then
    raise exception
      'El negocio ya no está disponible para publicidad.';
  end if;


  clean_title :=
    trim(coalesce(p_title, ''));

  if char_length(clean_title) < 3
     or char_length(clean_title) > 120 then
    raise exception
      'El título debe tener entre 3 y 120 caracteres.';
  end if;


  clean_description :=
    nullif(trim(coalesce(p_description, '')), '');

  if clean_description is not null
     and char_length(clean_description) > 500 then
    raise exception
      'La descripción no puede superar 500 caracteres.';
  end if;


  if p_requested_days is null
     or p_requested_days < 1 then
    raise exception
      'Debes contratar al menos un día de publicidad.';
  end if;


  if p_start_mode not in ('asap', 'scheduled') then
    raise exception
      'La opción de inicio seleccionada no es válida.';
  end if;


  if p_start_mode = 'asap' then

    final_requested_start_at := null;

  else

    if p_requested_start_at is null then
      raise exception
        'Debes indicar fecha y hora de inicio.';
    end if;

    if p_requested_start_at <= now() then
      raise exception
        'La nueva fecha solicitada debe estar en el futuro.';
    end if;

    final_requested_start_at :=
      p_requested_start_at;

  end if;


  clean_storage_bucket :=
    trim(coalesce(p_storage_bucket, ''));

  clean_storage_path :=
    trim(
      both '/'
      from trim(coalesce(p_storage_path, ''))
    );


  if clean_storage_bucket <> 'ad-assets' then
    raise exception
      'El archivo del anuncio debe almacenarse en ad-assets.';
  end if;


  if clean_storage_path = '' then
    raise exception
      'No se recibió la ruta del archivo del anuncio.';
  end if;


  if split_part(clean_storage_path, '/', 1)
     <> business_row.id::text then
    raise exception
      'La ruta Storage no pertenece al negocio anunciante.';
  end if;


  select o.metadata
  into storage_metadata
  from storage.objects o
  where o.bucket_id = clean_storage_bucket
    and o.name = clean_storage_path
  limit 1;

  if not found then
    raise exception
      'No se encontró el archivo del anuncio en Storage.';
  end if;


  storage_mime_type :=
    lower(
      coalesce(
        storage_metadata ->> 'mimetype',
        ''
      )
    );


  storage_size_bytes :=
    coalesce(
      nullif(
        storage_metadata ->> 'size',
        ''
      )::bigint,
      0
    );


  if storage_mime_type not in (
    'image/jpeg',
    'image/png',
    'image/webp'
  ) then
    raise exception
      'Campaña A sólo acepta imágenes JPEG, PNG o WebP.';
  end if;


  if storage_size_bytes <= 0 then
    raise exception
      'El archivo del anuncio está vacío o no tiene tamaño válido.';
  end if;


  if storage_size_bytes > (1000 * 1024) then
    raise exception
      'La imagen del anuncio no puede superar 1000 KB.';
  end if;


  if p_target_kind = 'business_page' then

    if p_target_contact_method_id is not null then
      raise exception
        'La página del negocio no requiere contacto.';
    end if;

    resolved_target_url :=
      '/negocio/' || business_row.slug;

    resolved_target_label :=
      'Ver negocio';


  elsif p_target_kind = 'contact' then

    if p_target_contact_method_id is null then
      raise exception
        'Debes seleccionar un contacto.';
    end if;

    select
      cm.id,
      cm.type,
      cm.label
    into contact_row
    from public.contact_methods cm
    where cm.id = p_target_contact_method_id
      and cm.business_id = business_row.id
      and cm.is_active = true
      and cm.is_approved = true
    limit 1;

    if not found then
      raise exception
        'El contacto seleccionado ya no está disponible.';
    end if;


    resolved_target_url :=
      public.get_ad_contact_target_url(
        business_row.id,
        p_target_contact_method_id
      );


    resolved_target_label :=
      left(
        coalesce(
          nullif(trim(contact_row.label), ''),
          case lower(contact_row.type::text)
            when 'whatsapp' then 'WhatsApp'
            when 'phone' then 'Llamar'
            when 'email' then 'Enviar correo'
            when 'facebook' then 'Facebook'
            when 'instagram' then 'Instagram'
            when 'tiktok' then 'TikTok'
            when 'x' then 'X'
            when 'messenger' then 'Messenger'
            when 'website' then 'Sitio web'
            else 'Contactar'
          end
        ),
        80
      );


  else

    raise exception
      'El destino seleccionado no es válido.';

  end if;


  select count(*)
  into asset_count
  from public.ad_assets a
  where a.campaign_id = p_campaign_id;


  if asset_count <> 1 then
    raise exception
      'El anuncio debe contener exactamente una imagen.';
  end if;


  select a.id
  into existing_asset_id
  from public.ad_assets a
  where a.campaign_id = p_campaign_id
  limit 1;


  if existing_asset_id is null then
    raise exception
      'No se encontró la imagen del anuncio.';
  end if;


  update public.ad_campaigns
  set
    title = clean_title,
    description = clean_description,

    price_mxn = p_requested_days * 50,
    requested_days = p_requested_days,
    daily_price_mxn = 50,

    start_mode = p_start_mode,
    requested_start_at =
      final_requested_start_at,

    starts_at = null,
    ends_at = null,

    target_kind = p_target_kind,

    target_contact_method_id =
      case
        when p_target_kind = 'contact'
          then p_target_contact_method_id
        else null
      end,

    target_label = resolved_target_label,
    target_url = resolved_target_url,

    placement_scope = array[
      'home',
      'negocios',
      'productos',
      'noticias',
      'clima',
      'business_profile'
    ]::text[],

    priority = 0,
    probability_weight = 1,

    status =
      'pending_review'::public.ad_campaign_status,

    submitted_at = now(),

    reviewed_by = null,
    reviewed_at = null,

    rejection_reason = null,

    correction_requested_at = null,
    correction_notes = null,

    updated_at = now()

  where id = p_campaign_id;


  update public.ad_assets
  set
    asset_type =
      'image'::public.ad_asset_type,

    url = null,

    storage_bucket =
      clean_storage_bucket,

    storage_path =
      clean_storage_path,

    alt_text = left(
      clean_title ||
      ' - anuncio de ' ||
      business_row.name,
      160
    ),

    sort_order = 0,

    duration_seconds = null,

    is_active = true,

    updated_at = now()

  where id = existing_asset_id;


  return p_campaign_id;

end;
$function$;


-- =========================================================
-- 12. RETIRAR RPC LEGACY URL-ONLY
-- =========================================================

drop function if exists public.submit_ad_request(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text
);

drop function if exists public.resubmit_ad_request(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text
);

drop function if exists public.get_public_ads(
  text,
  uuid,
  boolean
);


-- =========================================================
-- 13. HARDENING DE public.ad_assets
-- =========================================================

revoke insert, update, delete
on table public.ad_assets
from anon, authenticated;

revoke truncate, references, trigger
on table public.ad_assets
from anon, authenticated;

grant select
on table public.ad_assets
to anon, authenticated;


-- =========================================================
-- 14. PERMISOS RPC
-- =========================================================

revoke execute
on function public.get_public_ads_storage(
  text,
  uuid,
  boolean
)
from public;

grant execute
on function public.get_public_ads_storage(
  text,
  uuid,
  boolean
)
to anon, authenticated, service_role;


revoke execute
on function public.submit_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text
)
from public, anon;

grant execute
on function public.submit_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text
)
to authenticated, service_role;


revoke execute
on function public.resubmit_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text
)
from public, anon;

grant execute
on function public.resubmit_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text
)
to authenticated, service_role;


commit;


-- =========================================================
-- 15. VERIFICACION POST-MIGRACION
-- =========================================================

select
  (
    select count(*)
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'submit_ad_request',
        'resubmit_ad_request',
        'get_public_ads'
      )
  ) as legacy_rpc_count,

  (
    select count(*)
    from public.ad_assets
    where storage_bucket = 'ad-assets'
      and storage_path is not null
  ) as ad_storage_assets,

  (
    select count(*)
    from public.ad_assets
    where url is not null
      and btrim(url) <> ''
      and storage_bucket is null
      and storage_path is null
      and is_active = false
  ) as preserved_legacy_assets,

  (
    select count(*)
    from storage.objects o
    where o.bucket_id = 'ad-assets'
      and not exists (
        select 1
        from public.ad_assets a
        where a.storage_bucket = o.bucket_id
          and a.storage_path = o.name
      )
  ) as ad_storage_orphans,

  (
    select count(*)
    from storage.objects o
    where o.bucket_id = 'business-media'
      and not exists (
        select 1
        from public.business_media m
        where m.storage_bucket = o.bucket_id
          and m.storage_path = o.name
      )
      and not exists (
        select 1
        from public.business_items i
        where i.image_storage_bucket = o.bucket_id
          and i.image_storage_path = o.name
      )
  ) as business_storage_orphans;
