-- =========================================================
-- SABINAPP — M3-17B6
-- Administracion del rol subadmin y auditoria.
--
-- Requiere:
--   public.roles
--   public.user_roles
--   public.profiles
--   public.has_role(text)
--
-- Probado en Supabase:
--   6 pruebas funcionales PASS con ROLLBACK.
--   Asignacion y revocacion reales verificadas.
--
-- Este archivo documenta la instalacion existente.
-- No ejecutarlo nuevamente durante esta subfase.
-- =========================================================

BEGIN;

-- 1. Auditoria de cambios del rol subadmin.

CREATE TABLE IF NOT EXISTS public.admin_role_change_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_user_id uuid
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    target_user_id uuid
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    role_key text NOT NULL
        CHECK (role_key = 'subadmin'),

    action text NOT NULL
        CHECK (action IN ('assigned', 'revoked')),

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS
    admin_role_change_events_created_at_idx
ON public.admin_role_change_events (created_at DESC);

ALTER TABLE public.admin_role_change_events
ENABLE ROW LEVEL SECURITY;

REVOKE ALL
ON TABLE public.admin_role_change_events
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON TABLE public.admin_role_change_events
TO authenticated;

DO $policies$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'admin_role_change_events'
          AND policyname = 'admin_role_change_events_select_admin'
    ) THEN
        CREATE POLICY admin_role_change_events_select_admin
        ON public.admin_role_change_events
        FOR SELECT
        TO authenticated
        USING (public.has_role('admin'));
    END IF;
END;
$policies$;

-- 2. Trigger de auditoria.

CREATE OR REPLACE FUNCTION public.audit_subadmin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_action text;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.roles r
        WHERE r.id = NEW.role_id
          AND r.key = 'subadmin'
    ) THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.is_active THEN
            v_action := 'assigned';
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
            v_action := CASE
                WHEN NEW.is_active THEN 'assigned'
                ELSE 'revoked'
            END;
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
            NEW.user_id,
            'subadmin',
            v_action
        );
    END IF;

    RETURN NEW;
END;
$function$;

REVOKE ALL
ON FUNCTION public.audit_subadmin_role_change()
FROM PUBLIC, anon, authenticated;

DO $trigger$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_trigger
        WHERE tgrelid = 'public.user_roles'::regclass
          AND tgname = 'audit_user_roles_subadmin'
          AND NOT tgisinternal
    ) THEN
        CREATE TRIGGER audit_user_roles_subadmin
        AFTER INSERT OR UPDATE OF is_active
        ON public.user_roles
        FOR EACH ROW
        EXECUTE FUNCTION public.audit_subadmin_role_change();
    END IF;
END;
$trigger$;

-- 3. RPC para gestionar exclusivamente subadmin.

CREATE OR REPLACE FUNCTION public.admin_set_subadmin(
    p_target_user_id uuid,
    p_enabled boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
    v_actor_id uuid := auth.uid();
    v_role_id uuid;
    v_target_id uuid;
    v_changed_assignment_id uuid;
BEGIN
    IF v_actor_id IS NULL
       OR NOT COALESCE(public.has_role('admin'), false)
    THEN
        RAISE EXCEPTION
            'No tienes permiso para administrar roles.'
            USING ERRCODE = '42501';
    END IF;

    IF p_target_user_id IS NULL OR p_enabled IS NULL THEN
        RAISE EXCEPTION
            'Faltan parametros para administrar el rol.'
            USING ERRCODE = '22023';
    END IF;

    IF p_target_user_id = v_actor_id THEN
        RAISE EXCEPTION
            'No puedes modificar tus propios roles.'
            USING ERRCODE = '42501';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        17017,
        pg_catalog.hashtext(p_target_user_id::text)
    );

    SELECT p.id
    INTO v_target_id
    FROM public.profiles p
    WHERE p.id = p_target_user_id
      AND p.status::text = 'active';

    IF v_target_id IS NULL THEN
        RAISE EXCEPTION
            'No encontramos un usuario con perfil activo.'
            USING ERRCODE = 'P0002';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r
          ON r.id = ur.role_id
        WHERE ur.user_id = p_target_user_id
          AND ur.is_active = true
          AND r.key = 'admin'
    ) THEN
        RAISE EXCEPTION
            'No se pueden modificar roles de administradores.'
            USING ERRCODE = '42501';
    END IF;

    SELECT r.id
    INTO v_role_id
    FROM public.roles r
    WHERE r.key = 'subadmin';

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION
            'El rol subadmin no existe.'
            USING ERRCODE = 'P0002';
    END IF;

    IF p_enabled THEN

        INSERT INTO public.user_roles AS ur (
            user_id,
            role_id,
            assigned_by,
            is_active
        )
        VALUES (
            p_target_user_id,
            v_role_id,
            v_actor_id,
            true
        )
        ON CONFLICT (user_id, role_id)
        DO UPDATE SET
            is_active = true,
            assigned_by = EXCLUDED.assigned_by
        WHERE ur.is_active IS DISTINCT FROM true
        RETURNING id INTO v_changed_assignment_id;

    ELSE

        UPDATE public.user_roles
        SET is_active = false
        WHERE user_id = p_target_user_id
          AND role_id = v_role_id
          AND is_active = true
        RETURNING id INTO v_changed_assignment_id;

    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'ok', true,
        'userId', p_target_user_id,
        'role', 'subadmin',
        'enabled', p_enabled,
        'changed', v_changed_assignment_id IS NOT NULL
    );
END;
$function$;

REVOKE ALL
ON FUNCTION public.admin_set_subadmin(uuid, boolean)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.admin_set_subadmin(uuid, boolean)
TO authenticated;

COMMIT;
