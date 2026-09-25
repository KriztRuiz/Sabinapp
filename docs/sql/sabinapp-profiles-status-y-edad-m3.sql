-- =====================================================
-- SABINAPP 1.0
-- M3 | Seguridad de perfiles: estado y mayoría de edad
--
-- Corrección aplicada y validada en Supabase.
--
-- Evidencia:
-- - Propietario normal no puede cambiar su status.
-- - is_adult_verified se recalcula en toda escritura.
-- - /dashboard/perfil continúa guardando correctamente.
--
-- Esta definición corresponde a una base Sabinapp
-- que ya dispone de profiles, profile_status,
-- has_role(text) y el esquema de autenticación.
--
-- No es una migración inicial para una BD vacía.
-- No es necesario volver a ejecutarla en el
-- proyecto Supabase donde ya fue aplicada.
-- =====================================================

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

    -- El estado del perfil solamente puede cambiarlo
    -- Administración o una operación de servidor autorizada.

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

    if tg_op = 'INSERT' then

        if not is_admin_user then
            new.status := 'active'::public.profile_status;
        end if;

    elsif tg_op = 'UPDATE' then

        if new.status is distinct from old.status
           and not is_admin_user then

            raise exception
                'Solo Administración puede cambiar el estado de un perfil.';

        end if;

    end if;

    -- is_adult_verified expresa la edad calculada
    -- a partir de la fecha de nacimiento declarada.
    -- No constituye verificación documental de edad.

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
