-- SABINAPP M3-17B12B5C3A
-- Idempotencia para el registro de negocios
-- Migracion ya aplicada en Supabase.
--
-- Objetivo:
-- Una misma solicitud de creacion no puede
-- producir dos negocios para un propietario.
--
-- No modifica negocios existentes.
-- Migracion transaccional.

BEGIN;

-- 1. Identificador de la solicitud de creacion.
-- Nullable para conservar compatibilidad
-- con los negocios existentes.

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS
    creation_request_id uuid;

-- 2. Una solicitud solo puede crear un negocio
-- por propietario.
-- Los registros antiguos con NULL no se afectan.

CREATE UNIQUE INDEX IF NOT EXISTS
    businesses_owner_creation_request_id_uidx
ON public.businesses (
    owner_id,
    creation_request_id
)
WHERE creation_request_id IS NOT NULL;

-- 3. Impedir que el identificador de una solicitud
-- sea modificado despues de crear el negocio.

CREATE OR REPLACE FUNCTION
    public.prevent_business_creation_request_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN

    IF NEW.creation_request_id
       IS DISTINCT FROM OLD.creation_request_id
    THEN

        RAISE EXCEPTION
            'No se puede modificar el identificador original de creacion del negocio.';

    END IF;

    RETURN NEW;

END;
$function$;

-- 4. Instalar el trigger de inmutabilidad.

DROP TRIGGER IF EXISTS
    zz_prevent_business_creation_request_change
ON public.businesses;

CREATE TRIGGER
    zz_prevent_business_creation_request_change
BEFORE UPDATE
ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION
    public.prevent_business_creation_request_change();

-- 5. Documentacion del campo.

COMMENT ON COLUMN
    public.businesses.creation_request_id
IS
    'Identificador unico de solicitud utilizado para evitar registros duplicados por reintentos.';

COMMIT;
