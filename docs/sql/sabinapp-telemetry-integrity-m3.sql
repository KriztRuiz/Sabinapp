-- SABINAPP 1.0 | M3 | Integridad de telemetría
--
-- Hallazgos confirmados:
--
-- contact_clicks:
-- - created_at podía ser falsificado.
-- - type podía diferir del tipo real de contact_method.
--
-- page_views:
-- - created_at podía ser falsificado.
--
-- search_logs:
-- - created_at podía ser falsificado.
-- - clicked_business_id podía apuntar a un negocio no visible públicamente.
--
-- result_count permanece como dato suministrado por cliente.
-- No se considera confiable para decisiones de seguridad.


-- ============================================================
-- 1. TIMESTAMP DE TELEMETRÍA
--
-- contact_clicks y page_views:
-- - INSERT: created_at = now()
-- - UPDATE: created_at conserva su valor original
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_telemetry_created_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := now();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.created_at := OLD.created_at;
    END IF;

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
    protect_contact_clicks_created_at
ON public.contact_clicks;

CREATE TRIGGER protect_contact_clicks_created_at
BEFORE INSERT OR UPDATE
ON public.contact_clicks
FOR EACH ROW
EXECUTE FUNCTION public.protect_telemetry_created_at();


DROP TRIGGER IF EXISTS
    protect_page_views_created_at
ON public.page_views;

CREATE TRIGGER protect_page_views_created_at
BEFORE INSERT OR UPDATE
ON public.page_views
FOR EACH ROW
EXECUTE FUNCTION public.protect_telemetry_created_at();


-- ============================================================
-- 2. CONTACT CLICKS
--
-- Un contact_method referenciado debe:
-- - pertenecer al mismo negocio;
-- - estar activo;
-- - estar aprobado;
-- - tener el mismo type que el evento registrado.
-- ============================================================

DROP POLICY IF EXISTS
    contact_clicks_insert_public
ON public.contact_clicks;

CREATE POLICY contact_clicks_insert_public
ON public.contact_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses AS b
        WHERE b.id = contact_clicks.business_id
          AND b.status = 'published'::public.business_status
          AND b.is_published = true
          AND b.is_adult_content = false
          AND b.show_in_search = true
          AND (
              b.expires_at IS NULL
              OR b.expires_at >= now()
          )
    )

    AND (
        contact_method_id IS NULL

        OR EXISTS (
            SELECT 1
            FROM public.contact_methods AS cm
            WHERE cm.id = contact_clicks.contact_method_id
              AND cm.business_id = contact_clicks.business_id
              AND cm.is_active = true
              AND cm.is_approved = true
              AND cm.type = contact_clicks.type
        )
    )

    AND (
        viewer_id IS NULL
        OR viewer_id = auth.uid()
    )
);


-- ============================================================
-- 3. SEARCH LOGS
--
-- Se conserva la normalización existente:
-- - trim(query)
-- - normalized_query = slugify(query)
-- - user_id NULL -> auth.uid()
--
-- Se agrega:
-- - created_at administrado por PostgreSQL.
-- - en UPDATE se conserva created_at original.
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_search_log_before_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.query := trim(NEW.query);
    NEW.normalized_query := public.slugify(NEW.query);

    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;

    IF NEW.query = '' THEN
        RAISE EXCEPTION
            'La búsqueda no puede estar vacía.';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.created_at := now();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.created_at := OLD.created_at;
    END IF;

    RETURN NEW;
END;
$$;


-- ============================================================
-- 4. SEARCH LOGS — CLICKED BUSINESS
--
-- Si clicked_business_id está presente, el negocio debe ser
-- actualmente visible dentro de la búsqueda pública.
--
-- result_count permanece permitido como valor client-side.
-- ============================================================

DROP POLICY IF EXISTS
    search_logs_insert_public
ON public.search_logs;

CREATE POLICY search_logs_insert_public
ON public.search_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
    (
        user_id IS NULL
        OR user_id = auth.uid()
    )

    AND (
        clicked_business_id IS NULL

        OR EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = search_logs.clicked_business_id
              AND b.status = 'published'::public.business_status
              AND b.is_published = true
              AND b.is_adult_content = false
              AND b.show_in_search = true
              AND (
                  b.expires_at IS NULL
                  OR b.expires_at >= now()
              )
        )
    )
);
