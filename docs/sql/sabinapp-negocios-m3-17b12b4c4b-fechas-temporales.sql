-- SABINAPP M3-17B12B4C4B
-- Validacion de fechas durante moderacion.
-- DOCUMENTACION de migracion ya ejecutada en Supabase.
-- No reejecutar sin necesidad: conservar como fuente versionada.

BEGIN;

-- Evitar instalar el trigger si ya hay negocios temporales en
-- revision, aprobados o publicados con fechas incompletas.
DO $preflight$
DECLARE
    total_inconsistencias bigint;
BEGIN
    SELECT COUNT(*)
    INTO total_inconsistencias
    FROM public.businesses b
    JOIN public.business_types bt
      ON bt.id = b.business_type_id
    WHERE bt.requires_start_end_dates = true
      AND b.status IN (
          'pending_review',
          'approved',
          'published'
      )
      AND (
          b.starts_at IS NULL
          OR b.ends_at IS NULL
          OR b.expires_at IS NULL
      );

    IF total_inconsistencias > 0 THEN
        RAISE EXCEPTION
            'B4C4B cancelada: existen % negocios temporales activos en moderacion sin fechas completas.',
            total_inconsistencias;
    END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.validate_business_temporal_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    tipo_requiere_fechas boolean;
BEGIN
    IF NEW.status IN (
        'pending_review',
        'approved',
        'published'
    ) THEN
        SELECT bt.requires_start_end_dates
        INTO tipo_requiere_fechas
        FROM public.business_types bt
        WHERE bt.id = NEW.business_type_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'El tipo de negocio no existe.';
        END IF;

        IF tipo_requiere_fechas
           AND (
               NEW.starts_at IS NULL
               OR NEW.ends_at IS NULL
               OR NEW.expires_at IS NULL
           )
        THEN
            RAISE EXCEPTION
                'El negocio temporal necesita fechas completas antes de pasar a revision, aprobacion o publicacion.';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- z_ ordena esta validacion despues de la normalizacion actual.
DROP TRIGGER IF EXISTS
    z_validate_business_temporal_lifecycle
ON public.businesses;

CREATE TRIGGER z_validate_business_temporal_lifecycle
BEFORE INSERT OR UPDATE
ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.validate_business_temporal_lifecycle();

COMMIT;
