-- =========================================================
-- SABINAPP — M3-17B3
-- Reserva atomica de generaciones de noticias
--
-- Aplicado previamente en Supabase.
-- No volver a ejecutar durante esta subfase.
-- =========================================================

CREATE OR REPLACE FUNCTION public.reserve_admin_news_generation(
    p_search_query_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_now timestamptz;
    v_run_id uuid;
BEGIN
    IF auth.uid() IS NULL
       OR NOT COALESCE(public.has_role('admin'), false)
    THEN
        RAISE EXCEPTION
            'No tienes permiso para generar noticias.'
            USING ERRCODE = '42501';
    END IF;

    IF p_search_query_count IS NULL
       OR p_search_query_count < 1
       OR p_search_query_count > 10
    THEN
        RAISE EXCEPTION
            'La cantidad de busquedas debe estar entre 1 y 10.'
            USING ERRCODE = '22023';
    END IF;

    -- Serializar reservas concurrentes.
    PERFORM pg_catalog.pg_advisory_xact_lock(17017, 1703);

    v_now := pg_catalog.clock_timestamp();

    -- Liberar reservas abandonadas.
    UPDATE public.news_fetch_runs
    SET
        status = 'failed',
        finished_at = GREATEST(v_now, started_at),
        error_message = COALESCE(
            NULLIF(error_message, ''),
            'Ejecucion abandonada: supero 10 minutos.'
        )
    WHERE status = 'running'
      AND started_at <= v_now - INTERVAL '10 minutes';

    -- Impedir otra generacion activa.
    IF EXISTS (
        SELECT 1
        FROM public.news_fetch_runs
        WHERE status = 'running'
    ) THEN
        RETURN pg_catalog.jsonb_build_object(
            'ok', false,
            'reason', 'already_running',
            'run_id', null
        );
    END IF;

    -- Limitar generaciones administrativas repetidas.
    IF EXISTS (
        SELECT 1
        FROM public.news_fetch_runs
        WHERE trigger_source = 'admin'
          AND started_at > v_now - INTERVAL '5 minutes'
    ) THEN
        RETURN pg_catalog.jsonb_build_object(
            'ok', false,
            'reason', 'cooldown',
            'run_id', null
        );
    END IF;

    INSERT INTO public.news_fetch_runs (
        started_at,
        status,
        trigger_source,
        search_query_count,
        created_by
    )
    VALUES (
        v_now,
        'running',
        'admin',
        p_search_query_count,
        auth.uid()
    )
    RETURNING id INTO v_run_id;

    RETURN pg_catalog.jsonb_build_object(
        'ok', true,
        'reason', null,
        'run_id', v_run_id
    );
END;
$function$;

REVOKE ALL
ON FUNCTION public.reserve_admin_news_generation(integer)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.reserve_admin_news_generation(integer)
TO authenticated;
