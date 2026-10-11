-- =========================================================
-- SABINAPP — M3-17B4
-- Publicacion atomica de candidatos de noticias
--
-- Funcion aplicada y probada previamente en Supabase.
-- No volver a ejecutar durante esta subfase.
-- =========================================================

CREATE OR REPLACE FUNCTION public.publish_news_candidate_atomic(
    p_candidate_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_candidate public.news_candidates%ROWTYPE;
    v_news_id uuid;
BEGIN
    -- Solo administradores autenticados.
    IF auth.uid() IS NULL
       OR NOT COALESCE(public.has_role('admin'), false)
    THEN
        RAISE EXCEPTION
            'No tienes permiso para publicar noticias.'
            USING ERRCODE = '42501';
    END IF;

    IF p_candidate_id IS NULL THEN
        RAISE EXCEPTION
            'Falta el identificador del candidato.'
            USING ERRCODE = '22023';
    END IF;

    -- Bloquear el candidato hasta terminar la transaccion.
    SELECT *
    INTO v_candidate
    FROM public.news_candidates
    WHERE id = p_candidate_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'No encontramos el candidato de noticia.'
            USING ERRCODE = 'P0002';
    END IF;

    -- Evitar una segunda publicacion.
    IF v_candidate.status = 'published'
       OR v_candidate.published_news_id IS NOT NULL
    THEN
        RAISE EXCEPTION
            'Este candidato ya fue publicado.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Solo publicar candidatos pendientes o aprobados.
    IF v_candidate.status NOT IN (
        'candidate',
        'needs_review',
        'approved'
    ) THEN
        RAISE EXCEPTION
            'Este candidato no esta disponible para publicacion.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Insertar noticia.
    INSERT INTO public.local_news (
        title,
        summary,
        source_name,
        source_url,
        published_at,
        is_active,
        expires_at
    )
    VALUES (
        v_candidate.title,
        v_candidate.summary,
        v_candidate.source_name,
        v_candidate.source_url,
        COALESCE(
            v_candidate.source_published_at,
            pg_catalog.clock_timestamp()
        ),
        true,
        NULL
    )
    ON CONFLICT (source_url)
    DO NOTHING
    RETURNING id INTO v_news_id;

    -- Si la fuente ya existe, marcar el candidato
    -- como duplicado sin insertar otra noticia.
    IF v_news_id IS NULL THEN
        UPDATE public.news_candidates
        SET
            status = 'duplicate',
            rejection_reason =
                'Ya existe una noticia publica con la misma fuente.'
        WHERE id = p_candidate_id
          AND published_news_id IS NULL
          AND status IN (
              'candidate',
              'needs_review',
              'approved'
          );

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'No se pudo marcar el candidato como duplicado.'
                USING ERRCODE = 'P0001';
        END IF;

        RETURN pg_catalog.jsonb_build_object(
            'ok', false,
            'reason', 'duplicate',
            'candidateId', p_candidate_id
        );
    END IF;

    -- Vincular la noticia publicada al candidato.
    UPDATE public.news_candidates
    SET
        status = 'published',
        published_news_id = v_news_id,
        rejection_reason = NULL
    WHERE id = p_candidate_id
      AND published_news_id IS NULL
      AND status IN (
          'candidate',
          'needs_review',
          'approved'
      );

    -- Si falla esta actualizacion, PostgreSQL
    -- revierte tambien la insercion en local_news.
    IF NOT FOUND THEN
        RAISE EXCEPTION
            'No se pudo actualizar el candidato publicado.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'ok', true,
        'candidateId', p_candidate_id,
        'publishedNewsId', v_news_id,
        'title', v_candidate.title,
        'sourceUrl', v_candidate.source_url
    );
END;
$function$;

-- Prohibir ejecucion anonima.
REVOKE ALL
ON FUNCTION public.publish_news_candidate_atomic(uuid)
FROM PUBLIC, anon;

-- Permitir llamada desde sesiones autenticadas.
-- La funcion verifica el rol admin y respeta RLS.
GRANT EXECUTE
ON FUNCTION public.publish_news_candidate_atomic(uuid)
TO authenticated;
