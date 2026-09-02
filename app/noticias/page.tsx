import type { Metadata } from "next";
import Link from "next/link";
import { NewsCommentForm } from "@/components/news/news-comment-form";
import { NewsCommentReportForm } from "@/components/news/news-comment-report-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Noticias locales | Sabinapp",
  description:
    "Consulta noticias y resúmenes locales relacionados con Sabinas Hidalgo, con enlace a su fuente original.",
  openGraph: {
    title: "Noticias locales | Sabinapp",
    description: "Resumen local de noticias relevantes para Sabinas Hidalgo.",
    type: "website",
  },
};

type PageProps = {
  searchParams?: Promise<{
    commentMessage?: string;
    commentError?: string;
    archivo?: string;
  }>;
};

type PublicProfileLabel = {
  id: string;
  display_name: string;
};

type NewsCommentRow = {
  id: string;
  comment: string;
  status: string;
  created_at: string;
  user_id: string;
};

type LocalNewsRow = {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
  news_comments: NewsCommentRow[] | null;
};

function buildProfileNameMap(labels: PublicProfileLabel[]) {
  return new Map(labels.map((label) => [label.id, label.display_name]));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}

const RECENT_NEWS_AGE_MS = 24 * 60 * 60 * 1000;
const FUTURE_NEWS_TOLERANCE_MS = 2 * 60 * 60 * 1000;

function isRecentNewsPublishedAt(value: string) {
  const publishedAt = new Date(value);

  if (Number.isNaN(publishedAt.getTime())) {
    return false;
  }

  const ageMs = Date.now() - publishedAt.getTime();

  return ageMs >= -FUTURE_NEWS_TOLERANCE_MS && ageMs <= RECENT_NEWS_AGE_MS;
}

function getNewsFreshness(value: string) {
  if (isRecentNewsPublishedAt(value)) {
    return {
      label: "Reciente",
      className: "bg-green-50 text-green-800",
    };
  }

  return {
    label: "Archivo",
    className: "bg-gray-100 text-gray-700",
  };
}

function normalizeArchiveIndex(value: string | undefined, total: number) {
  if (total <= 0) {
    return 0;
  }

  const parsedValue = Number.parseInt(value ?? "0", 10);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return Math.min(Math.max(parsedValue, 0), total - 1);
}

function buildArchiveHref(index: number) {
  return `/noticias?archivo=${index}`;
}



function getCommentNotice(
  searchParamsValue: Awaited<NonNullable<PageProps["searchParams"]>>,
) {
  if (searchParamsValue.commentError) {
    return {
      type: "error" as const,
      message: searchParamsValue.commentError,
    };
  }

  if (searchParamsValue.commentMessage) {
    return {
      type: "success" as const,
      message: searchParamsValue.commentMessage,
    };
  }

  return null;
}

type PublicNewsCardProps = {
  item: LocalNewsRow;
  profileNameMap: Map<string, string>;
  commentNotice: ReturnType<typeof getCommentNotice>;
  currentUserId: string | null;
  isAuthenticated: boolean;
};

function PublicNewsCard({
  item,
  profileNameMap,
  commentNotice,
  currentUserId,
  isAuthenticated,
}: PublicNewsCardProps) {
  const comments = (item.news_comments ?? [])
    .filter((comment) => comment.status === "published")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const freshness = getNewsFreshness(item.published_at);

  return (
    <article
      id={`noticia-${item.id}`}
      className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
              {item.source_name}
            </p>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${freshness.className}`}
            >
              {freshness.label}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-black">{item.title}</h2>

          <p className="mt-2 text-sm font-semibold text-gray-500">
            {formatDate(item.published_at)}
          </p>
        </div>

        <a
          href={item.source_url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-full bg-gray-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-gray-800"
        >
          Leer fuente principal
        </a>
      </div>

      <p className="mt-5 rounded-2xl bg-orange-50/60 p-5 leading-7 text-gray-700">
        {item.summary}
      </p>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50">
        <details>
          <summary className="cursor-pointer list-none p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-gray-500">
                  Comentarios
                </p>

                <h3 className="mt-1 text-xl font-black text-gray-950">
                  Comunidad Sabinapp
                </h3>
              </div>

              <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-black text-gray-700">
                Ver comentarios ({comments.length})
              </span>
            </div>
          </summary>

          <div className="border-t border-gray-200 p-5">
            {commentNotice ? (
              <div
                className={`rounded-2xl border p-4 text-sm font-semibold ${
                  commentNotice.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {commentNotice.message}
              </div>
            ) : null}

            <details className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-gray-900">
                Agregar comentario
              </summary>

              <NewsCommentForm newsId={item.id} isAuthenticated={isAuthenticated} />
            </details>

            {comments.length > 0 ? (
              <div className="mt-5 space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-gray-100 bg-white p-4"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-bold text-gray-950">
                        {profileNameMap.get(comment.user_id) ?? "Usuario local"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {comment.comment}
                    </p>

                    <NewsCommentReportForm
                      newsId={item.id}
                      commentId={comment.id}
                      commentUserId={comment.user_id}
                      currentUserId={currentUserId}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-gray-600">
                Todavía no hay comentarios en esta noticia.
              </p>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}


export default async function LocalNewsPage({ searchParams }: PageProps) {
  const searchParamsValue = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const now = new Date().toISOString();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("local_news")
    .select(
      `
      id,
      title,
      summary,
      source_name,
      source_url,
      published_at,
      news_comments (
        id,
        comment,
        status,
        created_at,
        user_id
      )
    `,
    )
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order("published_at", { ascending: false })
    .limit(20);

  const news = (data ?? []) as unknown as LocalNewsRow[];
  const commentUserIds = Array.from(
    new Set(
      news.flatMap((item) =>
        (item.news_comments ?? []).map((comment) => comment.user_id),
      ),
    ),
  );

  let profileLabels: PublicProfileLabel[] = [];

  if (commentUserIds.length > 0) {
    const { data: profileLabelsData } = await supabase.rpc(
      "get_public_profile_labels",
      {
        profile_ids: commentUserIds,
      },
    );

    profileLabels = (profileLabelsData ?? []) as PublicProfileLabel[];
  }

  const profileNameMap = buildProfileNameMap(profileLabels);

  const publishedCommentsCount = news.reduce(
    (total, item) =>
      total +
      (item.news_comments ?? []).filter(
        (comment) => comment.status === "published",
      ).length,
    0,
  );

  const sourceCount = new Set(news.map((item) => item.source_name)).size;
  const latestPublishedAt = news[0]?.published_at ?? null;
  const recentNews = news.filter((item) =>
    isRecentNewsPublishedAt(item.published_at),
  );

  const archiveNews = news.filter(
    (item) => !isRecentNewsPublishedAt(item.published_at),
  );

  const archiveIndex = normalizeArchiveIndex(
    searchParamsValue.archivo,
    archiveNews.length,
  );

  const selectedArchiveNews = archiveNews[archiveIndex] ?? null;
  const previousArchiveIndex = archiveIndex > 0 ? archiveIndex - 1 : null;
  const nextArchiveIndex =
    archiveIndex + 1 < archiveNews.length ? archiveIndex + 1 : null;

  const commentNotice = getCommentNotice(searchParamsValue);
  const currentUserId = user?.id ?? null;
  const isAuthenticated = Boolean(user);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-sky-50 px-6 py-10 text-gray-950">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-orange-100 pb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            ← Volver a Sabinapp
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-orange-700">
            Noticias locales
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Noticias que importan a Sabinas Hidalgo
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-gray-600">
            Encuentra avisos, notas y noticias relevantes para la comunidad. Las noticias se conservan como archivo público y se muestran de la más reciente a la más antigua.
          </p>
        </header>

        {!error ? (
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-700">
                Noticias activas
              </p>

              <p className="mt-3 text-4xl font-black">{news.length}</p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Recientes completas y archivo consultable una noticia a la vez.
              </p>
            </article>

            <article className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-sky-700">
                Última actualización
              </p>

              <p className="mt-3 text-lg font-black">
                {latestPublishedAt ? formatDate(latestPublishedAt) : "Sin dato"}
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Según las noticias activas guardadas en Sabinapp.
              </p>
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-gray-600">
                Participación
              </p>

              <p className="mt-3 text-4xl font-black">
                {publishedCommentsCount}
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Comentarios visibles en {sourceCount} fuente(s).
              </p>
            </article>
          </section>
        ) : null}

        {error ? (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h2 className="text-xl font-black">
              No pudimos cargar las noticias
            </h2>

            <p className="mt-2 text-sm">
              Intenta de nuevo más tarde. Si el problema continúa, revisaremos
              la sección de noticias.
            </p>
          </section>
        ) : null}

        {!error && news.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black">
              Todavía no hay noticias publicadas
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-gray-600">
              Cuando haya noticias, avisos o comunicados relevantes para
              Sabinas Hidalgo, aparecerán aquí con enlace a su fuente original.
            </p>
          </section>
        ) : null}

        {news.length > 0 ? (
          <section className="mt-8 space-y-8">
            {recentNews.length > 0 ? (
              <section className="space-y-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
                    Noticias recientes
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-gray-950">
                    Lo más nuevo para la comunidad
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                    Publicaciones de las últimas 24 horas.
                  </p>
                </div>

                <div className="grid gap-5">
{recentNews.map((item) => (
                  <PublicNewsCard
                    key={item.id}
                    item={item}
                    profileNameMap={profileNameMap}
                    commentNotice={commentNotice}
                    currentUserId={currentUserId}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
                </div>
              </section>
            ) : null}

            {selectedArchiveNews ? (
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">
                      Archivo
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-gray-950">
                      Noticias anteriores
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Mostrando {archiveIndex + 1} de {archiveNews.length}.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {previousArchiveIndex !== null ? (
                      <Link
                        href={buildArchiveHref(previousArchiveIndex)}
                        className="rounded-full border border-gray-300 px-4 py-2 text-center text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                      >
                        ← Más reciente
                      </Link>
                    ) : (
                      <span className="rounded-full border border-gray-200 px-4 py-2 text-center text-sm font-bold text-gray-400">
                        ← Más reciente
                      </span>
                    )}

                    {nextArchiveIndex !== null ? (
                      <Link
                        href={buildArchiveHref(nextArchiveIndex)}
                        className="rounded-full bg-gray-950 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-gray-800"
                      >
                        Más antigua →
                      </Link>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-4 py-2 text-center text-sm font-bold text-gray-400">
                        Más antigua →
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-5">
<PublicNewsCard
                  item={selectedArchiveNews}
                  profileNameMap={profileNameMap}
                  commentNotice={commentNotice}
                  currentUserId={currentUserId}
                  isAuthenticated={isAuthenticated}
                />
                </div>
              </section>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
