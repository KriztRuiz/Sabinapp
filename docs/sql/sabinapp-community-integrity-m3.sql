-- SABINAPP 1.0
-- M3-16J2B
--
-- Integridad de:
-- - reviews
-- - news_comments
-- - reports
-- - can_write_business_review()
--
-- Hallazgos confirmados por M3-16J2A:
--
-- reviews:
-- - timestamps falsificables;
-- - campos de moderación falsificables;
-- - business_id modificable;
-- - cooldown evadible mediante updated_at falso.
--
-- news_comments:
-- - timestamps falsificables;
-- - campos de moderación falsificables.
--
-- reports:
-- - created_at falsificable;
-- - self-report directo de review/news_comment;
-- - reported_user_id incoherente;
-- - target_type incoherente;
-- - target modificable después del envío.
--
-- privacy:
-- - can_write_business_review() permitía consultar
--   información temporal sobre otros usuarios.


BEGIN;


-- ============================================================
-- 1. REVIEWS
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_review_before_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    is_admin_user boolean;
BEGIN

    is_admin_user :=
        COALESCE(
            public.has_permission('admin.manage_reports'),
            false
        )
        OR COALESCE(
            auth.role() = 'service_role',
            false
        )
        OR (
            session_user = 'postgres'
            AND auth.uid() IS NULL
        );


    -- --------------------------------------------------------
    -- INSERT
    -- --------------------------------------------------------

    IF TG_OP = 'INSERT' THEN

        IF NOT is_admin_user THEN

            -- El autor siempre es la sesión autenticada.
            NEW.user_id := auth.uid();

            -- Una reseña normal nace publicada.
            -- Moderación sólo puede modificar este estado.
            NEW.status :=
                'published'::public.review_status;

            NEW.hidden_reason := NULL;
            NEW.moderated_by := NULL;
            NEW.moderated_at := NULL;

            -- Timestamps administrados por PostgreSQL.
            NEW.created_at := now();
            NEW.updated_at := now();

        END IF;

        RETURN NEW;

    END IF;


    -- --------------------------------------------------------
    -- UPDATE
    -- --------------------------------------------------------

    -- Autor, negocio y fecha original son identidad histórica
    -- de la reseña y no pueden cambiarse después de crearla.
    NEW.user_id := OLD.user_id;
    NEW.business_id := OLD.business_id;
    NEW.created_at := OLD.created_at;


    IF NOT is_admin_user THEN

        -- El usuario no puede auto-moderarse ni falsificar
        -- campos administrativos.
        NEW.status := OLD.status;
        NEW.hidden_reason := OLD.hidden_reason;
        NEW.moderated_by := OLD.moderated_by;
        NEW.moderated_at := OLD.moderated_at;

    END IF;


    RETURN NEW;

END;
$function$;


DROP TRIGGER IF EXISTS
    normalize_review_before_save
ON public.reviews;


CREATE TRIGGER normalize_review_before_save
BEFORE INSERT OR UPDATE
ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.normalize_review_before_save();


-- ============================================================
-- 2. COOLDOWN / PRIVACIDAD DE REVIEWS
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_write_business_review(
    target_business_id uuid,
    target_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$

    SELECT
        CASE

            -- Nunca responder consultas anónimas.
            WHEN auth.uid() IS NULL THEN
                false

            -- Un usuario sólo puede consultar su propio
            -- estado de cooldown.
            WHEN target_user_id IS DISTINCT FROM auth.uid() THEN
                false

            ELSE NOT EXISTS (
                SELECT 1

                FROM public.reviews AS r

                WHERE r.business_id = target_business_id

                  AND r.user_id = auth.uid()

                  AND r.status <>
                      'removed'::public.review_status

                  AND r.updated_at >
                      now() - interval '8 hours'
            )

        END;

$function$;


-- No existe una razón pública para que anon invoque
-- directamente este helper SECURITY DEFINER.

REVOKE ALL
ON FUNCTION public.can_write_business_review(uuid, uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.can_write_business_review(uuid, uuid)
FROM anon;


-- RLS de reviews sí necesita la función para usuarios
-- autenticados.

GRANT EXECUTE
ON FUNCTION public.can_write_business_review(uuid, uuid)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.can_write_business_review(uuid, uuid)
TO service_role;


-- ============================================================
-- 3. NEWS COMMENTS
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_news_comment_before_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    is_admin_user boolean;
BEGIN

    is_admin_user :=
        COALESCE(
            public.has_permission('admin.manage_reports'),
            false
        )
        OR COALESCE(
            auth.role() = 'service_role',
            false
        )
        OR (
            session_user = 'postgres'
            AND auth.uid() IS NULL
        );


    -- --------------------------------------------------------
    -- INSERT
    -- --------------------------------------------------------

    IF TG_OP = 'INSERT' THEN

        IF NOT is_admin_user THEN

            NEW.user_id := auth.uid();

            NEW.status :=
                'published'::public.news_comment_status;

            NEW.hidden_reason := NULL;
            NEW.moderated_by := NULL;
            NEW.moderated_at := NULL;

            NEW.created_at := now();
            NEW.updated_at := now();

        END IF;

        RETURN NEW;

    END IF;


    -- --------------------------------------------------------
    -- UPDATE
    -- --------------------------------------------------------

    -- La autoría, noticia y fecha de creación no cambian.
    NEW.user_id := OLD.user_id;
    NEW.news_id := OLD.news_id;
    NEW.created_at := OLD.created_at;


    IF NOT is_admin_user THEN

        NEW.status := OLD.status;
        NEW.hidden_reason := OLD.hidden_reason;
        NEW.moderated_by := OLD.moderated_by;
        NEW.moderated_at := OLD.moderated_at;

    END IF;


    RETURN NEW;

END;
$function$;


DROP TRIGGER IF EXISTS
    normalize_news_comment_before_save
ON public.news_comments;


CREATE TRIGGER normalize_news_comment_before_save
BEFORE INSERT OR UPDATE
ON public.news_comments
FOR EACH ROW
EXECUTE FUNCTION public.normalize_news_comment_before_save();


-- ============================================================
-- 4. REPORTS
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_report_before_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    is_admin_user boolean;

    target_user_id uuid;
    target_business_id uuid;
BEGIN

    is_admin_user :=
        COALESCE(
            public.has_role('admin'),
            false
        )
        OR COALESCE(
            public.has_permission('admin.manage_reports'),
            false
        )
        OR COALESCE(
            auth.role() = 'service_role',
            false
        )
        OR (
            session_user = 'postgres'
            AND auth.uid() IS NULL
        );


    -- ========================================================
    -- INSERT
    -- ========================================================

    IF TG_OP = 'INSERT' THEN

        -- Mantener comportamiento existente:
        -- si un usuario autenticado no envía reporter_id,
        -- se utiliza auth.uid().
        IF NEW.reporter_id IS NULL THEN
            NEW.reporter_id := auth.uid();
        END IF;


        IF NOT is_admin_user THEN

            NEW.status :=
                'new'::public.report_status;

            NEW.reviewed_by := NULL;
            NEW.reviewed_at := NULL;
            NEW.admin_notes := NULL;

            NEW.created_at := now();
            NEW.updated_at := now();

        END IF;


        -- ----------------------------------------------------
        -- Reporte de reseña
        -- ----------------------------------------------------

        IF NEW.target_type =
           'review'::public.report_target_type THEN

            IF NEW.review_id IS NULL THEN
                RAISE EXCEPTION
                    'El reporte de reseña necesita una reseña válida.';
            END IF;


            SELECT
                r.user_id,
                r.business_id

            INTO
                target_user_id,
                target_business_id

            FROM public.reviews AS r

            WHERE r.id = NEW.review_id;


            IF NOT FOUND THEN
                RAISE EXCEPTION
                    'No se encontró la reseña reportada.';
            END IF;


            IF NEW.reporter_id IS NULL THEN
                RAISE EXCEPTION
                    'Debes iniciar sesión para reportar una reseña.';
            END IF;


            IF NOT is_admin_user
               AND NEW.reporter_id = target_user_id THEN

                RAISE EXCEPTION
                    'No puedes reportar tu propia reseña.';

            END IF;


            -- Autor y negocio se derivan del target real,
            -- nunca del cliente.
            NEW.reported_user_id := target_user_id;
            NEW.business_id := target_business_id;

            -- Un reporte de reseña no puede apuntar
            -- simultáneamente a otros tipos de contenido.
            NEW.news_comment_id := NULL;
            NEW.contact_method_id := NULL;
            NEW.media_id := NULL;
            NEW.item_id := NULL;


        -- ----------------------------------------------------
        -- Reporte de comentario de noticia
        -- ----------------------------------------------------

        ELSIF NEW.target_type =
              'news_comment'::public.report_target_type THEN

            IF NEW.news_comment_id IS NULL THEN
                RAISE EXCEPTION
                    'El reporte de comentario necesita un comentario válido.';
            END IF;


            SELECT
                nc.user_id

            INTO
                target_user_id

            FROM public.news_comments AS nc

            WHERE nc.id = NEW.news_comment_id;


            IF NOT FOUND THEN
                RAISE EXCEPTION
                    'No se encontró el comentario reportado.';
            END IF;


            IF NEW.reporter_id IS NULL THEN
                RAISE EXCEPTION
                    'Debes iniciar sesión para reportar un comentario.';
            END IF;


            IF NOT is_admin_user
               AND NEW.reporter_id = target_user_id THEN

                RAISE EXCEPTION
                    'No puedes reportar tu propio comentario.';

            END IF;


            NEW.reported_user_id := target_user_id;

            NEW.review_id := NULL;
            NEW.business_id := NULL;
            NEW.contact_method_id := NULL;
            NEW.media_id := NULL;
            NEW.item_id := NULL;

        END IF;


    -- ========================================================
    -- UPDATE
    -- ========================================================

    ELSE

        -- La identidad y el objetivo de un reporte forman
        -- parte de su historial y son inmutables.
        NEW.reporter_id := OLD.reporter_id;
        NEW.target_type := OLD.target_type;

        NEW.business_id := OLD.business_id;
        NEW.contact_method_id := OLD.contact_method_id;
        NEW.media_id := OLD.media_id;
        NEW.item_id := OLD.item_id;

        NEW.reported_user_id := OLD.reported_user_id;

        NEW.review_id := OLD.review_id;
        NEW.news_comment_id := OLD.news_comment_id;

        NEW.created_at := OLD.created_at;


        -- Sólo administración puede modificar el estado
        -- de moderación y sus metadatos.
        IF NOT is_admin_user THEN

            NEW.status := OLD.status;
            NEW.reviewed_by := OLD.reviewed_by;
            NEW.reviewed_at := OLD.reviewed_at;
            NEW.admin_notes := OLD.admin_notes;

        END IF;

    END IF;


    -- ========================================================
    -- NORMALIZACIÓN DE TEXTO
    -- ========================================================

    NEW.description := trim(NEW.description);


    IF NEW.title IS NOT NULL THEN
        NEW.title := trim(NEW.title);
    END IF;


    IF NEW.reporter_contact IS NOT NULL THEN
        NEW.reporter_contact :=
            trim(NEW.reporter_contact);
    END IF;


    -- ========================================================
    -- METADATOS ADMINISTRATIVOS
    -- ========================================================

    IF is_admin_user
       AND NEW.status <> 'new'::public.report_status THEN

        NEW.reviewed_by :=
            COALESCE(
                NEW.reviewed_by,
                auth.uid()
            );

        NEW.reviewed_at :=
            COALESCE(
                NEW.reviewed_at,
                now()
            );

    END IF;


    RETURN NEW;

END;
$function$;


COMMIT;


-- ============================================================
-- 5. REPORTS: SUPERFICIE PERMITIDA EN SABINAPP 1.0
--
-- M3-16J3B confirmó que un usuario authenticated podía crear
-- directamente tipos generales no utilizados por la aplicación:
--
-- - business
-- - contact_method
-- - media
-- - item
-- - user
-- - platform
-- - other
--
-- También era posible crear semánticas incoherentes, por ejemplo
-- target_type='business' sin business_id.
--
-- Sabinapp 1.0 únicamente expone actualmente flujos públicos
-- para:
--
-- - review
-- - news_comment
--
-- Los demás tipos permanecen definidos en el enum para futura
-- evolución, pero no quedan habilitados para escritura pública.
-- ============================================================


BEGIN;


DROP POLICY IF EXISTS
    reports_insert_public
ON public.reports;


CREATE POLICY reports_insert_authenticated_community
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (

    auth.uid() IS NOT NULL

    AND reporter_id = auth.uid()

    AND public.is_profile_complete(
        auth.uid()
    )

    AND status =
        'new'::public.report_status

    AND target_type IN (
        'review'::public.report_target_type,
        'news_comment'::public.report_target_type
    )

);


-- El cliente anónimo no necesita escribir directamente
-- en reports en Sabinapp 1.0.

REVOKE INSERT
ON TABLE public.reports
FROM PUBLIC;

REVOKE INSERT
ON TABLE public.reports
FROM anon;


-- authenticated conserva el flujo comunitario normal.
-- service_role conserva acceso explícito de backend.

GRANT INSERT
ON TABLE public.reports
TO authenticated;

GRANT INSERT
ON TABLE public.reports
TO service_role;


COMMIT;
