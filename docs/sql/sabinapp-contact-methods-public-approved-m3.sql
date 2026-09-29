-- SABINAPP 1.0 | M3 | Seguridad RLS de contactos públicos
--
-- Corrige la lectura pública de contact_methods.
--
-- Regla:
-- - Un visitante público sólo puede ver contactos:
--   * activos;
--   * aprobados;
--   * pertenecientes a un negocio públicamente visible.
-- - El propietario conserva acceso a todos sus contactos.
-- - Administración conserva acceso mediante admin.review_businesses.
--
-- Hallazgo reproducido en M3-16F4B.

DROP POLICY IF EXISTS
    contact_methods_select_public_or_owner_or_admin
ON public.contact_methods;

CREATE POLICY contact_methods_select_public_or_owner_or_admin
ON public.contact_methods
FOR SELECT
TO anon, authenticated
USING (
    (
        is_active = true
        AND is_approved = true

        AND EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = contact_methods.business_id
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

    OR EXISTS (
        SELECT 1
        FROM public.businesses AS b
        WHERE b.id = contact_methods.business_id
          AND b.owner_id = auth.uid()
    )

    OR public.has_permission(
        'admin.review_businesses'
    )
);
