-- SABINAPP 1.0 | M2 | Seguridad del flujo de negocios
-- Definicion recuperada mediante pg_get_functiondef() tras las pruebas M2C/M2D/M2E.
-- Requiere el esquema y funciones auxiliares de Sabinapp ya creados.
-- No ejecutar sobre una base de datos vacia como migracion inicial.

CREATE OR REPLACE FUNCTION public.normalize_business_before_save()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$

declare
    is_admin_user boolean;

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

        if new.status not in (
            'draft',
            'pending_review'
        ) then

            new.status := 'draft';

        end if;


        new.owner_confirmed_authorization := false;

        new.is_published := false;


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


        new.is_adult_content := false;
        new.requires_age_verification := false;

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


        -- Clasificación y visibilidad administrativa.

        new.is_adult_content := old.is_adult_content;

        new.requires_age_verification :=
            old.requires_age_verification;

        new.show_in_home := old.show_in_home;

        new.show_in_search := old.show_in_search;


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
    -- 5. CONTENIDO ADULTO / RESTRINGIDO
    -- =================================================

    if new.is_adult_content = true then

        new.requires_age_verification := true;

        new.show_in_home := false;

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
