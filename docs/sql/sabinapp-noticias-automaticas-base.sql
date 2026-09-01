-- Sabinapp 1.0 - Base de datos para noticias automáticas
-- Estado: aplicado correctamente en Supabase
-- Objetivo:
-- Crear una capa interna para buscar, evaluar, deduplicar y auditar noticias
-- antes de publicarlas en public.local_news.

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.news_search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  description text,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint news_search_queries_query_length_check
    check (char_length(trim(query)) between 3 and 300),
  constraint news_search_queries_priority_check
    check (priority between 1 and 999)
);

create unique index if not exists news_search_queries_query_unique_idx
on public.news_search_queries (lower(query));

create index if not exists news_search_queries_active_priority_idx
on public.news_search_queries (is_active, priority);

create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text,
  domain text,
  source_type text not null default 'web',
  trust_level integer not null default 3,
  is_active boolean not null default true,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint news_sources_name_length_check
    check (char_length(trim(name)) between 2 and 120),
  constraint news_sources_base_url_http_check
    check (base_url is null or base_url ~* '^https?://'),
  constraint news_sources_source_type_check
    check (source_type in ('web', 'rss', 'social', 'official', 'other')),
  constraint news_sources_trust_level_check
    check (trust_level between 1 and 5)
);

create unique index if not exists news_sources_name_unique_idx
on public.news_sources (lower(name));

create index if not exists news_sources_active_trust_idx
on public.news_sources (is_active, trust_level desc);

create table if not exists public.news_fetch_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamp with time zone not null default now(),
  finished_at timestamp with time zone,
  status text not null default 'running',
  trigger_source text not null default 'manual',
  model_name text,
  search_query_count integer not null default 0,
  source_count integer not null default 0,
  candidates_found integer not null default 0,
  candidates_published integer not null default 0,
  error_message text,
  raw_result jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint news_fetch_runs_status_check
    check (status in ('running', 'completed', 'failed', 'partial')),
  constraint news_fetch_runs_trigger_source_check
    check (trigger_source in ('manual', 'cron', 'admin', 'system')),
  constraint news_fetch_runs_counts_check
    check (
      search_query_count >= 0
      and source_count >= 0
      and candidates_found >= 0
      and candidates_published >= 0
    ),
  constraint news_fetch_runs_finished_at_check
    check (finished_at is null or finished_at >= started_at)
);

create index if not exists news_fetch_runs_started_at_idx
on public.news_fetch_runs (started_at desc);

create index if not exists news_fetch_runs_status_idx
on public.news_fetch_runs (status);

create table if not exists public.news_candidates (
  id uuid primary key default gen_random_uuid(),
  fetch_run_id uuid references public.news_fetch_runs(id) on delete set null,
  title text not null,
  summary text not null,
  source_name text not null,
  source_url text not null,
  source_published_at timestamp with time zone,
  detected_at timestamp with time zone not null default now(),
  local_relevance text,
  relevance_score numeric(4,3) not null default 0,
  confidence_score numeric(4,3) not null default 0,
  status text not null default 'candidate',
  dedupe_key text,
  published_news_id uuid references public.local_news(id) on delete set null,
  rejection_reason text,
  ai_notes text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint news_candidates_title_length_check
    check (char_length(trim(title)) between 5 and 200),
  constraint news_candidates_summary_length_check
    check (char_length(trim(summary)) between 20 and 2000),
  constraint news_candidates_source_name_length_check
    check (char_length(trim(source_name)) between 2 and 120),
  constraint news_candidates_source_url_http_check
    check (source_url ~* '^https?://'),
  constraint news_candidates_relevance_score_check
    check (relevance_score >= 0 and relevance_score <= 1),
  constraint news_candidates_confidence_score_check
    check (confidence_score >= 0 and confidence_score <= 1),
  constraint news_candidates_status_check
    check (status in (
      'candidate',
      'needs_review',
      'approved',
      'published',
      'rejected',
      'duplicate',
      'failed'
    )),
  constraint news_candidates_dedupe_key_length_check
    check (dedupe_key is null or char_length(trim(dedupe_key)) between 8 and 200)
);

create unique index if not exists news_candidates_source_url_unique_idx
on public.news_candidates (lower(source_url));

create unique index if not exists news_candidates_dedupe_key_unique_idx
on public.news_candidates (lower(dedupe_key))
where dedupe_key is not null;

create index if not exists news_candidates_status_created_idx
on public.news_candidates (status, created_at desc);

create index if not exists news_candidates_fetch_run_idx
on public.news_candidates (fetch_run_id);

create index if not exists news_candidates_published_news_idx
on public.news_candidates (published_news_id);

create table if not exists public.news_candidate_sources (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.news_candidates(id) on delete cascade,
  source_name text not null,
  source_url text not null,
  source_title text,
  source_published_at timestamp with time zone,
  excerpt text,
  is_primary boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint news_candidate_sources_name_length_check
    check (char_length(trim(source_name)) between 2 and 120),
  constraint news_candidate_sources_source_url_http_check
    check (source_url ~* '^https?://')
);

create unique index if not exists news_candidate_sources_candidate_url_unique_idx
on public.news_candidate_sources (candidate_id, lower(source_url));

create unique index if not exists news_candidate_sources_one_primary_idx
on public.news_candidate_sources (candidate_id)
where is_primary = true;

create index if not exists news_candidate_sources_candidate_idx
on public.news_candidate_sources (candidate_id);

drop trigger if exists set_news_search_queries_updated_at on public.news_search_queries;
create trigger set_news_search_queries_updated_at
before update on public.news_search_queries
for each row
execute function public.set_updated_at();

drop trigger if exists set_news_sources_updated_at on public.news_sources;
create trigger set_news_sources_updated_at
before update on public.news_sources
for each row
execute function public.set_updated_at();

drop trigger if exists set_news_fetch_runs_updated_at on public.news_fetch_runs;
create trigger set_news_fetch_runs_updated_at
before update on public.news_fetch_runs
for each row
execute function public.set_updated_at();

drop trigger if exists set_news_candidates_updated_at on public.news_candidates;
create trigger set_news_candidates_updated_at
before update on public.news_candidates
for each row
execute function public.set_updated_at();

alter table public.news_search_queries enable row level security;
alter table public.news_sources enable row level security;
alter table public.news_fetch_runs enable row level security;
alter table public.news_candidates enable row level security;
alter table public.news_candidate_sources enable row level security;

drop policy if exists news_search_queries_select_admin on public.news_search_queries;
drop policy if exists news_search_queries_manage_admin on public.news_search_queries;

create policy news_search_queries_select_admin
on public.news_search_queries
for select
to authenticated
using (public.has_role('admin'));

create policy news_search_queries_manage_admin
on public.news_search_queries
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists news_sources_select_admin on public.news_sources;
drop policy if exists news_sources_manage_admin on public.news_sources;

create policy news_sources_select_admin
on public.news_sources
for select
to authenticated
using (public.has_role('admin'));

create policy news_sources_manage_admin
on public.news_sources
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists news_fetch_runs_select_admin on public.news_fetch_runs;
drop policy if exists news_fetch_runs_manage_admin on public.news_fetch_runs;

create policy news_fetch_runs_select_admin
on public.news_fetch_runs
for select
to authenticated
using (public.has_role('admin'));

create policy news_fetch_runs_manage_admin
on public.news_fetch_runs
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists news_candidates_select_admin on public.news_candidates;
drop policy if exists news_candidates_manage_admin on public.news_candidates;

create policy news_candidates_select_admin
on public.news_candidates
for select
to authenticated
using (public.has_role('admin'));

create policy news_candidates_manage_admin
on public.news_candidates
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists news_candidate_sources_select_admin on public.news_candidate_sources;
drop policy if exists news_candidate_sources_manage_admin on public.news_candidate_sources;

create policy news_candidate_sources_select_admin
on public.news_candidate_sources
for select
to authenticated
using (public.has_role('admin'));

create policy news_candidate_sources_manage_admin
on public.news_candidate_sources
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

grant select, insert, update, delete on public.news_search_queries to authenticated;
grant select, insert, update, delete on public.news_sources to authenticated;
grant select, insert, update, delete on public.news_fetch_runs to authenticated;
grant select, insert, update, delete on public.news_candidates to authenticated;
grant select, insert, update, delete on public.news_candidate_sources to authenticated;

insert into public.news_search_queries (
  query,
  description,
  priority
)
select
  v.query,
  v.description,
  v.priority
from (
  values
    (
      '"Sabinas Hidalgo"',
      'Menciones directas de Sabinas Hidalgo.',
      10
    ),
    (
      '"Sabinas Hidalgo" "Nuevo León"',
      'Noticias con mención directa del municipio y el estado.',
      20
    ),
    (
      '"Sabinas Hidalgo" seguridad clima servicios comunidad',
      'Temas locales que pueden afectar a usuarios y negocios.',
      30
    ),
    (
      '"Sabinas Hidalgo" negocios comercio eventos',
      'Actividad económica, negocios, eventos y avisos comunitarios.',
      40
    )
) as v(query, description, priority)
where not exists (
  select 1
  from public.news_search_queries q
  where lower(q.query) = lower(v.query)
);

commit;

-- Verificación recomendada después de aplicar:
--
-- select
--   table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name in (
--     'news_search_queries',
--     'news_sources',
--     'news_fetch_runs',
--     'news_candidates',
--     'news_candidate_sources'
--   )
-- order by table_name;
--
-- select
--   tablename,
--   count(*) as policies_count
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in (
--     'news_search_queries',
--     'news_sources',
--     'news_fetch_runs',
--     'news_candidates',
--     'news_candidate_sources'
--   )
-- group by tablename
-- order by tablename;
--
-- select
--   query,
--   priority,
--   is_active
-- from public.news_search_queries
-- order by priority;
