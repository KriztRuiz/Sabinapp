-- SABINAPP 1.0 | M3 | Integridad de business_review_logs
--
-- Hallazgo M3-16G2A:
-- Un propietario podía insertar action='submitted' falsificando:
-- - actor_id
-- - created_at
--
-- Corrección:
-- - propietarios sólo pueden insertar action='submitted';
-- - actor_id debe representar al usuario autenticado;
-- - created_at es administrado por PostgreSQL para usuarios no admin;
-- - administradores conservan sus permisos actuales.

CREATE OR REPLACE FUNCTION public.normalize_business_review_log_before_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT public.has_permission('admin.review_businesses') THEN
        NEW.actor_id := auth.uid();
        NEW.created_at := now();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
    normalize_business_review_log_before_insert
ON public.business_review_logs;

CREATE TRIGGER normalize_business_review_log_before_insert
BEFORE INSERT
ON public.business_review_logs
FOR EACH ROW
EXECUTE FUNCTION public.normalize_business_review_log_before_insert();


DROP POLICY IF EXISTS
    business_review_logs_insert_owner_submit_or_admin
ON public.business_review_logs;

CREATE POLICY business_review_logs_insert_owner_submit_or_admin
ON public.business_review_logs
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_permission('admin.review_businesses')

    OR (
        action = 'submitted'::public.business_review_action

        AND actor_id = auth.uid()

        AND EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_review_logs.business_id
              AND b.owner_id = auth.uid()
        )
    )
);
