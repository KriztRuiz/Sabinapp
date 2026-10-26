-- SABINAPP M3-17B12B4C3 | Correccion del trigger de clasificacion.
-- Preparado a partir de la definicion REAL obtenida con pg_get_functiondef().
-- Requiere Supabase SQL Editor (rol postgres) y copia de seguridad previa.
-- No borra negocios, no cambia politicas RLS ni altera datos existentes.
-- IMPORTANTE: NO ejecutar junto con el parche B4C3 anterior.

BEGIN;

-- Detener si el trigger original difiere del auditado.
DO $guard$
DECLARE
    actual text;
    fingerprint text;
BEGIN
    SELECT replace(
        pg_get_functiondef('public.normalize_business_before_save()'::regprocedure),
        E'\r\n', E'\n'
    ) INTO actual;

    fingerprint := md5(actual);
    IF fingerprint IS DISTINCT FROM 'a6d729cbe3acb4edd179fc1caffc6312' THEN
        RAISE EXCEPTION
            'B4C3 abortada: el trigger ha cambiado. Huella actual: %, esperada: %',
            fingerprint,
            'a6d729cbe3acb4edd179fc1caffc6312';
    END IF;
END;
$guard$;

-- Reemplazo completo; preserva firma, SECURITY DEFINER y search_path.
CREATE OR REPLACE FUNCTION public.normalize_business_before_save()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$

declare
    is_admin_user boolean;
    v_is_adult boolean;
    v_is_active boolean;
    v_type_requires_dates boolean;
    v_check_classification boolean := false;

begin

    -- =================================================
    -- 1. IDENTIFICAR ADMINISTRADOR
    -- =================================================

    is_admin_user :=

        coalesce(
            public.has_role('admin'),
            false
        )

        or coalesce(
            public.has_permission('admin.review_businesses'),
            false
        )

        or coalesce(
            auth.role() = 'service_role',
            false
        )

        or (
            session_user = 'postgres'
            and auth.uid() is null
        );


    -- =================================================
    -- 2. NORMALIZAR SLUG
    -- =================================================

    if new.slug is null
       or trim(new.slug) = '' then

        new.slug := public.slugify(new.name);

    else

        new.slug := public.slugify(new.slug);

    end if;


    if new.slug is null
       or new.slug = '' then

        raise exception
            'El negocio necesita un slug válido.';

    end if;


    -- =================================================
    -- 3. INSERT DE USUARIO NO ADMINISTRADOR
    -- =================================================

    if tg_op = 'INSERT'
       and not is_admin_user then

        -- Nunca aceptar una publicación o revisión directa en un alta del dueño.
        new.status := 'draft';


        new.owner_confirmed_authorization := false;

        new.is_published := false;

        -- M3-16D:
        -- submitted_at es un timestamp de ciclo de vida.
        -- El propietario no puede elegirlo manualmente.
        new.submitted_at := null;


        new.approved_at := null;
        new.approved_by := null;

        new.rejected_at := null;
        new.rejected_by := null;
        new.rejection_reason := null;

        new.suspended_at := null;
        new.suspended_by := null;
        new.suspension_reason := null;

        new.published_at := null;
        new.hidden_at := null;
        new.archived_at := null;


    end if;


    -- =================================================
    -- 4. UPDATE DE USUARIO NO ADMINISTRADOR
    -- =================================================

    if tg_op = 'UPDATE'
       and not is_admin_user then

        -- Propiedad y autorización.

        new.owner_id := old.owner_id;

        new.owner_confirmed_authorization :=
            old.owner_confirmed_authorization;


        -- M3-16D:
        -- Los timestamps del ciclo de vida son administrados
        -- por la base de datos y no por el propietario.
        new.submitted_at := old.submitted_at;
        new.published_at := old.published_at;
        new.hidden_at := old.hidden_at;


        -- Historial administrativo.

        new.approved_at := old.approved_at;
        new.approved_by := old.approved_by;

        new.rejected_at := old.rejected_at;
        new.rejected_by := old.rejected_by;
        new.rejection_reason := old.rejection_reason;

        new.suspended_at := old.suspended_at;
        new.suspended_by := old.suspended_by;
        new.suspension_reason := old.suspension_reason;

        new.archived_at := old.archived_at;


        -- Visibilidad: el dueño no puede encender estas banderas manualmente.
        new.show_in_home := old.show_in_home;
        new.show_in_search := old.show_in_search;

        -- Los cambios de tipo, categoría y vigencia requieren nueva revisión.
        if new.business_type_id is distinct from old.business_type_id
            or new.category_id is distinct from old.category_id
            or new.starts_at is distinct from old.starts_at
            or new.ends_at is distinct from old.ends_at
            or new.expires_at is distinct from old.expires_at then

            if old.status not in ('draft', 'rejected', 'hidden') then
                raise exception
                    'Clasificación o vigencia no editable en el estado actual.';
            end if;

            new.show_in_home := false;
            new.show_in_search := false;

            if old.status = 'hidden' then
                new.status := 'draft';
            end if;

            -- Invalidar cualquier autorización anterior de otra clasificación.
            new.approved_at := null;
            new.approved_by := null;
            new.owner_confirmed_authorization := false;
        end if;

        -- El dueño también puede retirar un oculto a borrador sin publicarlo.
        if old.status = 'hidden' and new.status = 'draft' then
            new.show_in_home := false;
            new.show_in_search := false;
            new.approved_at := null;
            new.approved_by := null;
            new.owner_confirmed_authorization := false;
        end if;

        -- Transiciones permitidas al propietario.

        if new.status is distinct from old.status then

            if not (

                (
                    old.status in (
                        'draft',
                        'rejected',
                        'hidden',
                        'approved'
                    )

                    and new.status = 'pending_review'
                )

                or

                (
                    old.status = 'hidden'
                    and new.status = 'draft'
                )

                or

                (
                    old.status = 'approved'
                    and new.status = 'published'
                )

                or

                (
                    old.status = 'published'
                    and new.status = 'hidden'
                )

            ) then

                raise exception
                    'Transición de estado no permitida para el propietario.';

            end if;

        end if;

    end if;


    -- =================================================
    -- 5. CLASIFICACIÓN VALIDADA POR POSTGRESQL
    -- =================================================

    select bt.is_adult_related, bt.is_active, bt.requires_start_end_dates
      into v_is_adult, v_is_active, v_type_requires_dates
    from public.business_types bt
    where bt.id = new.business_type_id;

    if not found then
        raise exception 'Tipo de negocio inválido.';
    end if;

    if tg_op = 'INSERT' then
        v_check_classification := true;
    elsif tg_op = 'UPDATE' then
        v_check_classification :=
            new.business_type_id is distinct from old.business_type_id
            or new.category_id is distinct from old.category_id;
    end if;

    -- No bloquear ediciones inocuas de negocios con catálogos desactivados.
    if v_check_classification then
        if not v_is_active then
            raise exception 'El tipo de negocio no está activo.';
        end if;

        if new.category_id is not null and not exists (
            select 1
            from public.categories c
            where c.id = new.category_id
              and c.business_type_id = new.business_type_id
              and c.is_active = true
        ) then
            raise exception 'Categoría inválida para el tipo de negocio.';
        end if;

        if v_type_requires_dates and
           (new.starts_at is null or new.ends_at is null) then
            raise exception 'Este tipo de negocio requiere fechas de inicio y fin.';
        end if;
    end if;

    -- El cliente no decide la clasificación adulta ni la verificación de edad.
    new.is_adult_content := v_is_adult;
    new.requires_age_verification := v_is_adult;

    if v_is_adult then
        new.show_in_home := false;
        new.show_in_search := false;
    end if;


    -- =================================================
    -- 6. SINCRONIZAR PUBLICACIÓN
    -- =================================================

    if new.status in (
        'draft',
        'pending_review',
        'approved',
        'rejected',
        'hidden',
        'suspended',
        'archived',
        'expired'
    ) then

        new.is_published := false;

    end if;


    -- =================================================
    -- 7. FECHA DE ENVÍO A REVISIÓN
    -- =================================================

    if new.status = 'pending_review' then

        new.submitted_at :=
            coalesce(
                new.submitted_at,
                now()
            );

    end if;


    -- =================================================
    -- 8. APROBACIÓN ADMINISTRATIVA
    -- =================================================

    if new.status in (
        'approved',
        'published'
    )

    and is_admin_user then

        new.approved_at :=
            coalesce(
                new.approved_at,
                now()
            );

        new.approved_by :=
            coalesce(
                new.approved_by,
                auth.uid()
            );

    end if;


    -- =================================================
    -- 9. RECHAZO ADMINISTRATIVO
    -- =================================================

    if new.status = 'rejected'
       and is_admin_user then

        new.rejected_at :=
            coalesce(
                new.rejected_at,
                now()
            );

        new.rejected_by :=
            coalesce(
                new.rejected_by,
                auth.uid()
            );

    end if;


    -- =================================================
    -- 10. SUSPENSIÓN ADMINISTRATIVA
    -- =================================================

    if new.status = 'suspended'
       and is_admin_user then

        new.suspended_at :=
            coalesce(
                new.suspended_at,
                now()
            );

        new.suspended_by :=
            coalesce(
                new.suspended_by,
                auth.uid()
            );

        new.is_published := false;

    end if;


    -- =================================================
    -- 11. REQUISITOS DE PUBLICACIÓN
    -- =================================================

    if new.status = 'published' then

        if new.approved_at is null
           or new.approved_by is null then

            raise exception
                'No se puede publicar un negocio sin aprobación administrativa completa.';

        end if;


        if new.owner_confirmed_authorization
           is distinct from true then

            raise exception
                'No se puede publicar sin autorización confirmada por Administración.';

        end if;


        if new.is_adult_content = true then

            raise exception
                'Los negocios adultos/restringidos no pueden publicarse en el MVP.';

        end if;


        if tg_op = 'INSERT'
           or (
               tg_op = 'UPDATE'
               and old.status is distinct from 'published'
           ) then

            if new.expires_at is not null
               and new.expires_at < now() then

                raise exception
                    'No se puede publicar un negocio vencido.';

            end if;

        end if;


        new.is_published := true;

        new.published_at :=
            coalesce(
                new.published_at,
                now()
            );

    end if;


    -- =================================================
    -- 12. OCULTAMIENTO
    -- =================================================

    if new.status = 'hidden' then

        new.hidden_at :=
            coalesce(
                new.hidden_at,
                now()
            );

        new.is_published := false;


        -- CORRECCIÓN M2D:
        -- Un negocio oculto tampoco debe quedar
        -- marcado para búsqueda o portada.
        --
        -- Se aplica DESPUÉS de restaurar los campos
        -- protegidos para usuarios no administradores.

        new.show_in_search := false;

        new.show_in_home := false;

    end if;


    -- =================================================
    -- 13. ARCHIVADO
    -- =================================================

    if new.status = 'archived' then

        new.archived_at :=
            coalesce(
                new.archived_at,
                now()
            );

        new.is_published := false;

    end if;


    -- =================================================
    -- 14. EXPIRACIÓN DE NEGOCIOS TEMPORALES
    -- =================================================

    if new.ends_at is not null
       and new.expires_at is null then

        new.expires_at := new.ends_at;

    end if;


    return new;

end;

$function$;

-- Verificacion dentro de la misma transaccion: si falla, se revierte.
DO $verify$
DECLARE
    installed text;
BEGIN
    SELECT pg_get_functiondef(
        'public.normalize_business_before_save()'::regprocedure
    ) INTO installed;

    IF NOT (
        installed LIKE '%new.is_adult_content := v_is_adult;%'
        AND installed LIKE '%new.requires_age_verification := v_is_adult;%'
        AND installed LIKE '%old.status = ''hidden''%'
        AND installed LIKE '%new.owner_confirmed_authorization := false;%'
        AND installed LIKE '%new.status := ''draft'';%'
        AND installed LIKE '%new.category_id is distinct from old.category_id%'
        AND installed LIKE '%new.show_in_search := false;%'
        AND installed LIKE '%Los negocios adultos/restringidos no pueden publicarse en el MVP.%'
    ) THEN
        RAISE EXCEPTION 'B4C3 abortada: fallo la verificacion posterior del trigger.';
    END IF;
END;
$verify$;

COMMIT;
