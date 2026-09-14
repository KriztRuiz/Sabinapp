-- =========================================================
-- SABINAPP
-- FASE 118E-3
--
-- Corrección:
-- contact_methods.type es public.contact_method_type (ENUM).
-- PostgreSQL no permite lower(enum) directamente.
--
-- Solución:
-- lower(contact_row.type::text)
--
-- Funciones afectadas:
--   1. get_ad_contact_target_url
--   2. submit_ad_request
--   3. resubmit_ad_request
--
-- Total de conversiones corregidas: 5
-- =========================================================


-- =========================================================
-- 1. get_ad_contact_target_url
-- =========================================================

create or replace function public.get_ad_contact_target_url(
  target_business_id uuid,
  target_contact_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  contact_row record;
  normalized_value text;
  normalized_digits text;
begin
  select
    cm.id,
    cm.business_id,
    cm.type,
    cm.label,
    cm.value,
    cm.url,
    cm.is_active,
    cm.is_approved
  into contact_row
  from public.contact_methods cm
  where cm.id = target_contact_id
    and cm.business_id = target_business_id
    and cm.is_active = true
    and cm.is_approved = true
  limit 1;

  if not found then
    raise exception
      'El contacto seleccionado no pertenece al negocio o no está disponible públicamente.';
  end if;

  normalized_value := trim(coalesce(contact_row.value, ''));

  -- Un enlace explícito aprobado tiene prioridad.
  if nullif(trim(coalesce(contact_row.url, '')), '') is not null then
    if trim(contact_row.url) ~* '^https?://' then
      return trim(contact_row.url);
    end if;

    if trim(contact_row.url) ~* '^tel:[+0-9(). -]+$' then
      return trim(contact_row.url);
    end if;

    if trim(contact_row.url) ~* '^mailto:[^[:space:]]+@[^[:space:]]+$' then
      return trim(contact_row.url);
    end if;
  end if;

  -- Teléfono.
  if lower(contact_row.type::text) = 'phone' then
    if normalized_value = '' then
      raise exception
        'El teléfono seleccionado no tiene un valor válido.';
    end if;

    return 'tel:' || regexp_replace(
      normalized_value,
      '[[:space:]]+',
      '',
      'g'
    );
  end if;

  -- Correo.
  if lower(contact_row.type::text) = 'email' then
    if normalized_value = ''
       or normalized_value !~ '^[^[:space:]@]+@[^[:space:]@]+$' then
      raise exception
        'El correo seleccionado no tiene un valor válido.';
    end if;

    return 'mailto:' || normalized_value;
  end if;

  -- WhatsApp.
  if lower(contact_row.type::text) = 'whatsapp' then
    normalized_digits := regexp_replace(
      normalized_value,
      '[^0-9]',
      '',
      'g'
    );

    if normalized_digits = '' then
      raise exception
        'El WhatsApp seleccionado no tiene un número válido.';
    end if;

    if normalized_digits ~ '^52[0-9]{10}$' then
      return 'https://wa.me/' || normalized_digits;
    end if;

    if normalized_digits ~ '^[0-9]{10}$' then
      return 'https://wa.me/52' || normalized_digits;
    end if;

    raise exception
      'El WhatsApp seleccionado no tiene un formato compatible.';
  end if;

  -- Redes sociales, sitio web y contactos personalizados.
  if normalized_value ~* '^https?://' then
    return normalized_value;
  end if;

  raise exception
    'El contacto seleccionado no tiene un destino compatible con anuncios.';
end;
$function$;


-- =========================================================
-- 2. submit_ad_request
-- =========================================================

create or replace function public.submit_ad_request(
  p_business_id uuid,
  p_title text,
  p_description text,
  p_requested_days integer,
  p_start_mode text,
  p_requested_start_at timestamp with time zone,
  p_target_kind text,
  p_target_contact_method_id uuid,
  p_image_url text
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
  clean_image_url text;

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

    final_requested_start_at := p_requested_start_at;
  end if;

  clean_image_url :=
    trim(coalesce(p_image_url, ''));

  if clean_image_url = ''
     or clean_image_url !~* '^https?://' then
    raise exception
      'La imagen debe utilizar una URL http:// o https:// válida.';
  end if;

  if clean_image_url ~* '^\s*javascript:' then
    raise exception
      'La URL de imagen no es válida.';
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
    alt_text,
    sort_order,
    duration_seconds,
    is_active
  )
  values (
    new_campaign_id,
    'image'::public.ad_asset_type,
    clean_image_url,
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
-- 3. resubmit_ad_request
-- =========================================================

create or replace function public.resubmit_ad_request(
  p_campaign_id uuid,
  p_title text,
  p_description text,
  p_requested_days integer,
  p_start_mode text,
  p_requested_start_at timestamp with time zone,
  p_target_kind text,
  p_target_contact_method_id uuid,
  p_image_url text
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
  clean_image_url text;

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

  if campaign_row.requested_days is null then
    raise exception
      'Este anuncio pertenece al modelo anterior.';
  end if;

  if campaign_row.status <> 'draft'::public.ad_campaign_status
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

  clean_image_url :=
    trim(coalesce(p_image_url, ''));

  if clean_image_url = ''
     or clean_image_url !~* '^https?://' then
    raise exception
      'La imagen debe utilizar una URL http:// o https:// válida.';
  end if;

  if clean_image_url ~* '^\s*javascript:' then
    raise exception
      'La URL de imagen no es válida.';
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
    requested_start_at = final_requested_start_at,

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

    status = 'pending_review'::public.ad_campaign_status,

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
    asset_type = 'image'::public.ad_asset_type,
    url = clean_image_url,

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
-- VERIFICACIÓN
--
-- Debe devolver las tres funciones con enum_lower_check = OK.
-- =========================================================

select
  p.proname as function_name,
  case
    when position(
      'lower(contact_row.type)'
      in p.prosrc
    ) > 0
      then 'ERROR: todavía existe lower(enum)'
    else 'OK'
  end as enum_lower_check
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and p.proname in (
    'get_ad_contact_target_url',
    'submit_ad_request',
    'resubmit_ad_request'
  )
order by p.proname;
