-- =========================================================
-- SABINAPP — M3-17B7
-- Endurecimiento y auditoria del rol subadmin.
--
-- Sigue a:
--   sabinapp-admin-subadmin-m3-17b6.sql
--
-- Registra estos cambios:
--   - anon deja de tener permisos sobre user_roles.
--   - authenticated no puede borrar filas de user_roles.
--   - has_role usa un search_path restringido.
--   - has_role no es ejecutable por PUBLIC ni anon.
--   - la auditoria registra INSERT, UPDATE y DELETE
--     de asignaciones activas de subadmin.
--
-- Los cambios ya fueron aplicados y verificados en la
-- base actual. No ejecutar otra vez en esa base.
-- =========================================================

BEGIN;

-- 1. Evitar acceso anonimo directo a user_roles.
--    Los admins de la app conservan INSERT/UPDATE sujetos a RLS.
--    El SQL Editor conserva los permisos de postgres.

REVOKE ALL PRIVILEGES
ON TABLE public.user_roles
FROM anon;

REVOKE DELETE
ON TABLE public.user_roles
FROM authenticated;

-- 2. Endurecer la funcion usada por las politicas RLS
--    y por la RPC admin_set_subadmin.

ALTER FUNCTION public.has_role(text)
SET search_path TO pg_catalog, public, pg_temp;

REVOKE EXECUTE
ON FUNCTION public.has_role(text)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.has_role(text)
TO authenticated, service_role;

-- 3. Registrar asignaciones, revocaciones y eliminaciones
--    de asignaciones activas de subadmin.

CREATE OR REPLACE FUNCTION public.audit_subadmin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_old_is_subadmin boolean := false;
    v_new_is_subadmin boolean := false;
    v_action text;
    v_target_user_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.roles AS r
            WHERE r.id = OLD.role_id
              AND r.key = 'subadmin'
        )
        INTO v_old_is_subadmin;

        v_target_user_id := OLD.user_id;

        IF v_old_is_subadmin AND OLD.is_active THEN
            v_action := 'revoked';
        END IF;

    ELSE
        SELECT EXISTS (
            SELECT 1
            FROM public.roles AS r
            WHERE r.id = NEW.role_id
              AND r.key = 'subadmin'
        )
        INTO v_new_is_subadmin;

        v_target_user_id := NEW.user_id;

        IF TG_OP = 'INSERT' THEN
            IF v_new_is_subadmin AND NEW.is_active THEN
                v_action := 'assigned';
            END IF;
        ELSE
            SELECT EXISTS (
                SELECT 1
                FROM public.roles AS r
                WHERE r.id = OLD.role_id
                  AND r.key = 'subadmin'
            )
            INTO v_old_is_subadmin;

            IF v_old_is_subadmin
               AND OLD.is_active
               AND (NOT v_new_is_subadmin OR NOT NEW.is_active)
            THEN
                v_action := 'revoked';

            ELSIF v_new_is_subadmin
               AND NEW.is_active
               AND (NOT v_old_is_subadmin OR NOT OLD.is_active)
            THEN
                v_action := 'assigned';
            END IF;
        END IF;
    END IF;

    IF v_action IS NOT NULL THEN
        INSERT INTO public.admin_role_change_events (
            actor_user_id,
            target_user_id,
            role_key,
            action
        )
        VALUES (
            auth.uid(),
            v_target_user_id,
            'subadmin',
            v_action
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL
ON FUNCTION public.audit_subadmin_role_change()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS audit_user_roles_subadmin
ON public.user_roles;

CREATE TRIGGER audit_user_roles_subadmin
AFTER INSERT OR UPDATE OF role_id, is_active OR DELETE
ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_subadmin_role_change();

COMMIT;
