-- =========================================================
-- SABINAPP 1.0
-- J10-6C - CICLO ADMINISTRATIVO DE PUBLICIDAD
-- Campaña A: $50 MXN/día
-- Campaña B: $100 MXN/día
-- No modifica interstitial_enabled.
-- =========================================================

begin;

CREATE OR REPLACE FUNCTION public.approve_ad_request(p_campaign_id uuid)
 RETURNS TABLE(payment_id uuid, payment_reference text, expected_amount_mxn numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  current_user_id uuid;

  campaign_row record;

  created_payment
    public.ad_payments%rowtype;

  active_asset_count integer;
  active_image_count integer;
  active_video_count integer;

  invalid_storage_count integer;
  missing_storage_count integer;
  invalid_media_count integer;

begin

  current_user_id :=
    auth.uid();


  if current_user_id is null then
    raise exception
      'Debes iniciar sesión para revisar anuncios.';
  end if;


  if not public.has_permission(
    'admin.manage_ads'
  ) then
    raise exception
      'No tienes permiso para administrar anuncios.';
  end if;


  -- -------------------------------------------------------
  -- Bloquear campaña.
  -- -------------------------------------------------------

  select
    c.id,
    c.advertiser_business_id,
    c.status,
    c.campaign_type,

    c.price_mxn,
    c.requested_days,
    c.daily_price_mxn,

    c.start_mode,
    c.requested_start_at,

    b.status
      as business_status,

    b.is_published
      as business_is_published,

    b.expires_at
      as business_expires_at

  into campaign_row

  from public.ad_campaigns c

  join public.businesses b
    on b.id =
      c.advertiser_business_id

  where c.id =
    p_campaign_id

  for update of c;


  if not found then
    raise exception
      'No se encontró el anuncio solicitado.';
  end if;


  if campaign_row.requested_days
     is null then

    raise exception
      'Esta campaña pertenece al modelo anterior y no usa este flujo de revisión.';

  end if;


  if campaign_row.status <>
     'pending_review'::public.ad_campaign_status then

    raise exception
      'Sólo pueden aprobarse anuncios pendientes de revisión.';

  end if;


  -- -------------------------------------------------------
  -- El negocio sigue publicado.
  -- -------------------------------------------------------

  if campaign_row.business_status <>
       'published'
     or campaign_row.business_is_published
       is not true then

    raise exception
      'El negocio ya no está publicado y el anuncio no puede aprobarse.';

  end if;


  if campaign_row.business_expires_at
       is not null
     and campaign_row.business_expires_at
       < now() then

    raise exception
      'El negocio está vencido y el anuncio no puede aprobarse.';

  end if;


  -- -------------------------------------------------------
  -- Precio general.
  -- -------------------------------------------------------

  if campaign_row.price_mxn <>
     (
       campaign_row.requested_days *
       campaign_row.daily_price_mxn
     ) then

    raise exception
      'El precio del anuncio no coincide con su duración.';

  end if;


  -- -------------------------------------------------------
  -- Contar assets activos.
  -- -------------------------------------------------------

  select
    count(*) filter (
      where a.is_active = true
    ),

    count(*) filter (
      where
        a.is_active = true
        and a.asset_type =
          'image'::public.ad_asset_type
    ),

    count(*) filter (
      where
        a.is_active = true
        and a.asset_type =
          'video'::public.ad_asset_type
    )

  into
    active_asset_count,
    active_image_count,
    active_video_count

  from public.ad_assets a

  where a.campaign_id =
    p_campaign_id;


  -- =======================================================
  -- CAMPAÑA A
  -- =======================================================

  if campaign_row.campaign_type =
     'fixed_banner'::public.ad_campaign_type then


    if campaign_row.daily_price_mxn <> 50 then
      raise exception
        'El precio diario del anuncio fijo no es válido.';
    end if;


    if active_asset_count <> 1
       or active_image_count <> 1
       or active_video_count <> 0 then

      raise exception
        'El anuncio fijo debe tener exactamente una imagen activa.';

    end if;


  -- =======================================================
  -- CAMPAÑA B
  -- =======================================================

  elsif campaign_row.campaign_type =
        'interstitial'::public.ad_campaign_type then


    if campaign_row.daily_price_mxn <> 100 then
      raise exception
        'El precio diario de la campaña emergente no es válido.';
    end if;


    if not (
      (
        active_image_count
          between 1 and 6

        and active_video_count = 0

        and active_asset_count =
          active_image_count
      )
      or
      (
        active_video_count = 1

        and active_image_count = 0

        and active_asset_count = 1
      )
    ) then

      raise exception
        'La campaña emergente debe contener de 1 a 6 imágenes o exactamente un video.';

    end if;


    -- -----------------------------------------------------
    -- Campaña B debe utilizar Supabase Storage.
    -- -----------------------------------------------------

    select
      count(*)

    into invalid_storage_count

    from public.ad_assets a

    where a.campaign_id =
      p_campaign_id

      and a.is_active = true

      and (
        a.storage_bucket
          is distinct from 'ad-assets'

        or a.storage_path
          is null
      );


    if invalid_storage_count <> 0 then
      raise exception
        'La campaña emergente contiene archivos fuera de Supabase Storage.';
    end if;


    -- -----------------------------------------------------
    -- Todos los objetos deben seguir existiendo.
    -- -----------------------------------------------------

    select
      count(*)

    into missing_storage_count

    from public.ad_assets a

    left join storage.objects o
      on o.bucket_id =
        a.storage_bucket

      and o.name =
        a.storage_path

    where a.campaign_id =
      p_campaign_id

      and a.is_active = true

      and o.id is null;


    if missing_storage_count <> 0 then
      raise exception
        'Uno o más archivos de la campaña emergente ya no existen en Storage.';
    end if;


    -- -----------------------------------------------------
    -- MIME y tamaño siguen siendo válidos.
    -- -----------------------------------------------------

    select
      count(*)

    into invalid_media_count

    from public.ad_assets a

    join storage.objects o
      on o.bucket_id =
        a.storage_bucket

      and o.name =
        a.storage_path

    where a.campaign_id =
      p_campaign_id

      and a.is_active = true

      and (
        (
          a.asset_type =
            'image'::public.ad_asset_type

          and (
            o.metadata ->> 'mimetype'
              not in (
                'image/jpeg',
                'image/png',
                'image/webp'
              )

            or coalesce(
              (o.metadata ->> 'size')::bigint,
              0
            ) <= 0

            or coalesce(
              (o.metadata ->> 'size')::bigint,
              0
            ) > 1000 * 1024
          )
        )

        or

        (
          a.asset_type =
            'video'::public.ad_asset_type

          and (
            o.metadata ->> 'mimetype'
              not in (
                'video/mp4',
                'video/webm'
              )

            or coalesce(
              (o.metadata ->> 'size')::bigint,
              0
            ) <= 0

            or coalesce(
              (o.metadata ->> 'size')::bigint,
              0
            ) > 16000 * 1024
          )
        )
      );


    if invalid_media_count <> 0 then
      raise exception
        'Uno o más archivos de la campaña emergente no cumplen las reglas de formato o tamaño.';
    end if;


  else

    raise exception
      'Este tipo de anuncio no puede aprobarse con este flujo.';

  end if;


  -- -------------------------------------------------------
  -- No debe existir pago previo.
  -- -------------------------------------------------------

  if exists (
    select 1

    from public.ad_payments p

    where p.campaign_id =
      p_campaign_id
  ) then

    raise exception
      'Este anuncio ya tiene un registro de pago.';

  end if;


  -- -------------------------------------------------------
  -- Aprobar contenido.
  -- -------------------------------------------------------

  update public.ad_campaigns

  set
    status =
      'approved'::public.ad_campaign_status,

    reviewed_by =
      current_user_id,

    reviewed_at =
      now(),

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


  -- -------------------------------------------------------
  -- Crear obligación de pago.
  -- -------------------------------------------------------

  insert into public.ad_payments (
    campaign_id,
    expected_amount_mxn,
    status
  )
  values (
    p_campaign_id,
    campaign_row.price_mxn,
    'pending'
  )
  returning *
  into created_payment;


  return query

  select
    created_payment.id,
    created_payment.payment_reference,
    created_payment.expected_amount_mxn;

end;
$function$;

CREATE OR REPLACE FUNCTION public.verify_ad_payment(p_campaign_id uuid, p_admin_notes text DEFAULT NULL::text)
 RETURNS TABLE(payment_reference text, starts_at timestamp with time zone, ends_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  current_user_id uuid;

  campaign_row record;

  payment_row
    public.ad_payments%rowtype;

  clean_notes text;

  effective_start timestamptz;
  effective_end timestamptz;

  active_asset_count integer;
  active_image_count integer;
  active_video_count integer;

  missing_storage_count integer;

begin

  current_user_id :=
    auth.uid();


  if current_user_id is null then
    raise exception
      'Debes iniciar sesión para verificar pagos.';
  end if;


  if not public.has_permission(
    'admin.manage_ads'
  ) then
    raise exception
      'No tienes permiso para verificar pagos de anuncios.';
  end if;


  clean_notes :=
    nullif(
      trim(
        coalesce(
          p_admin_notes,
          ''
        )
      ),
      ''
    );


  if clean_notes is not null
     and char_length(clean_notes) > 2000 then

    raise exception
      'Las observaciones no pueden superar 2000 caracteres.';

  end if;


  -- -------------------------------------------------------
  -- Bloquear campaña.
  -- -------------------------------------------------------

  select
    c.id,
    c.status,
    c.campaign_type,

    c.requested_days,
    c.daily_price_mxn,
    c.price_mxn,

    c.start_mode,
    c.requested_start_at,

    b.status
      as business_status,

    b.is_published
      as business_is_published,

    b.expires_at
      as business_expires_at

  into campaign_row

  from public.ad_campaigns c

  join public.businesses b
    on b.id =
      c.advertiser_business_id

  where c.id =
    p_campaign_id

  for update of c;


  if not found then
    raise exception
      'No se encontró el anuncio.';
  end if;


  if campaign_row.requested_days
     is null then

    raise exception
      'Este anuncio pertenece al modelo anterior.';

  end if;


  if campaign_row.status <>
     'approved'::public.ad_campaign_status then

    raise exception
      'Sólo pueden activarse anuncios aprobados.';

  end if;


  -- -------------------------------------------------------
  -- Negocio sigue publicado.
  -- -------------------------------------------------------

  if campaign_row.business_status <>
       'published'
     or campaign_row.business_is_published
       is not true then

    raise exception
      'El negocio ya no está publicado.';

  end if;


  if campaign_row.business_expires_at
       is not null
     and campaign_row.business_expires_at
       < now() then

    raise exception
      'El negocio está vencido.';

  end if;


  -- -------------------------------------------------------
  -- Precio por tipo de campaña.
  -- -------------------------------------------------------

  if campaign_row.campaign_type =
     'fixed_banner'::public.ad_campaign_type then

    if campaign_row.daily_price_mxn <> 50 then
      raise exception
        'El precio diario del anuncio fijo no es válido.';
    end if;

  elsif campaign_row.campaign_type =
        'interstitial'::public.ad_campaign_type then

    if campaign_row.daily_price_mxn <> 100 then
      raise exception
        'El precio diario de la campaña emergente no es válido.';
    end if;

  else

    raise exception
      'El tipo de campaña no puede activarse con este flujo.';

  end if;


  if campaign_row.price_mxn <>
     (
       campaign_row.requested_days *
       campaign_row.daily_price_mxn
     ) then

    raise exception
      'El precio del anuncio no coincide con su duración.';

  end if;


  -- -------------------------------------------------------
  -- Antes de activar Campaña B, revalidar composición.
  -- -------------------------------------------------------

  if campaign_row.campaign_type =
     'interstitial'::public.ad_campaign_type then


    select
      count(*) filter (
        where a.is_active = true
      ),

      count(*) filter (
        where
          a.is_active = true
          and a.asset_type =
            'image'::public.ad_asset_type
      ),

      count(*) filter (
        where
          a.is_active = true
          and a.asset_type =
            'video'::public.ad_asset_type
      )

    into
      active_asset_count,
      active_image_count,
      active_video_count

    from public.ad_assets a

    where a.campaign_id =
      p_campaign_id;


    if not (
      (
        active_image_count
          between 1 and 6

        and active_video_count = 0

        and active_asset_count =
          active_image_count
      )
      or
      (
        active_video_count = 1

        and active_image_count = 0

        and active_asset_count = 1
      )
    ) then

      raise exception
        'La campaña emergente ya no tiene una composición válida.';

    end if;


    select
      count(*)

    into missing_storage_count

    from public.ad_assets a

    left join storage.objects o
      on o.bucket_id =
        a.storage_bucket

      and o.name =
        a.storage_path

    where a.campaign_id =
      p_campaign_id

      and a.is_active = true

      and (
        a.storage_bucket
          is distinct from 'ad-assets'

        or a.storage_path
          is null

        or o.id is null
      );


    if missing_storage_count <> 0 then
      raise exception
        'Uno o más archivos de la campaña emergente ya no están disponibles en Storage.';
    end if;


  end if;


  -- -------------------------------------------------------
  -- Bloquear pago.
  -- -------------------------------------------------------

  select *

  into payment_row

  from public.ad_payments p

  where p.campaign_id =
    p_campaign_id

  for update;


  if not found then
    raise exception
      'No se encontró el pago del anuncio.';
  end if;


  if payment_row.status <>
     'reported' then

    raise exception
      'El dueño todavía no ha reportado un pago pendiente de revisión.';

  end if;


  if payment_row.expected_amount_mxn <>
     campaign_row.price_mxn then

    raise exception
      'El monto del pago no coincide con el precio del anuncio.';

  end if;


  -- -------------------------------------------------------
  -- Calcular inicio real.
  -- -------------------------------------------------------

  if campaign_row.start_mode =
     'asap' then

    effective_start :=
      now();


  elsif campaign_row.start_mode =
        'scheduled' then


    if campaign_row.requested_start_at
       is null then

      raise exception
        'El anuncio programado no tiene una fecha de inicio válida.';

    end if;


    if campaign_row.requested_start_at
       <= now() then

      raise exception
        'La fecha solicitada ya pasó. El dueño debe seleccionar una nueva fecha antes de verificar el pago.';

    end if;


    effective_start :=
      campaign_row.requested_start_at;


  else

    raise exception
      'El modo de inicio del anuncio no es válido.';

  end if;


  effective_end :=
    effective_start +
    make_interval(
      days =>
        campaign_row.requested_days
    );


  -- -------------------------------------------------------
  -- Verificar pago.
  -- -------------------------------------------------------

  update public.ad_payments

  set
    status =
      'verified',

    verified_at =
      now(),

    verified_by =
      current_user_id,

    admin_notes =
      clean_notes,

    updated_at =
      now()

  where id =
    payment_row.id

  returning *
  into payment_row;


  -- -------------------------------------------------------
  -- Activar / programar.
  --
  -- IMPORTANTE:
  -- Esto cambia la campaña a status=active,
  -- pero NO modifica public.ad_settings.interstitial_enabled.
  -- =======================================================

  update public.ad_campaigns

  set
    status =
      'active'::public.ad_campaign_status,

    starts_at =
      effective_start,

    ends_at =
      effective_end,

    updated_at =
      now()

  where id =
    p_campaign_id;


  return query

  select
    payment_row.payment_reference,
    effective_start,
    effective_end;

end;
$function$;

revoke all on function public.approve_ad_request(uuid) from public;
revoke all on function public.approve_ad_request(uuid) from anon;
grant execute on function public.approve_ad_request(uuid) to authenticated;
grant execute on function public.approve_ad_request(uuid) to service_role;

revoke all on function public.verify_ad_payment(uuid,text) from public;
revoke all on function public.verify_ad_payment(uuid,text) from anon;
grant execute on function public.verify_ad_payment(uuid,text) to authenticated;
grant execute on function public.verify_ad_payment(uuid,text) to service_role;

commit;

-- FIN J10-6C
