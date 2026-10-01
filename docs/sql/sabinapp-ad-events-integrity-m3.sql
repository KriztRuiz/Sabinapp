-- SABINAPP 1.0 | M3 | Integridad de eventos publicitarios
--
-- Hallazgos confirmados en M3-16I2C:
--
-- ad_clicks:
-- - INSERT público aceptaba asset_id NULL.
-- - clicked_at podía ser falsificado.
-- - page_path podía estar fuera de placement_scope.
-- - business_id podía apuntar a un negocio no relacionado.
--
-- ad_impressions:
-- - impression_kind='asset' aceptaba asset_id NULL.
-- - shown_at podía ser falsificado.
-- - page_path podía estar fuera de placement_scope.
-- - business_id podía apuntar a un negocio no relacionado.
--
-- La corrección afecta nuevos eventos.
-- No modifica métricas históricas existentes.
--
-- session_key continúa siendo un identificador client-side.


-- ============================================================
-- 1. VALIDACIÓN CENTRAL DEL CONTEXTO PÚBLICO DEL EVENTO
--
-- event_kind:
-- - appearance
-- - asset
-- - click
--
-- Comprueba:
-- - campaña activa y dentro de vigencia;
-- - tipo global de campaña habilitado;
-- - asset activo cuando corresponda;
-- - existencia de al menos un asset activo para appearance;
-- - page_path coherente con placement_scope;
-- - business_id coherente con /negocio/[slug].
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_valid_public_ad_event(
    target_campaign_id uuid,
    target_asset_id uuid,
    target_page_path text,
    target_business_id uuid,
    target_event_kind text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.ad_campaigns AS c
        CROSS JOIN public.ad_settings AS s

        WHERE c.id = target_campaign_id

          AND c.status =
              'active'::public.ad_campaign_status

          AND (
              c.starts_at IS NULL
              OR c.starts_at <= now()
          )

          AND (
              c.ends_at IS NULL
              OR c.ends_at >= now()
          )

          AND (
              (
                  c.campaign_type =
                      'fixed_banner'::public.ad_campaign_type
                  AND s.fixed_banner_enabled = true
              )
              OR
              (
                  c.campaign_type =
                      'interstitial'::public.ad_campaign_type
                  AND s.interstitial_enabled = true
              )
          )

          -- --------------------------------------------------
          -- Semántica del asset según el tipo de evento.
          -- --------------------------------------------------
          AND (
              (
                  target_event_kind = 'appearance'
                  AND target_asset_id IS NULL
                  AND EXISTS (
                      SELECT 1
                      FROM public.ad_assets AS a
                      WHERE a.campaign_id = c.id
                        AND a.is_active = true
                  )
              )

              OR

              (
                  target_event_kind IN ('asset', 'click')
                  AND target_asset_id IS NOT NULL
                  AND EXISTS (
                      SELECT 1
                      FROM public.ad_assets AS a
                      WHERE a.id = target_asset_id
                        AND a.campaign_id = c.id
                        AND a.is_active = true
                  )
              )
          )

          -- --------------------------------------------------
          -- Ruta / placement / negocio anfitrión.
          -- --------------------------------------------------
          AND (
              (
                  target_page_path = '/'
                  AND target_business_id IS NULL
                  AND 'home' = ANY(c.placement_scope)
              )

              OR

              (
                  target_page_path = '/negocios'
                  AND target_business_id IS NULL
                  AND 'negocios' = ANY(c.placement_scope)
              )

              OR

              (
                  target_page_path = '/productos'
                  AND target_business_id IS NULL
                  AND 'productos' = ANY(c.placement_scope)
              )

              OR

              (
                  target_page_path = '/noticias'
                  AND target_business_id IS NULL
                  AND 'noticias' = ANY(c.placement_scope)
              )

              OR

              (
                  target_page_path = '/clima'
                  AND target_business_id IS NULL
                  AND 'clima' = ANY(c.placement_scope)
              )

              OR

              (
                  'business_profile' = ANY(c.placement_scope)
                  AND target_business_id IS NOT NULL

                  AND EXISTS (
                      SELECT 1
                      FROM public.businesses AS b
                      WHERE b.id = target_business_id

                        AND target_page_path =
                            '/negocio/' || b.slug

                        AND b.status =
                            'published'::public.business_status

                        AND b.is_published = true
                        AND b.is_adult_content = false
                        AND b.show_in_search = true

                        AND (
                            b.expires_at IS NULL
                            OR b.expires_at >= now()
                        )
                  )
              )
          )
    );
$$;


REVOKE ALL
ON FUNCTION public.is_valid_public_ad_event(
    uuid,
    uuid,
    text,
    uuid,
    text
)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.is_valid_public_ad_event(
    uuid,
    uuid,
    text,
    uuid,
    text
)
TO anon, authenticated;


-- ============================================================
-- 2. NORMALIZAR INSERTS DE EVENTOS
--
-- Se utiliza BEFORE INSERT y no BEFORE UPDATE porque:
--
-- - el público no tiene UPDATE;
-- - asset_id usa FK ON DELETE SET NULL;
-- - no queremos romper conservación histórica si un asset
--   administrativo desaparece posteriormente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.normalize_ad_event_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN

    -- --------------------------------------------------------
    -- CLICK
    -- --------------------------------------------------------

    IF TG_TABLE_NAME = 'ad_clicks' THEN

        IF NEW.asset_id IS NULL THEN
            RAISE EXCEPTION
                'Un clic publicitario debe estar asociado a un asset.';
        END IF;

        NEW.clicked_at := now();

        RETURN NEW;

    END IF;


    -- --------------------------------------------------------
    -- IMPRESSION
    -- --------------------------------------------------------

    IF TG_TABLE_NAME = 'ad_impressions' THEN

        IF NEW.impression_kind = 'appearance' THEN

            IF NEW.asset_id IS NOT NULL THEN
                RAISE EXCEPTION
                    'Una aparición de campaña no debe indicar asset_id.';
            END IF;

        ELSIF NEW.impression_kind = 'asset' THEN

            IF NEW.asset_id IS NULL THEN
                RAISE EXCEPTION
                    'Una impresión de asset debe indicar asset_id.';
            END IF;

        ELSE

            RAISE EXCEPTION
                'Tipo de impresión publicitaria no válido.';

        END IF;

        NEW.shown_at := now();

        RETURN NEW;

    END IF;


    RAISE EXCEPTION
        'Tabla de evento publicitario no soportada.';

END;
$$;


DROP TRIGGER IF EXISTS
    normalize_ad_click_before_insert
ON public.ad_clicks;

CREATE TRIGGER normalize_ad_click_before_insert
BEFORE INSERT
ON public.ad_clicks
FOR EACH ROW
EXECUTE FUNCTION public.normalize_ad_event_before_insert();


DROP TRIGGER IF EXISTS
    normalize_ad_impression_before_insert
ON public.ad_impressions;

CREATE TRIGGER normalize_ad_impression_before_insert
BEFORE INSERT
ON public.ad_impressions
FOR EACH ROW
EXECUTE FUNCTION public.normalize_ad_event_before_insert();


-- ============================================================
-- 3. POLICY PÚBLICA DE CLICS
-- ============================================================

DROP POLICY IF EXISTS
    ad_clicks_insert_public_active_ads
ON public.ad_clicks;

CREATE POLICY ad_clicks_insert_public_active_ads
ON public.ad_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
    public.is_valid_public_ad_event(
        campaign_id,
        asset_id,
        page_path,
        business_id,
        'click'
    )
);


-- ============================================================
-- 4. POLICY PÚBLICA DE IMPRESIONES
-- ============================================================

DROP POLICY IF EXISTS
    ad_impressions_insert_public_active_ads
ON public.ad_impressions;

CREATE POLICY ad_impressions_insert_public_active_ads
ON public.ad_impressions
FOR INSERT
TO anon, authenticated
WITH CHECK (
    public.is_valid_public_ad_event(
        campaign_id,
        asset_id,
        page_path,
        business_id,
        impression_kind
    )
);
