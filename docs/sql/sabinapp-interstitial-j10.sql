-- =========================================================
-- SABINAPP 1.0
-- J10 - CAMPANA B / INTERSTITIAL
--
-- Migración incremental.
--
-- Reglas de producto:
-- - $100 MXN por día;
-- - 1 a 6 imágenes O exactamente 1 video;
-- - no mezcla imágenes y video;
-- - imágenes JPEG / PNG / WebP;
-- - máximo 1000 KB por imagen;
-- - video MP4 / WebM;
-- - máximo 16000 KB por video;
-- - probabilidad global: 0.125 (1/8);
-- - cooldown: 30 minutos;
-- - 10 segundos antes de permitir cerrar;
-- - no existe máximo de interstitials por sesión como regla
--   de producto;
-- - Campaña B permanece deshabilitada al aplicar este SQL.
--
-- PRECONDICIONES:
-- - infraestructura publicitaria base;
-- - Supabase Storage configurado;
-- - bucket ad-assets;
-- - función public.get_ad_contact_target_url(...);
-- - enums public.ad_campaign_type,
--         public.ad_campaign_status,
--         public.ad_asset_type.
-- =========================================================


begin;


-- =========================================================
-- 1. CONFIGURACION OBJETIVO DE CAMPANA B
-- =========================================================

update public.ad_settings
set
  interstitial_enabled = false,
  interstitial_probability = 0.1250,
  interstitial_cooldown_minutes = 30,
  interstitial_required_seconds = 10,
  max_assets_interstitial = 6,
  max_image_size_kb = 1000,
  max_video_size_kb = 16000,
  updated_at = now()
where id = true;


-- =========================================================
-- 2. INTEGRIDAD DE ASSETS
--
-- Campaña A:
-- - sólo imagen;
-- - máximo 1 asset activo.
--
-- Campaña B:
-- - máximo 6 imágenes activas;
-- - O exactamente 1 video activo;
-- - nunca mezcla ambos formatos.
--
-- Los assets inactivos pueden conservarse como historial.
-- =========================================================

create or replace function public.enforce_requested_ad_single_asset()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  campaign_row record;
  active_image_count integer;
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


  -- =======================================================
  -- CAMPAÑA A / FIXED BANNER
  -- =======================================================

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
           and a.id is distinct from new.id
           and a.is_active = true
       ) then

      raise exception
        'Los anuncios fijos sólo pueden tener una imagen activa.';

    end if;


    return new;

  end if;


  -- =======================================================
  -- CAMPAÑA B / INTERSTITIAL
  -- =======================================================

  if campaign_row.campaign_type =
     'interstitial'::public.ad_campaign_type then


    -- Los assets inactivos no forman parte de la composición
    -- pública actual.
    if new.is_active is not true then
      return new;
    end if;


    -- =====================================================
    -- MODO IMÁGENES
    -- =====================================================

    if new.asset_type =
       'image'::public.ad_asset_type then


      if exists (
        select 1
        from public.ad_assets a
        where a.campaign_id = new.campaign_id
          and a.id is distinct from new.id
          and a.is_active = true
          and a.asset_type =
            'video'::public.ad_asset_type
      ) then

        raise exception
          'Una campaña emergente no puede mezclar imágenes y video.';

      end if;


      select count(*)
      into active_image_count
      from public.ad_assets a
      where a.campaign_id = new.campaign_id
        and a.id is distinct from new.id
        and a.is_active = true
        and a.asset_type =
          'image'::public.ad_asset_type;


      if active_image_count >= 6 then

        raise exception
          'Una campaña emergente admite como máximo 6 imágenes activas.';

      end if;


      return new;

    end if;


    -- =====================================================
    -- MODO VIDEO
    -- =====================================================

    if new.asset_type =
       'video'::public.ad_asset_type then


      if exists (
        select 1
        from public.ad_assets a
        where a.campaign_id = new.campaign_id
          and a.id is distinct from new.id
          and a.is_active = true
      ) then

        raise exception
          'Una campaña emergente con video sólo puede tener un video activo.';

      end if;


      return new;

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
-- 3. CREAR SOLICITUD DE CAMPANA B
-- =========================================================

create or replace function public.submit_interstitial_ad_request_storage(
  p_business_id uuid,
  p_title text,
  p_description text,
  p_requested_days integer,
  p_start_mode text,
  p_requested_start_at timestamp with time zone,
  p_target_kind text,
  p_target_contact_method_id uuid,
  p_asset_mode text,
  p_storage_paths text[]
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
  clean_asset_mode text;
  clean_storage_path text;

  storage_metadata jsonb;
  storage_mime_type text;
  storage_size_bytes bigint;

  resolved_target_url text;
  resolved_target_label text;

  new_campaign_id uuid;

  final_requested_start_at timestamptz;

  asset_count integer;
  asset_index integer;
begin

  -- =======================================================
  -- AUTENTICACION
  -- =======================================================

  current_user_id := auth.uid();


  if current_user_id is null then
    raise exception
      'Debes iniciar sesión para solicitar un anuncio.';
  end if;


  -- =======================================================
  -- PERFIL
  -- =======================================================

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


  -- =======================================================
  -- NEGOCIO / OWNERSHIP
  -- =======================================================

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


  -- =======================================================
  -- TITULO
  -- =======================================================

  clean_title :=
    trim(coalesce(p_title, ''));


  if char_length(clean_title) < 3
     or char_length(clean_title) > 120 then

    raise exception
      'El título debe tener entre 3 y 120 caracteres.';

  end if;


  -- =======================================================
  -- DESCRIPCION
  -- =======================================================

  clean_description :=
    nullif(
      trim(coalesce(p_description, '')),
      ''
    );


  if clean_description is not null
     and char_length(clean_description) > 500 then

    raise exception
      'La descripción no puede superar 500 caracteres.';

  end if;


  -- =======================================================
  -- DURACION
  -- =======================================================

  if p_requested_days is null
     or p_requested_days < 1 then

    raise exception
      'Debes contratar al menos un día de publicidad.';

  end if;


  -- =======================================================
  -- INICIO
  -- =======================================================

  if p_start_mode not in (
    'asap',
    'scheduled'
  ) then

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


  -- =======================================================
  -- FORMATO DE ASSETS
  -- =======================================================

  clean_asset_mode :=
    lower(
      trim(
        coalesce(
          p_asset_mode,
          ''
        )
      )
    );


  if clean_asset_mode not in (
    'images',
    'video'
  ) then

    raise exception
      'El formato del anuncio emergente no es válido.';

  end if;


  asset_count :=
    coalesce(
      array_length(
        p_storage_paths,
        1
      ),
      0
    );


  -- =======================================================
  -- CANTIDAD
  -- =======================================================

  if clean_asset_mode = 'images' then

    if asset_count < 1
       or asset_count > 6 then

      raise exception
        'La campaña emergente debe contener entre 1 y 6 imágenes.';

    end if;


  elsif clean_asset_mode = 'video' then

    if asset_count <> 1 then

      raise exception
        'La campaña emergente con video debe contener exactamente un archivo.';

    end if;

  end if;


  -- =======================================================
  -- RUTAS DUPLICADAS
  -- =======================================================

  if (
    select count(*)
    from unnest(p_storage_paths)
      as path_value
  ) <>
  (
    select count(
      distinct trim(
        both '/'
        from trim(
          coalesce(
            path_value,
            ''
          )
        )
      )
    )
    from unnest(p_storage_paths)
      as path_value
  ) then

    raise exception
      'No puedes utilizar el mismo archivo más de una vez.';

  end if;


  -- =======================================================
  -- VALIDAR OBJETOS STORAGE
  -- =======================================================

  for asset_index in 1..asset_count loop

    clean_storage_path :=
      trim(
        both '/'
        from trim(
          coalesce(
            p_storage_paths[asset_index],
            ''
          )
        )
      );


    if clean_storage_path = '' then

      raise exception
        'Una de las rutas Storage está vacía.';

    end if;


    if split_part(
      clean_storage_path,
      '/',
      1
    ) <> p_business_id::text then

      raise exception
        'Uno de los archivos no pertenece al negocio seleccionado.';

    end if;


    select
      o.metadata

    into storage_metadata

    from storage.objects o

    where o.bucket_id = 'ad-assets'
      and o.name = clean_storage_path

    limit 1;


    if not found then

      raise exception
        'No se encontró uno de los archivos del anuncio en Storage.';

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


    if storage_size_bytes <= 0 then

      raise exception
        'Uno de los archivos está vacío o no tiene tamaño válido.';

    end if;


    -- =====================================================
    -- IMAGENES
    -- =====================================================

    if clean_asset_mode = 'images' then

      if storage_mime_type not in (
        'image/jpeg',
        'image/png',
        'image/webp'
      ) then

        raise exception
          'Campaña B en modo imágenes sólo acepta JPEG, PNG o WebP.';

      end if;


      if storage_size_bytes >
         (1000 * 1024) then

        raise exception
          'Cada imagen del anuncio puede pesar como máximo 1000 KB.';

      end if;


    -- =====================================================
    -- VIDEO
    -- =====================================================

    elsif clean_asset_mode = 'video' then

      if storage_mime_type not in (
        'video/mp4',
        'video/webm'
      ) then

        raise exception
          'Campaña B en modo video sólo acepta MP4 o WebM.';

      end if;


      if storage_size_bytes >
         (16000 * 1024) then

        raise exception
          'El video del anuncio puede pesar como máximo 16000 KB.';

      end if;

    end if;

  end loop;


  -- =======================================================
  -- DESTINO
  -- =======================================================

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

    where cm.id =
        p_target_contact_method_id
      and cm.business_id =
        p_business_id
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
          nullif(
            trim(contact_row.label),
            ''
          ),
          case lower(
            contact_row.type::text
          )
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


  -- =======================================================
  -- CREAR CAMPANA
  -- =======================================================

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

    'interstitial'::public.ad_campaign_type,

    'pending_review'::public.ad_campaign_status,

    p_requested_days * 100,

    p_requested_days,

    100,

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


  -- =======================================================
  -- CREAR ASSETS
  -- =======================================================

  for asset_index in 1..asset_count loop

    clean_storage_path :=
      trim(
        both '/'
        from trim(
          p_storage_paths[asset_index]
        )
      );


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

      case
        when clean_asset_mode = 'images'
          then 'image'::public.ad_asset_type
        else 'video'::public.ad_asset_type
      end,

      null,

      'ad-assets',

      clean_storage_path,

      left(
        clean_title ||
        ' - anuncio de ' ||
        business_row.name,
        160
      ),

      asset_index - 1,

      null,

      true
    );

  end loop;


  return new_campaign_id;

end;
$function$;


-- =========================================================
-- 4. REENVIAR CORRECCION DE CAMPANA B
-- =========================================================

create or replace function public.resubmit_interstitial_ad_request_storage(
  p_campaign_id uuid,
  p_title text,
  p_description text,
  p_requested_days integer,
  p_start_mode text,
  p_requested_start_at timestamp with time zone,
  p_target_kind text,
  p_target_contact_method_id uuid,
  p_asset_mode text,
  p_storage_paths text[]
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
  settings_row record;

  clean_title text;
  clean_description text;
  clean_asset_mode text;
  clean_storage_path text;

  storage_metadata jsonb;
  storage_mime_type text;
  storage_size_bytes bigint;

  final_requested_start_at timestamptz;

  resolved_target_url text;
  resolved_target_label text;

  asset_count integer;
  asset_index integer;
  duplicate_path_count integer;
begin

  -- =======================================================
  -- AUTENTICACION
  -- =======================================================

  current_user_id :=
    auth.uid();


  if current_user_id is null then

    raise exception
      'Debes iniciar sesión para corregir un anuncio.';

  end if;


  -- =======================================================
  -- PERFIL
  -- =======================================================

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


  -- =======================================================
  -- CAMPANA
  -- =======================================================

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
     'interstitial'::public.ad_campaign_type then

    raise exception
      'Este anuncio no pertenece a Campaña B.';

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


  -- =======================================================
  -- PAGOS
  -- =======================================================

  if exists (
    select 1
    from public.ad_payments p
    where p.campaign_id = p_campaign_id
  ) then

    raise exception
      'No se puede modificar un anuncio que ya tiene un pago asociado.';

  end if;


  -- =======================================================
  -- METRICAS
  -- =======================================================

  if exists (
    select 1
    from public.ad_impressions i
    where i.campaign_id =
      p_campaign_id
  )
  or exists (
    select 1
    from public.ad_clicks c
    where c.campaign_id =
      p_campaign_id
  ) then

    raise exception
      'No se pueden reemplazar los archivos de un anuncio que ya tiene métricas.';

  end if;


  -- =======================================================
  -- NEGOCIO / OWNERSHIP
  -- =======================================================

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

  where b.id =
      campaign_row.advertiser_business_id
    and b.owner_id =
      current_user_id
    and b.status =
      'published'
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


  -- =======================================================
  -- CONFIGURACION
  -- =======================================================

  select
    s.max_assets_interstitial,
    s.max_image_size_kb,
    s.max_video_size_kb

  into settings_row

  from public.ad_settings s

  where s.id = true

  limit 1;


  if not found then

    raise exception
      'No se encontró la configuración publicitaria.';

  end if;


  -- =======================================================
  -- TITULO / DESCRIPCION
  -- =======================================================

  clean_title :=
    trim(
      coalesce(
        p_title,
        ''
      )
    );


  if char_length(clean_title) < 3
     or char_length(clean_title) > 120 then

    raise exception
      'El título debe tener entre 3 y 120 caracteres.';

  end if;


  clean_description :=
    nullif(
      trim(
        coalesce(
          p_description,
          ''
        )
      ),
      ''
    );


  if clean_description is not null
     and char_length(clean_description) > 500 then

    raise exception
      'La descripción no puede superar 500 caracteres.';

  end if;


  -- =======================================================
  -- DURACION
  -- =======================================================

  if p_requested_days is null
     or p_requested_days < 1 then

    raise exception
      'Debes contratar al menos un día de publicidad.';

  end if;


  -- =======================================================
  -- INICIO
  -- =======================================================

  if p_start_mode not in (
    'asap',
    'scheduled'
  ) then

    raise exception
      'La opción de inicio seleccionada no es válida.';

  end if;


  if p_start_mode = 'asap' then

    final_requested_start_at :=
      null;

  else

    if p_requested_start_at is null then

      raise exception
        'Debes seleccionar fecha y hora de inicio.';

    end if;


    if p_requested_start_at <= now() then

      raise exception
        'La fecha y hora solicitadas deben estar en el futuro.';

    end if;


    final_requested_start_at :=
      p_requested_start_at;

  end if;


  -- =======================================================
  -- MODO
  -- =======================================================

  clean_asset_mode :=
    lower(
      trim(
        coalesce(
          p_asset_mode,
          ''
        )
      )
    );


  if clean_asset_mode not in (
    'images',
    'video'
  ) then

    raise exception
      'El formato del anuncio emergente no es válido.';

  end if;


  asset_count :=
    coalesce(
      array_length(
        p_storage_paths,
        1
      ),
      0
    );


  -- =======================================================
  -- CANTIDAD
  -- =======================================================

  if clean_asset_mode = 'images' then

    if asset_count < 1
       or asset_count >
          settings_row.max_assets_interstitial then

      raise exception
        'La campaña emergente debe contener entre 1 y % imágenes.',
        settings_row.max_assets_interstitial;

    end if;


  elsif clean_asset_mode = 'video' then

    if asset_count <> 1 then

      raise exception
        'La campaña emergente con video debe contener exactamente un archivo.';

    end if;

  end if;


  -- =======================================================
  -- RUTAS DUPLICADAS
  -- =======================================================

  select
    count(*) -
    count(
      distinct trim(
        both '/'
        from trim(
          coalesce(
            u.path_value,
            ''
          )
        )
      )
    )

  into duplicate_path_count

  from unnest(p_storage_paths)
    as u(path_value);


  if duplicate_path_count > 0 then

    raise exception
      'No puedes utilizar el mismo archivo más de una vez.';

  end if;


  -- =======================================================
  -- VALIDAR STORAGE
  -- =======================================================

  for asset_index in 1..asset_count loop

    clean_storage_path :=
      trim(
        both '/'
        from trim(
          coalesce(
            p_storage_paths[asset_index],
            ''
          )
        )
      );


    if clean_storage_path = '' then

      raise exception
        'Una de las rutas Storage está vacía.';

    end if;


    if split_part(
      clean_storage_path,
      '/',
      1
    ) <> business_row.id::text then

      raise exception
        'Uno de los archivos no pertenece al negocio anunciante.';

    end if;


    select
      o.metadata

    into storage_metadata

    from storage.objects o

    where o.bucket_id =
        'ad-assets'
      and o.name =
        clean_storage_path

    limit 1;


    if not found then

      raise exception
        'No se encontró uno de los archivos del anuncio en Storage.';

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


    if storage_size_bytes <= 0 then

      raise exception
        'Uno de los archivos está vacío o no tiene tamaño válido.';

    end if;


    if clean_asset_mode = 'images' then

      if storage_mime_type not in (
        'image/jpeg',
        'image/png',
        'image/webp'
      ) then

        raise exception
          'Campaña B en modo imágenes sólo acepta JPEG, PNG o WebP.';

      end if;


      if storage_size_bytes >
         (
           settings_row.max_image_size_kb
           * 1024
         ) then

        raise exception
          'Cada imagen del anuncio puede pesar como máximo % KB.',
          settings_row.max_image_size_kb;

      end if;


    elsif clean_asset_mode = 'video' then

      if storage_mime_type not in (
        'video/mp4',
        'video/webm'
      ) then

        raise exception
          'Campaña B en modo video sólo acepta MP4 o WebM.';

      end if;


      if storage_size_bytes >
         (
           settings_row.max_video_size_kb
           * 1024
         ) then

        raise exception
          'El video del anuncio puede pesar como máximo % KB.',
          settings_row.max_video_size_kb;

      end if;

    end if;

  end loop;


  -- =======================================================
  -- DESTINO
  -- =======================================================

  if p_target_kind =
     'business_page' then

    if p_target_contact_method_id is not null then

      raise exception
        'La página del negocio no requiere seleccionar un contacto.';

    end if;


    resolved_target_url :=
      '/negocio/' ||
      business_row.slug;


    resolved_target_label :=
      'Ver negocio';


  elsif p_target_kind =
        'contact' then

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

    where cm.id =
        p_target_contact_method_id
      and cm.business_id =
        business_row.id
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
          nullif(
            trim(
              contact_row.label
            ),
            ''
          ),
          case lower(
            contact_row.type::text
          )
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


  -- =======================================================
  -- ACTUALIZAR CAMPANA
  -- =======================================================

  update public.ad_campaigns
  set
    title =
      clean_title,

    description =
      clean_description,

    price_mxn =
      p_requested_days * 100,

    requested_days =
      p_requested_days,

    daily_price_mxn =
      100,

    start_mode =
      p_start_mode,

    requested_start_at =
      final_requested_start_at,

    starts_at =
      null,

    ends_at =
      null,

    target_kind =
      p_target_kind,

    target_contact_method_id =
      case
        when p_target_kind =
             'contact'
          then p_target_contact_method_id
        else null
      end,

    target_label =
      resolved_target_label,

    target_url =
      resolved_target_url,

    placement_scope = array[
      'home',
      'negocios',
      'productos',
      'noticias',
      'clima',
      'business_profile'
    ]::text[],

    priority =
      0,

    probability_weight =
      1,

    status =
      'pending_review'::public.ad_campaign_status,

    submitted_at =
      now(),

    reviewed_by =
      null,

    reviewed_at =
      null,

    rejection_reason =
      null,

    correction_requested_at =
      null,

    correction_notes =
      null,

    updated_at =
      now()

  where id =
    p_campaign_id;


  -- =======================================================
  -- REEMPLAZAR ASSETS
  -- =======================================================

  delete from public.ad_assets
  where campaign_id =
    p_campaign_id;


  for asset_index in 1..asset_count loop

    clean_storage_path :=
      trim(
        both '/'
        from trim(
          p_storage_paths[asset_index]
        )
      );


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
      p_campaign_id,

      case
        when clean_asset_mode = 'images'
          then 'image'::public.ad_asset_type
        else 'video'::public.ad_asset_type
      end,

      null,

      'ad-assets',

      clean_storage_path,

      left(
        clean_title ||
        ' - anuncio de ' ||
        business_row.name,
        160
      ),

      asset_index - 1,

      null,

      true
    );

  end loop;


  return p_campaign_id;

end;
$function$;


-- =========================================================
-- 5. PERMISOS RPC
-- =========================================================

revoke execute
on function public.submit_interstitial_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text[]
)
from public, anon;


grant execute
on function public.submit_interstitial_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text[]
)
to authenticated, service_role;


revoke execute
on function public.resubmit_interstitial_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text[]
)
from public, anon;


grant execute
on function public.resubmit_interstitial_ad_request_storage(
  uuid,
  text,
  text,
  integer,
  text,
  timestamp with time zone,
  text,
  uuid,
  text,
  text[]
)
to authenticated, service_role;


commit;


-- =========================================================
-- 6. VERIFICACION
-- =========================================================

select
  interstitial_enabled,
  interstitial_probability,
  interstitial_cooldown_minutes,
  interstitial_required_seconds,
  max_assets_interstitial,
  max_image_size_kb,
  max_video_size_kb

from public.ad_settings

where id = true;


select
  p.proname as function_name,

  pg_get_function_identity_arguments(
    p.oid
  ) as identity_arguments,

  p.prosecdef as security_definer,

  has_function_privilege(
    'anon',
    p.oid,
    'EXECUTE'
  ) as anon_execute,

  has_function_privilege(
    'authenticated',
    p.oid,
    'EXECUTE'
  ) as authenticated_execute,

  has_function_privilege(
    'service_role',
    p.oid,
    'EXECUTE'
  ) as service_role_execute

from pg_proc p

join pg_namespace n
  on n.oid = p.pronamespace

where n.nspname = 'public'
  and p.proname in (
    'submit_interstitial_ad_request_storage',
    'resubmit_interstitial_ad_request_storage'
  )

order by p.proname;
