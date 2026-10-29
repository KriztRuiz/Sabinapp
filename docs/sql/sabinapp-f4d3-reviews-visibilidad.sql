-- ==========================================================
-- SABINAPP F4D3
-- Protección de visibilidad pública de reseñas
--
-- Migración aplicada y probada en Supabase.
-- No elimina ni modifica reseñas existentes.
--
-- Público:
--   Solo reseñas publicadas de negocios visibles,
--   no adultos, no expirados y con reseñas habilitadas.
--
-- Se conserva el acceso del autor y de administración.
-- ==========================================================

BEGIN;

ALTER POLICY
    reviews_select_public_or_owner_or_admin
ON public.reviews
USING (
    (
        status = 'published'::public.review_status

        AND EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.id = reviews.business_id
              AND b.status = 'published'::public.business_status
              AND b.is_published = true
              AND b.is_adult_content = false
              AND b.show_in_search = true
              AND b.show_reviews_publicly = true
              AND (
                  b.expires_at IS NULL
                  OR b.expires_at >= now()
              )
        )
    )

    OR user_id = auth.uid()

    OR public.has_permission('admin.manage_reports')
);

COMMIT;
