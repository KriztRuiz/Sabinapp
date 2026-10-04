-- SABINAPP 1.0 | M3-16K3F
--
-- Anti-spam comunitario.
--
-- Hallazgos confirmados por M3-16K3D:
--
-- 1. Un usuario podía crear dos news_comments consecutivos
--    sin ningún tiempo mínimo de espera.
--
-- 2. Un usuario podía crear varios reports activos sobre
--    exactamente el mismo review o news_comment.
--
-- Reglas:
--
-- - news_comments:
--     30 segundos de cooldown global por usuario.
--
-- - reports:
--     máximo un reporte activo por usuario y objetivo.
--
-- Reporte activo:
--     status IN ('new', 'in_review')
--
-- Los estados resolved, rejected y closed permiten que
-- posteriormente pueda existir un nuevo reporte.
--
-- La protección vive en PostgreSQL para que no pueda
-- evadirse accediendo directamente a Supabase.


BEGIN;


-- ============================================================
-- 1. NEWS COMMENTS
-- ============================================================
--
-- Se conserva la normalización existente y se agrega:
--
-- - lock transaccional por usuario;
-- - comprobación de comentarios creados en los últimos
--   30 segundos.
--
-- El advisory lock evita que dos requests concurrentes del
-- mismo usuario consulten simultáneamente y ambas pasen.
-- ============================================================

CREATE OR REPLACE FUNCTION
public.normalize_news_comment_before_save()
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
            public.has_permission(
                'admin.manage_reports'
            ),
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


    IF TG_OP = 'INSERT' THEN

        IF NOT is_admin_user THEN

            NEW.user_id := auth.uid();


            IF NEW.user_id IS NULL THEN

                RAISE EXCEPTION
                    'Debes iniciar sesión para comentar.';

            END IF;


            NEW.status :=
                'published'::public.news_comment_status;

            NEW.hidden_reason := NULL;
            NEW.moderated_by := NULL;
            NEW.moderated_at := NULL;

            NEW.created_at := now();
            NEW.updated_at := now();


            -- ------------------------------------------------
            -- Serializar inserts del mismo usuario.
            -- ------------------------------------------------

            PERFORM pg_advisory_xact_lock(
                hashtextextended(
                    NEW.user_id::text,
                    0
                )
            );


            -- ------------------------------------------------
            -- Cooldown global de 30 segundos.
            -- ------------------------------------------------

            IF EXISTS (

                SELECT 1

                FROM public.news_comments AS nc

                WHERE nc.user_id =
                        NEW.user_id

                  AND nc.created_at >
                        now() - interval '30 seconds'

            ) THEN

                RAISE EXCEPTION
                    'Espera 30 segundos antes de publicar otro comentario.';

            END IF;

        END IF;


        RETURN NEW;

    END IF;


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


-- ============================================================
-- 2. VALIDAR QUE NO EXISTAN DUPLICADOS ACTIVOS PREVIOS
-- ============================================================
--
-- Abortamos toda la migración si los datos existentes
-- impedirían crear los índices únicos.
-- ============================================================

DO $$
BEGIN

    IF EXISTS (

        SELECT 1

        FROM public.reports AS r

        WHERE r.target_type =
                'review'::public.report_target_type

          AND r.reporter_id IS NOT NULL
          AND r.review_id IS NOT NULL

          AND r.status IN (
              'new'::public.report_status,
              'in_review'::public.report_status
          )

        GROUP BY
            r.reporter_id,
            r.review_id

        HAVING count(*) > 1

    ) THEN

        RAISE EXCEPTION
            'M3-16K3F abortado: existen reportes activos duplicados sobre reviews.';

    END IF;


    IF EXISTS (

        SELECT 1

        FROM public.reports AS r

        WHERE r.target_type =
                'news_comment'::public.report_target_type

          AND r.reporter_id IS NOT NULL
          AND r.news_comment_id IS NOT NULL

          AND r.status IN (
              'new'::public.report_status,
              'in_review'::public.report_status
          )

        GROUP BY
            r.reporter_id,
            r.news_comment_id

        HAVING count(*) > 1

    ) THEN

        RAISE EXCEPTION
            'M3-16K3F abortado: existen reportes activos duplicados sobre news_comments.';

    END IF;

END
$$;


-- ============================================================
-- 3. REPORTS DE REVIEWS
-- ============================================================
--
-- Un mismo reportante sólo puede mantener un reporte activo
-- sobre una review concreta.
-- ============================================================

DROP INDEX IF EXISTS
    public.reports_one_active_review_per_reporter_idx;


CREATE UNIQUE INDEX
    reports_one_active_review_per_reporter_idx

ON public.reports (
    reporter_id,
    review_id
)

WHERE
    target_type =
        'review'::public.report_target_type

    AND reporter_id IS NOT NULL
    AND review_id IS NOT NULL

    AND status IN (
        'new'::public.report_status,
        'in_review'::public.report_status
    );


-- ============================================================
-- 4. REPORTS DE NEWS COMMENTS
-- ============================================================

DROP INDEX IF EXISTS
    public.reports_one_active_news_comment_per_reporter_idx;


CREATE UNIQUE INDEX
    reports_one_active_news_comment_per_reporter_idx

ON public.reports (
    reporter_id,
    news_comment_id
)

WHERE
    target_type =
        'news_comment'::public.report_target_type

    AND reporter_id IS NOT NULL
    AND news_comment_id IS NOT NULL

    AND status IN (
        'new'::public.report_status,
        'in_review'::public.report_status
    );


COMMIT;
