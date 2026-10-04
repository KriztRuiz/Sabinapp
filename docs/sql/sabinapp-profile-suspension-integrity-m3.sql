-- SABINAPP 1.0 | M3-16K2C
--
-- Integridad de suspensión de usuarios en reports.
--
-- Hallazgo confirmado por M3-16K2B:
--
-- Un perfil con status='suspended':
--
-- - deja de considerarse completo;
-- - no puede crear negocios;
-- - no puede editar negocios;
-- - no puede crear reviews;
-- - no puede crear news_comments;
-- - no puede crear nuevos reports;
--
-- pero todavía podía modificar un report propio existente
-- mientras su status permaneciera en 'new'.
--
-- Esta migración exige perfil activo/completo también para
-- la rama de UPDATE perteneciente al reportante.
--
-- Los administradores con admin.manage_reports conservan
-- su capacidad de moderación independientemente de esta rama.


BEGIN;


DROP POLICY IF EXISTS
    reports_update_reporter_limited_or_admin
ON public.reports;


CREATE POLICY reports_update_reporter_limited_or_admin
ON public.reports
FOR UPDATE
TO authenticated

USING (

    (
        reporter_id = auth.uid()

        AND status =
            'new'::public.report_status

        AND public.is_profile_complete(
            auth.uid()
        )
    )

    OR

    public.has_permission(
        'admin.manage_reports'
    )

)

WITH CHECK (

    (
        reporter_id = auth.uid()

        AND status =
            'new'::public.report_status

        AND public.is_profile_complete(
            auth.uid()
        )
    )

    OR

    public.has_permission(
        'admin.manage_reports'
    )

);


COMMIT;


-- ============================================================
-- M3-16K2G
--
-- SUSPENSIÓN DE CUENTAS EN TABLAS EDITABLES DEL NEGOCIO
--
-- M3-16K2F confirmó que un propietario suspendido podía
-- modificar directamente tablas hijas mediante RLS aunque
-- las Server Actions ya exigieran requireCompleteProfile().
--
-- Regla:
--
-- propietario:
--   ownership
--   + perfil activo/completo
--
-- administrador:
--   conserva admin.review_businesses
--
-- También se bloquea la creación de tags nuevos por perfiles
-- suspendidos/incompletos.
-- ============================================================


BEGIN;


-- ============================================================
-- BUSINESS_HOURS
-- ============================================================

DROP POLICY IF EXISTS
    business_hours_delete_owner_or_admin
ON public.business_hours;

CREATE POLICY business_hours_delete_owner_or_admin
ON public.business_hours
FOR DELETE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_hours.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_hours_insert_owner_or_admin
ON public.business_hours;

CREATE POLICY business_hours_insert_owner_or_admin
ON public.business_hours
FOR INSERT
TO authenticated
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_hours.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_hours_update_owner_or_admin
ON public.business_hours;

CREATE POLICY business_hours_update_owner_or_admin
ON public.business_hours
FOR UPDATE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_hours.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
)
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_hours.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


-- ============================================================
-- BUSINESS_ITEMS
-- ============================================================

DROP POLICY IF EXISTS
    business_items_delete_owner_or_admin
ON public.business_items;

CREATE POLICY business_items_delete_owner_or_admin
ON public.business_items
FOR DELETE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_items.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_items_insert_owner_or_admin
ON public.business_items;

CREATE POLICY business_items_insert_owner_or_admin
ON public.business_items
FOR INSERT
TO authenticated
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_items.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_items_update_owner_or_admin
ON public.business_items;

CREATE POLICY business_items_update_owner_or_admin
ON public.business_items
FOR UPDATE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_items.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
)
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_items.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


-- ============================================================
-- BUSINESS_LOCATIONS
-- ============================================================

DROP POLICY IF EXISTS
    business_locations_delete_owner_or_admin
ON public.business_locations;

CREATE POLICY business_locations_delete_owner_or_admin
ON public.business_locations
FOR DELETE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_locations.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_locations_insert_owner_or_admin
ON public.business_locations;

CREATE POLICY business_locations_insert_owner_or_admin
ON public.business_locations
FOR INSERT
TO authenticated
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_locations.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_locations_update_owner_or_admin
ON public.business_locations;

CREATE POLICY business_locations_update_owner_or_admin
ON public.business_locations
FOR UPDATE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_locations.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
)
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_locations.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


-- ============================================================
-- BUSINESS_MEDIA
-- ============================================================

DROP POLICY IF EXISTS
    business_media_delete_owner_or_admin
ON public.business_media;

CREATE POLICY business_media_delete_owner_or_admin
ON public.business_media
FOR DELETE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_media.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_media_insert_owner_or_admin
ON public.business_media;

CREATE POLICY business_media_insert_owner_or_admin
ON public.business_media
FOR INSERT
TO authenticated
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_media.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_media_update_owner_or_admin
ON public.business_media;

CREATE POLICY business_media_update_owner_or_admin
ON public.business_media
FOR UPDATE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_media.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
)
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_media.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


-- ============================================================
-- BUSINESS_SETTINGS
-- ============================================================

DROP POLICY IF EXISTS
    business_settings_insert_owner_or_admin
ON public.business_settings;

CREATE POLICY business_settings_insert_owner_or_admin
ON public.business_settings
FOR INSERT
TO authenticated
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_settings.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_settings_update_owner_or_admin
ON public.business_settings;

CREATE POLICY business_settings_update_owner_or_admin
ON public.business_settings
FOR UPDATE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_settings.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
)
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_settings.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


-- ============================================================
-- BUSINESS_TAGS
-- ============================================================

DROP POLICY IF EXISTS
    business_tags_delete_owner_or_admin
ON public.business_tags;

CREATE POLICY business_tags_delete_owner_or_admin
ON public.business_tags
FOR DELETE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_tags.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    business_tags_insert_owner_or_admin
ON public.business_tags;

CREATE POLICY business_tags_insert_owner_or_admin
ON public.business_tags
FOR INSERT
TO authenticated
WITH CHECK (
    (
        (
            (
                EXISTS (
                    SELECT 1
                    FROM public.businesses AS b
                    WHERE b.id = business_tags.business_id
                      AND b.owner_id = auth.uid()
                )
                AND public.is_profile_complete(
                    auth.uid()
                )
            )
            OR public.has_permission(
                'admin.review_businesses'
            )
        )

        AND EXISTS (
            SELECT 1
            FROM public.tags AS t
            WHERE t.id = business_tags.tag_id
              AND t.is_active = true
              AND t.is_blocked = false
        )
    )
);


-- ============================================================
-- CONTACT_METHODS
-- ============================================================

DROP POLICY IF EXISTS
    contact_methods_delete_owner_or_admin
ON public.contact_methods;

CREATE POLICY contact_methods_delete_owner_or_admin
ON public.contact_methods
FOR DELETE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = contact_methods.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    contact_methods_insert_owner_or_admin
ON public.contact_methods;

CREATE POLICY contact_methods_insert_owner_or_admin
ON public.contact_methods
FOR INSERT
TO authenticated
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = contact_methods.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


DROP POLICY IF EXISTS
    contact_methods_update_owner_or_admin
ON public.contact_methods;

CREATE POLICY contact_methods_update_owner_or_admin
ON public.contact_methods
FOR UPDATE
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = contact_methods.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
)
WITH CHECK (
    (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = contact_methods.business_id
              AND b.owner_id = auth.uid()
        )
        AND public.is_profile_complete(auth.uid())
    )
    OR public.has_permission(
        'admin.review_businesses'
    )
);


-- ============================================================
-- TAGS
--
-- La policy administrativa tags_write_admin permanece intacta.
-- Esta policy controla la creación normal por usuarios.
-- ============================================================

DROP POLICY IF EXISTS
    tags_insert_authenticated
ON public.tags;

CREATE POLICY tags_insert_authenticated
ON public.tags
FOR INSERT
TO authenticated
WITH CHECK (
    created_by = auth.uid()

    AND public.is_profile_complete(
        auth.uid()
    )

    AND is_system = false
    AND is_active = true
    AND is_blocked = false
);


COMMIT;
