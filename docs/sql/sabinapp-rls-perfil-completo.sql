-- =========================================================
-- Sabinapp - SQL crítico aplicado manualmente en Supabase
-- Tema: perfil completo, nombres públicos y mayoría de edad interna
-- =========================================================

-- =========================================================
-- 1) Nombre público mínimo para comentarios y reseñas
-- =========================================================

create or replace function public.get_public_profile_labels(profile_ids uuid[])
returns table (
  id uuid,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    case
      when nullif(trim(p.username), '') is not null then
        trim(p.username)

      when nullif(trim(p.full_name), '') is not null then
        split_part(trim(p.full_name), ' ', 1) ||
        case
          when nullif(split_part(trim(p.full_name), ' ', 2), '') is not null then
            ' ' || left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
          else
            ''
        end

      else
        'Usuario local'
    end as display_name
  from public.profiles p
  where p.id = any(profile_ids)
    and p.status = 'active'::public.profile_status;
$$;

revoke all on function public.get_public_profile_labels(uuid[]) from public;
grant execute on function public.get_public_profile_labels(uuid[]) to anon;
grant execute on function public.get_public_profile_labels(uuid[]) to authenticated;


-- =========================================================
-- 2) Validación central de perfil completo
-- =========================================================

create or replace function public.is_profile_complete(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.status = 'active'::public.profile_status
      and nullif(trim(p.full_name), '') is not null
      and p.birthdate is not null
      and p.sex in ('male', 'female', 'prefer_not_to_say')
      and p.privacy_accepted_at is not null
      and p.profile_completed_at is not null
  );
$$;

revoke all on function public.is_profile_complete(uuid) from public;
grant execute on function public.is_profile_complete(uuid) to anon;
grant execute on function public.is_profile_complete(uuid) to authenticated;


-- =========================================================
-- 3) RLS: negocios requieren perfil completo para crear/editar
-- =========================================================

drop policy if exists businesses_insert_registered_user on public.businesses;

create policy businesses_insert_registered_user
on public.businesses
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.has_permission('business.create'::text)
  and public.is_profile_complete(auth.uid())
);

drop policy if exists businesses_update_owner on public.businesses;

create policy businesses_update_owner
on public.businesses
for update
to authenticated
using (
  owner_id = auth.uid()
  and status <> 'archived'::public.business_status
  and public.is_profile_complete(auth.uid())
)
with check (
  owner_id = auth.uid()
  and status = any (
    array[
      'draft'::public.business_status,
      'pending_review'::public.business_status,
      'published'::public.business_status,
      'hidden'::public.business_status,
      'rejected'::public.business_status
    ]
  )
  and public.is_profile_complete(auth.uid())
);


-- =========================================================
-- 4) RLS: comentarios de noticias requieren perfil completo
-- =========================================================

drop policy if exists news_comments_insert_authenticated on public.news_comments;

create policy news_comments_insert_authenticated
on public.news_comments
for insert
to public
with check (
  user_id = auth.uid()
  and status = 'published'::public.news_comment_status
  and public.is_profile_complete(auth.uid())
  and exists (
    select 1
    from public.local_news n
    where n.id = news_comments.news_id
      and n.is_active = true
      and (n.expires_at is null or n.expires_at >= now())
  )
);


-- =========================================================
-- 5) RLS: reseñas requieren perfil completo
-- =========================================================

drop policy if exists reviews_insert_authenticated on public.reviews;

create policy reviews_insert_authenticated
on public.reviews
for insert
to public
with check (
  user_id = auth.uid()
  and status = 'published'::public.review_status
  and (
    rating is not null
    or (
      comment is not null
      and length(trim(comment)) >= 3
    )
  )
  and public.can_write_business_review(business_id, auth.uid())
  and public.is_profile_complete(auth.uid())
  and exists (
    select 1
    from public.businesses b
    where b.id = reviews.business_id
      and b.status = 'published'::public.business_status
      and b.is_published = true
      and b.is_adult_content = false
      and b.show_reviews_publicly = true
      and (b.expires_at is null or b.expires_at >= now())
  )
);

drop policy if exists reviews_update_own_published on public.reviews;

create policy reviews_update_own_published
on public.reviews
for update
to public
using (
  user_id = auth.uid()
  and status = 'published'::public.review_status
  and public.can_write_business_review(business_id, auth.uid())
  and public.is_profile_complete(auth.uid())
)
with check (
  user_id = auth.uid()
  and status = 'published'::public.review_status
  and (
    rating is not null
    or (
      comment is not null
      and length(trim(comment)) >= 3
    )
  )
  and public.is_profile_complete(auth.uid())
  and exists (
    select 1
    from public.businesses b
    where b.id = reviews.business_id
      and b.status = 'published'::public.business_status
      and b.is_published = true
      and b.is_adult_content = false
      and b.show_reviews_publicly = true
      and (b.expires_at is null or b.expires_at >= now())
  )
);


-- =========================================================
-- 6) RLS: reportes de reseñas/comentarios requieren perfil completo
-- =========================================================

drop policy if exists reports_insert_public on public.reports;

create policy reports_insert_public
on public.reports
for insert
to public
with check (
  status = 'new'::public.report_status
  and (
    (
      target_type = any (
        array[
          'business'::public.report_target_type,
          'contact_method'::public.report_target_type,
          'media'::public.report_target_type,
          'item'::public.report_target_type,
          'user'::public.report_target_type,
          'platform'::public.report_target_type,
          'other'::public.report_target_type
        ]
      )
      and (
        reporter_id is null
        or reporter_id = auth.uid()
      )
    )
    or
    (
      target_type = any (
        array[
          'review'::public.report_target_type,
          'news_comment'::public.report_target_type
        ]
      )
      and auth.uid() is not null
      and reporter_id = auth.uid()
      and public.is_profile_complete(auth.uid())
    )
  )
);


-- =========================================================
-- 7) Mayoría de edad interna sincronizada
-- =========================================================

create or replace function public.sync_profile_is_adult_verified()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.is_adult_verified :=
    case
      when new.birthdate is null then false
      when new.birthdate <= current_date - interval '18 years' then true
      else false
    end;

  return new;
end;
$$;

drop trigger if exists profiles_sync_is_adult_verified on public.profiles;

create trigger profiles_sync_is_adult_verified
before insert or update of birthdate
on public.profiles
for each row
execute function public.sync_profile_is_adult_verified();

-- =========================================================
-- 8) Roles/permisos sólo para perfiles activos
-- =========================================================

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles pr on pr.id = ur.user_id
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions perm on perm.id = rp.permission_id
    where ur.user_id = auth.uid()
      and ur.is_active = true
      and pr.status = 'active'::public.profile_status
      and perm.key = $1
  );
$$;

create or replace function public.has_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles pr on pr.id = ur.user_id
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and ur.is_active = true
      and pr.status = 'active'::public.profile_status
      and r.key = $1
  );
$$;

revoke all on function public.has_permission(text) from public;
revoke all on function public.has_role(text) from public;

grant execute on function public.has_permission(text) to anon;
grant execute on function public.has_permission(text) to authenticated;

grant execute on function public.has_role(text) to anon;
grant execute on function public.has_role(text) to authenticated;
