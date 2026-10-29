-- ==========================================================
-- SABINAPP M3-18B3B
-- Validaciones de username y phone
--
-- Migracion ya aplicada en Supabase.
-- Versionada para reproducir el esquema.
--
-- username:
--   Opcional.
--   Entre 3 y 30 caracteres.
--   Comienza con una letra minuscula.
--   Letras minusculas, numeros y guion bajo.
--   La unicidad depende de profiles_username_key.
--
-- phone:
--   Opcional.
--   Entre 10 y 15 digitos.
--   Permite + al inicio.
--
-- No elimina ni modifica perfiles existentes.
-- ==========================================================

BEGIN;

DO $migration$
BEGIN

    -- 1. Verificar datos existentes.

    IF EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE username IS NOT NULL
          AND username !~ '^[a-z][a-z0-9_]{2,29}$'
    ) THEN
        RAISE EXCEPTION
            'Existen usernames incompatibles. No se aplicaron cambios.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE phone IS NOT NULL
          AND phone !~ '^[+]?[0-9]{10,15}$'
    ) THEN
        RAISE EXCEPTION
            'Existen telefonos incompatibles. No se aplicaron cambios.';
    END IF;

    -- 2. Restriccion de formato para username.

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND conname = 'profiles_username_format_check'
    ) THEN

        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_username_format_check
        CHECK (
            username IS NULL
            OR username ~ '^[a-z][a-z0-9_]{2,29}$'
        );

    END IF;

    -- 3. Restriccion de formato para phone.

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND conname = 'profiles_phone_format_check'
    ) THEN

        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_phone_format_check
        CHECK (
            phone IS NULL
            OR phone ~ '^[+]?[0-9]{10,15}$'
        );

    END IF;

END;
$migration$;

COMMIT;
