-- SABINAPP M3-18B2B
-- Proteccion de campos internos de public.profiles
--
-- Migracion aplicada previamente en Supabase.
-- No modifica auth.users.
-- No elimina registros.
--
-- Impide a usuarios autenticados:
-- 1. Insertar perfiles manualmente.
-- 2. Cambiar directamente id.
-- 3. Cambiar directamente email.
-- 4. Alterar created_at.

BEGIN;

CREATE OR REPLACE FUNCTION
    public.guard_profile_identity_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$

BEGIN

    IF auth.role() = 'authenticated' THEN

        IF TG_OP = 'INSERT' THEN

            RAISE EXCEPTION
                'El perfil debe ser creado mediante Supabase Auth.'
                USING ERRCODE = '42501';

        END IF;

        IF TG_OP = 'UPDATE' THEN

            IF NEW.id IS DISTINCT FROM OLD.id THEN

                RAISE EXCEPTION
                    'No se puede modificar el identificador del perfil.'
                    USING ERRCODE = '42501';

            END IF;

            IF NEW.email IS DISTINCT FROM OLD.email THEN

                RAISE EXCEPTION
                    'El correo debe modificarse mediante Supabase Auth.'
                    USING ERRCODE = '42501';

            END IF;

            IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN

                RAISE EXCEPTION
                    'No se puede modificar la fecha de creacion del perfil.'
                    USING ERRCODE = '42501';

            END IF;

        END IF;

    END IF;

    RETURN NEW;

END;

$function$;

DROP TRIGGER IF EXISTS
    aa_guard_profile_identity_fields
ON public.profiles;

CREATE TRIGGER
    aa_guard_profile_identity_fields
BEFORE INSERT OR UPDATE
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION
    public.guard_profile_identity_fields();

COMMENT ON FUNCTION
    public.guard_profile_identity_fields()
IS
    'Protege id, email y created_at frente a cambios directos de usuarios autenticados e impide crear perfiles manualmente desde el cliente.';

COMMIT;
