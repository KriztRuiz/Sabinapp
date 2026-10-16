-- =========================================================
-- SABINAPP - M3-17B7C3
-- Funciones de almacenamiento atomico de noticias
--
-- Respaldo de las funciones instaladas y probadas en Supabase
-- durante M3-17B7C3A y M3-17B7C3C1.
--
-- INSTALACION: ejecutar el archivo completo en Supabase SQL Editor.
-- No insertar ni modificar filas de noticias durante la instalacion.
-- No volver a aplicar en produccion sin revisar diferencias.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.complete_admin_news_generation(
    p_run_id uuid,
    p_model_name text,
    p_search_query_count integer,
    p_raw_text text,
    p_candidates jsonb,
    p_candidates_found integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_run public.news_fetch_runs%ROWTYPE;
    v_candidate jsonb;
    v_sources jsonb;
    v_source jsonb;
    v_candidate_id uuid;
    v_source_id uuid;
    v_dedupe_key text;
    v_candidates_to_store integer;
    v_candidates_stored integer := 0;
    v_duplicates_skipped integer := 0;
    v_sources_stored integer := 0;
    v_has_primary boolean;
BEGIN
    IF auth.uid() IS NULL
       OR NOT COALESCE(public.has_role('admin'), false)
    THEN
        RAISE EXCEPTION
            'No tienes permiso para completar noticias.'
            USING ERRCODE = '42501';
    END IF;

    IF p_run_id IS NULL
       OR p_model_name IS NULL
       OR length(btrim(p_model_name)) NOT BETWEEN 1 AND 120
       OR p_search_query_count IS NULL
       OR p_search_query_count NOT BETWEEN 1 AND 10
       OR p_raw_text IS NULL
       OR length(p_raw_text) > 500000
       OR p_candidates IS NULL
       OR jsonb_typeof(p_candidates) <> 'array'
    THEN
        RAISE EXCEPTION
            'Parametros invalidos para completar noticias.'
            USING ERRCODE = '22023';
    END IF;

    v_candidates_to_store := jsonb_array_length(p_candidates);

    IF v_candidates_to_store > 10
       OR p_candidates_found IS NULL
       OR p_candidates_found < v_candidates_to_store
       OR p_candidates_found > 100
    THEN
        RAISE EXCEPTION
            'Cantidad de candidatos invalida.'
            USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_run
    FROM public.news_fetch_runs
    WHERE id = p_run_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'No encontramos la ejecucion reservada.'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_run.status <> 'running'
       OR v_run.trigger_source <> 'admin'
       OR v_run.created_by IS DISTINCT FROM auth.uid()
    THEN
        RAISE EXCEPTION
            'La ejecucion no esta disponible para completarse.'
            USING ERRCODE = 'P0001';
    END IF;

    FOR v_candidate IN
        SELECT value
        FROM jsonb_array_elements(p_candidates)
    LOOP
        IF jsonb_typeof(v_candidate) <> 'object' THEN
            RAISE EXCEPTION
                'Formato de candidato invalido.'
                USING ERRCODE = '22023';
        END IF;

        v_dedupe_key := NULLIF(
            btrim(v_candidate ->> 'dedupeKey'),
            ''
        );

        IF v_dedupe_key IS NULL
           OR length(v_dedupe_key) NOT BETWEEN 8 AND 200
        THEN
            RAISE EXCEPTION
                'Clave de deduplicacion invalida.'
                USING ERRCODE = '22023';
        END IF;

        v_candidate_id := NULL;

        INSERT INTO public.news_candidates (
            fetch_run_id,
            title,
            summary,
            source_name,
            source_url,
            source_published_at,
            local_relevance,
            relevance_score,
            confidence_score,
            status,
            dedupe_key,
            ai_notes,
            raw_payload
        )
        VALUES (
            p_run_id,
            btrim(COALESCE(v_candidate ->> 'title', '')),
            btrim(COALESCE(v_candidate ->> 'summary', '')),
            btrim(COALESCE(v_candidate ->> 'sourceName', '')),
            btrim(COALESCE(v_candidate ->> 'sourceUrl', '')),
            NULLIF(
                v_candidate ->> 'sourcePublishedAt',
                ''
            )::timestamptz,
            v_candidate ->> 'localRelevance',
            COALESCE(
                NULLIF(v_candidate ->> 'relevanceScore', '')::numeric,
                0
            ),
            COALESCE(
                NULLIF(v_candidate ->> 'confidenceScore', '')::numeric,
                0
            ),
            CASE
                WHEN COALESCE(
                    NULLIF(v_candidate ->> 'relevanceScore', '')::numeric,
                    0
                ) >= 0.85
                AND COALESCE(
                    NULLIF(v_candidate ->> 'confidenceScore', '')::numeric,
                    0
                ) >= 0.85
                THEN 'needs_review'
                ELSE 'candidate'
            END,
            v_dedupe_key,
            v_candidate ->> 'aiNotes',
            v_candidate
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_candidate_id;

        IF v_candidate_id IS NULL THEN
            v_duplicates_skipped := v_duplicates_skipped + 1;
            CONTINUE;
        END IF;

        v_sources := v_candidate -> 'sources';

        IF v_sources IS NULL
           OR jsonb_typeof(v_sources) <> 'array'
           OR jsonb_array_length(v_sources) = 0
        THEN
            v_sources := jsonb_build_array(
                jsonb_build_object(
                    'sourceName', v_candidate ->> 'sourceName',
                    'sourceUrl', v_candidate ->> 'sourceUrl',
                    'sourceTitle', v_candidate ->> 'title',
                    'sourcePublishedAt',
                        v_candidate ->> 'sourcePublishedAt',
                    'excerpt', NULL,
                    'isPrimary', true
                )
            );
        END IF;

        v_has_primary := false;

        FOR v_source IN
            SELECT item.value
            FROM jsonb_array_elements(v_sources)
                WITH ORDINALITY AS item(value, position)
            ORDER BY
                CASE
                    WHEN item.value ->> 'isPrimary' = 'true'
                    THEN 0
                    ELSE 1
                END,
                item.position
        LOOP
            IF jsonb_typeof(v_source) <> 'object' THEN
                RAISE EXCEPTION
                    'Formato de fuente invalido.'
                    USING ERRCODE = '22023';
            END IF;

            v_source_id := NULL;

            INSERT INTO public.news_candidate_sources (
                candidate_id,
                source_name,
                source_url,
                source_title,
                source_published_at,
                excerpt,
                is_primary
            )
            VALUES (
                v_candidate_id,
                btrim(COALESCE(
                    v_source ->> 'sourceName',
                    ''
                )),
                btrim(COALESCE(
                    v_source ->> 'sourceUrl',
                    ''
                )),
                v_source ->> 'sourceTitle',
                NULLIF(
                    v_source ->> 'sourcePublishedAt',
                    ''
                )::timestamptz,
                v_source ->> 'excerpt',
                NOT v_has_primary
            )
            ON CONFLICT DO NOTHING
            RETURNING id INTO v_source_id;

            IF v_source_id IS NOT NULL THEN
                v_sources_stored := v_sources_stored + 1;
                v_has_primary := true;
            END IF;
        END LOOP;

        IF NOT v_has_primary THEN
            RAISE EXCEPTION
                'No se pudo guardar una fuente del candidato.'
                USING ERRCODE = 'P0001';
        END IF;

        v_candidates_stored := v_candidates_stored + 1;
    END LOOP;

    UPDATE public.news_fetch_runs
    SET
        status = 'completed',
        finished_at = GREATEST(
            pg_catalog.clock_timestamp(),
            v_run.started_at
        ),
        model_name = btrim(p_model_name),
        search_query_count = p_search_query_count,
        source_count = v_sources_stored,
        candidates_found = p_candidates_found,
        candidates_published = 0,
        error_message = NULL,
        raw_result = jsonb_build_object(
            'rawText', p_raw_text,
            'candidatesReturned', p_candidates_found
        )
    WHERE id = p_run_id
      AND status = 'running';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'No pudimos completar la ejecucion.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN jsonb_build_object(
        'fetchRunId', p_run_id,
        'candidatesFound', p_candidates_found,
        'candidatesStored', v_candidates_stored,
        'duplicatesSkipped', v_duplicates_skipped,
        'candidatesPublished', 0
    );
END;
$function$;

REVOKE ALL
ON FUNCTION public.complete_admin_news_generation(
    uuid, text, integer, text, jsonb, integer
)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.complete_admin_news_generation(
    uuid, text, integer, text, jsonb, integer
)
TO authenticated;

CREATE OR REPLACE FUNCTION public.fail_admin_news_generation(
    p_run_id uuid,
    p_error_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_updated_id uuid;
BEGIN
    IF auth.uid() IS NULL
       OR NOT COALESCE(public.has_role('admin'), false)
    THEN
        RAISE EXCEPTION
            'No tienes permiso para administrar ejecuciones.'
            USING ERRCODE = '42501';
    END IF;

    IF p_run_id IS NULL THEN
        RAISE EXCEPTION
            'Falta el identificador de ejecución.'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.news_fetch_runs AS r
    SET
        status = 'failed',
        finished_at = GREATEST(
            pg_catalog.clock_timestamp(),
            r.started_at
        ),
        error_message = LEFT(
            COALESCE(
                NULLIF(BTRIM(p_error_message), ''),
                'Fallo durante la generación de noticias.'
            ),
            500
        )
    WHERE r.id = p_run_id
      AND r.status = 'running'
      AND r.trigger_source = 'admin'
      AND r.created_by = auth.uid()
    RETURNING r.id INTO v_updated_id;

    RETURN pg_catalog.jsonb_build_object(
        'ok', v_updated_id IS NOT NULL,
        'runId', p_run_id,
        'changed', v_updated_id IS NOT NULL
    );
END;
$function$;

REVOKE ALL
ON FUNCTION public.fail_admin_news_generation(uuid, text)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.fail_admin_news_generation(uuid, text)
TO authenticated;

COMMIT;
