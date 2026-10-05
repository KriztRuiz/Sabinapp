-- ============================================================
-- SABINAPP 1.0
-- M3-16K4F3
--
-- Integridad de fecha de nacimiento en profiles.
--
-- Objetivos:
-- - Permitir birthdate NULL para perfiles incompletos.
-- - Exigir edad mínima de 13 años.
-- - Exigir edad máxima de 120 años.
-- - Mantener protegidos status, is_adult_verified,
--   privacy_accepted_at y profile_completed_at.
-- - Aplicar la validación también a perfiles creados
--   automáticamente desde auth.users.
--
-- Esta definición refleja la función vigente en Supabase
-- al momento de M3-16K4, añadiendo la validación de rango.
-- ============================================================

begin;

create or replace function public.sync_profile_is_adult_verified()
returns trigger
language plpgsql
security invoker
set search_path to 'public', 'pg_temp'
as $function$

declare
    is_admin_user boolean;

begin

    -- ========================================================
    -- 1. IDENTIFICAR OPERACIÓN ADMINISTRATIVA
    -- ========================================================

    is_admin_user :=
        coalesce(
            public.has_role('admin'),
            false
        )
        or coalesce(
            auth.role() = 'service_role',
            false
        )
        or (
            session_user = 'postgres'
            and auth.uid() is null
        );

    -- ========================================================
    -- 2. PROTEGER EL ESTADO DEL PERFIL
    -- ========================================================

    if tg_op = 'INSERT' then

        if not is_admin_user then

            new.status :=
                'active'::public.profile_status;

        end if;

    elsif tg_op = 'UPDATE' then

        if new.status is distinct from old.status
           and not is_admin_user then

            raise exception
                'Solo Administración puede cambiar el estado de un perfil.';

        end if;

    end if;

    -- ========================================================
    -- 3. VALIDAR RANGO DE FECHA DE NACIMIENTO
    -- ========================================================
    --
    -- Sabinapp permite perfiles desde los 13 años.
    -- También se aplica un máximo razonable de 120 años.
    --
    -- birthdate NULL sigue permitido para perfiles incompletos.
    -- ========================================================

    if new.birthdate is not null then

        if new.birthdate >
            (
                current_date - interval '13 years'
            )::date then

            raise exception
                'Debes tener al menos 13 años para usar Sabinapp.';

        end if;

        if new.birthdate <
            (
                current_date - interval '120 years'
            )::date then

            raise exception
                'La fecha de nacimiento no puede indicar una edad mayor a 120 años.';

        end if;

    end if;

    -- ========================================================
    -- 4. SINCRONIZAR LA MAYORÍA DE EDAD DECLARADA
    -- ========================================================
    --
    -- is_adult_verified expresa la edad calculada a partir
    -- de birthdate. No constituye verificación documental.
    -- ========================================================

    new.is_adult_verified :=
        case

            when new.birthdate is null then
                false

            when new.birthdate <=
                (
                    current_date - interval '18 years'
                )::date then
                true

            else
                false

        end;

    -- ========================================================
    -- 5. REGISTRAR ACEPTACIÓN DE PRIVACIDAD
    -- ========================================================

    if tg_op = 'INSERT' then

        -- El cliente únicamente declara que aceptó.
        -- PostgreSQL establece la fecha efectiva.

        if new.privacy_accepted_at is not null then

            new.privacy_accepted_at := now();

        else

            new.privacy_accepted_at := null;

        end if;

    elsif tg_op = 'UPDATE' then

        if old.privacy_accepted_at is not null then

            -- Conservar la primera aceptación.

            new.privacy_accepted_at :=
                old.privacy_accepted_at;

        elsif new.privacy_accepted_at is not null then

            -- Registrar una primera aceptación.

            new.privacy_accepted_at := now();

        else

            new.privacy_accepted_at := null;

        end if;

    end if;

    -- ========================================================
    -- 6. CALCULAR LA COMPLETITUD DEL PERFIL
    -- ========================================================

    if
        nullif(
            trim(new.full_name),
            ''
        ) is not null

        and new.birthdate is not null

        and new.sex in (
            'male',
            'female',
            'prefer_not_to_say'
        )

        and new.privacy_accepted_at is not null

    then

        if tg_op = 'UPDATE' then

            -- Conservar la fecha original si el perfil
            -- ya se encontraba completo.

            new.profile_completed_at :=
                coalesce(
                    old.profile_completed_at,
                    now()
                );

        else

            new.profile_completed_at := now();

        end if;

    else

        new.profile_completed_at := null;

    end if;

    return new;

end;

$function$;

drop trigger if exists
    profiles_sync_is_adult_verified
on public.profiles;

create trigger profiles_sync_is_adult_verified
before insert or update
on public.profiles
for each row
execute function public.sync_profile_is_adult_verified();

commit;
