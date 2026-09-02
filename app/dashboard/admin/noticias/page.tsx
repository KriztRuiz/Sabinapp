import Link from "next/link";
import { redirect } from "next/navigation";
import { NewsCandidateActions } from "./news-candidate-actions";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type CandidateSourceRow = {
  id: string;
  source_name: string;
  source_url: string;
  source_title: string | null;
  excerpt: string | null;
  is_primary: boolean;
  created_at: string;
};

type NewsCandidateRow = {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  source_published_at: string | null;
  local_relevance: string | null;
  relevance_score: number | string | null;
  confidence_score: number | string | null;
  status: string;
  rejection_reason: string | null;
  published_news_id: string | null;
  created_at: string;
  updated_at: string | null;
  news_candidate_sources: CandidateSourceRow[] | null;
};

type NewsFetchRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  trigger_source: string;
  model_name: string | null;
  search_query_count: number | null;
  source_count: number | null;
  candidates_found: number | null;
  candidates_published: number | null;
  error_message: string | null;
};

type LocalNewsRow = {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  published_at: string;
  is_active: boolean;
  created_at: string;
};

const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  candidate: "Candidato",
  needs_review: "Requiere revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  published: "Publicado",
  duplicate: "Duplicado",
};

const CANDIDATE_STATUS_CLASSES: Record<string, string> = {
  candidate: "bg-blue-50 text-blue-800",
  needs_review: "bg-yellow-50 text-yellow-800",
  approved: "bg-green-50 text-green-800",
  rejected: "bg-red-50 text-red-800",
  published: "bg-emerald-50 text-emerald-800",
  duplicate: "bg-gray-100 text-gray-700",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin dato";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(date);
}

function formatScore(value: number | string | null) {
  if (value === null) {
    return "Sin dato";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "Sin dato";
  }

  return `${Math.round(numericValue * 100)}%`;
}

function getStatusLabel(status: string) {
  return CANDIDATE_STATUS_LABELS[status] ?? status;
}

function getStatusClasses(status: string) {
  return CANDIDATE_STATUS_CLASSES[status] ?? "bg-gray-100 text-gray-700";
}

function isPublishableCandidate(candidate: NewsCandidateRow) {
  return (
    !candidate.published_news_id &&
    ["candidate", "needs_review", "approved"].includes(candidate.status)
  );
}

function getSortedSources(candidate: NewsCandidateRow) {
  return [...(candidate.news_candidate_sources ?? [])].sort((a, b) => {
    if (a.is_primary === b.is_primary) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    return a.is_primary ? -1 : 1;
  });
}

function buildCandidateSections(candidates: NewsCandidateRow[]) {
  return [
    {
      key: "pending",
      title: "Pendientes de revisión",
      description:
        "Candidatos generados por IA que todavía no se publican ni rechazan.",
      candidates: candidates.filter((candidate) =>
        ["candidate", "needs_review", "approved"].includes(candidate.status),
      ),
    },
    {
      key: "published",
      title: "Publicados",
      description: "Candidatos que ya fueron convertidos en noticia pública.",
      candidates: candidates.filter((candidate) => candidate.status === "published"),
    },
    {
      key: "rejected",
      title: "Rechazados o duplicados",
      description:
        "Candidatos descartados para evitar errores, duplicados o notas sin valor local.",
      candidates: candidates.filter((candidate) =>
        ["rejected", "duplicate"].includes(candidate.status),
      ),
    },
  ];
}

export default async function AdminNewsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para revisar noticias.");
  }

  const { data: canReviewBusinesses } = await supabase.rpc("has_permission", {
    permission_key: "admin.review_businesses",
  });

  if (!canReviewBusinesses) {
    redirect("/dashboard?error=No tienes permiso para revisar noticias.");
  }

  const { data: candidatesRaw, error: candidatesError } = await supabase
    .from("news_candidates")
    .select(
      `
      id,
      title,
      summary,
      source_name,
      source_url,
      source_published_at,
      local_relevance,
      relevance_score,
      confidence_score,
      status,
      rejection_reason,
      published_news_id,
      created_at,
      updated_at,
      news_candidate_sources (
        id,
        source_name,
        source_url,
        source_title,
        excerpt,
        is_primary,
        created_at
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: fetchRunsRaw } = await supabase
    .from("news_fetch_runs")
    .select(
      `
      id,
      started_at,
      finished_at,
      status,
      trigger_source,
      model_name,
      search_query_count,
      source_count,
      candidates_found,
      candidates_published,
      error_message
    `,
    )
    .order("started_at", { ascending: false })
    .limit(5);

  const { data: localNewsRaw } = await supabase
    .from("local_news")
    .select("id, title, source_name, source_url, published_at, is_active, created_at")
    .order("published_at", { ascending: false })
    .limit(8);

  const candidates = (candidatesRaw ?? []) as unknown as NewsCandidateRow[];
  const fetchRuns = (fetchRunsRaw ?? []) as NewsFetchRunRow[];
  const localNews = (localNewsRaw ?? []) as LocalNewsRow[];

  const pendingCount = candidates.filter((candidate) =>
    ["candidate", "needs_review", "approved"].includes(candidate.status),
  ).length;

  const publishedCount = candidates.filter(
    (candidate) => candidate.status === "published",
  ).length;

  const rejectedCount = candidates.filter((candidate) =>
    ["rejected", "duplicate"].includes(candidate.status),
  ).length;

  const latestRun = fetchRuns[0] ?? null;
  const sections = buildCandidateSections(candidates);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-orange-600 hover:text-orange-700"
        >
          ← Volver al dashboard
        </Link>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-orange-700">
          Administración
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-950">
          Noticias candidatas
        </h1>

        <p className="mt-3 max-w-3xl text-gray-600">
          Revisa noticias encontradas automáticamente antes de publicarlas en
          Sabinapp. La IA sólo propone candidatos; la publicación final queda en
          manos del administrador.
        </p>
      </header>

      {query.message ? (
        <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">
          {query.message}
        </section>
      ) : null}

      {query.error ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          {query.error}
        </section>
      ) : null}

      {candidatesError ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          No pudimos cargar candidatos: {candidatesError.message}
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-800">
            Pendientes
          </p>
          <p className="mt-3 text-4xl font-black text-yellow-950">
            {pendingCount}
          </p>
        </article>

        <article className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-green-800">
            Publicados
          </p>
          <p className="mt-3 text-4xl font-black text-green-950">
            {publishedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-800">
            Rechazados
          </p>
          <p className="mt-3 text-4xl font-black text-red-950">
            {rejectedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
            Última búsqueda
          </p>
          <p className="mt-3 text-sm font-bold text-gray-950">
            {latestRun ? formatDate(latestRun.started_at) : "Sin búsquedas"}
          </p>
          {latestRun ? (
            <p className="mt-1 text-xs text-gray-500">
              {latestRun.status} · {latestRun.candidates_found ?? 0} candidatos
            </p>
          ) : null}
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-950">
              Historial reciente de búsquedas
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Sirve para detectar errores de IA, fallas de fuente o ejecuciones
              sin candidatos.
            </p>
          </div>

          <Link
            href="/noticias"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
          >
            Ver noticias públicas
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-[0.16em] text-gray-500">
              <tr>
                <th className="py-3 pr-4">Inicio</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 pr-4">Modelo</th>
                <th className="py-3 pr-4">Consultas</th>
                <th className="py-3 pr-4">Fuentes</th>
                <th className="py-3 pr-4">Candidatos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fetchRuns.length > 0 ? (
                fetchRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="py-3 pr-4 text-gray-700">
                      {formatDate(run.started_at)}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-950">
                      {run.status}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {run.model_name ?? "Sin dato"}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {run.search_query_count ?? 0}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {run.source_count ?? 0}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {run.candidates_found ?? 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-gray-600" colSpan={6}>
                    Todavía no hay búsquedas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.key} className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-gray-950">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{section.description}</p>
          </div>

          <div className="space-y-4">
            {section.candidates.length > 0 ? (
              section.candidates.map((candidate) => {
                const sources = getSortedSources(candidate);

                return (
                  <article
                    key={candidate.id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                              candidate.status,
                            )}`}
                          >
                            {getStatusLabel(candidate.status)}
                          </span>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                            Relevancia: {formatScore(candidate.relevance_score)}
                          </span>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                            Confianza: {formatScore(candidate.confidence_score)}
                          </span>
                        </div>

                        <h3 className="mt-4 text-xl font-black text-gray-950">
                          {candidate.title}
                        </h3>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">
                          {candidate.summary}
                        </p>

                        {candidate.local_relevance ? (
                          <p className="mt-3 max-w-3xl rounded-xl bg-orange-50 p-3 text-sm leading-6 text-orange-950">
                            <span className="font-bold">Valor local: </span>
                            {candidate.local_relevance}
                          </p>
                        ) : null}

                        {candidate.rejection_reason ? (
                          <p className="mt-3 max-w-3xl rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-950">
                            <span className="font-bold">Motivo: </span>
                            {candidate.rejection_reason}
                          </p>
                        ) : null}

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="font-bold text-gray-500">
                              Fuente principal
                            </dt>
                            <dd className="text-gray-950">
                              {candidate.source_name}
                            </dd>
                          </div>

                          <div>
                            <dt className="font-bold text-gray-500">
                              Encontrada
                            </dt>
                            <dd className="text-gray-950">
                              {formatDate(candidate.created_at)}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4">
                          <a
                            href={candidate.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold text-orange-700 underline-offset-4 hover:underline"
                          >
                            Abrir fuente principal
                          </a>
                        </div>
                      </div>

                      {isPublishableCandidate(candidate) ? (
                        <NewsCandidateActions
                          candidateId={candidate.id}
                          title={candidate.title}
                        />
                      ) : null}
                    </div>

                    {sources.length > 0 ? (
                      <details className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <summary className="cursor-pointer text-sm font-bold text-gray-800">
                          Ver fuentes usadas por el candidato
                        </summary>

                        <div className="mt-4 space-y-3">
                          {sources.map((source) => (
                            <div
                              key={source.id}
                              className="rounded-lg bg-white p-4 text-sm"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-gray-950">
                                  {source.source_name}
                                </p>

                                {source.is_primary ? (
                                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-800">
                                    Principal
                                  </span>
                                ) : null}
                              </div>

                              {source.source_title ? (
                                <p className="mt-1 text-gray-700">
                                  {source.source_title}
                                </p>
                              ) : null}

                              {source.excerpt ? (
                                <p className="mt-2 text-gray-600">
                                  {source.excerpt}
                                </p>
                              ) : null}

                              <a
                                href={source.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex font-bold text-orange-700 underline-offset-4 hover:underline"
                              >
                                Abrir fuente
                              </a>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                No hay candidatos en esta sección.
              </div>
            )}
          </div>
        </section>
      ))}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-gray-950">
          Noticias públicas recientes
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {localNews.length > 0 ? (
            localNews.map((news) => (
              <article
                key={news.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    {news.is_active ? "Activa" : "Inactiva"}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    {formatDate(news.published_at)}
                  </span>
                </div>

                <h3 className="mt-3 font-black text-gray-950">{news.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{news.source_name}</p>

                <a
                  href={news.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-bold text-orange-700 underline-offset-4 hover:underline"
                >
                  Abrir fuente
                </a>
              </article>
            ))
          ) : (
            <p className="text-sm text-gray-600">
              Todavía no hay noticias públicas.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
