import { requireModerationAccess } from "../moderation-access";
import { ModerationPage, type PageProps } from "../moderation-page";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  resolveNewsCommentReport,
  rejectNewsCommentReport,
  markNewsCommentReportInReview,
  hideReportedNewsComment,
  closeNewsCommentReport,
} from "../actions";
import { type ReportStatus, REPORT_STATUS_LABELS, REPORT_STATUS_BADGE_CLASSES, REPORT_REASON_LABELS, getSingleRelation, formatShortId, formatDate } from "../moderation-format";

type NewsCommentNewsRelation =
  | {
      id: string;
      title: string;
    }
  | {
      id: string;
      title: string;
    }[]
  | null;

type NewsCommentRelation =
  | {
      id: string;
      news_id: string;
      comment: string;
      status: string;
      hidden_reason: string | null;
      created_at: string;
      updated_at: string;
      news: NewsCommentNewsRelation;
    }
  | {
      id: string;
      news_id: string;
      comment: string;
      status: string;
      hidden_reason: string | null;
      created_at: string;
      updated_at: string;
      news: NewsCommentNewsRelation;
    }[]
  | null;

type NewsCommentReportRow = {
  id: string;
  status: ReportStatus;
  target_type: string;
  reason: string;
  title: string | null;
  description: string;
  news_comment_id: string | null;
  reporter_id: string | null;
  reported_user_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  news_comment: NewsCommentRelation;
};

export default async function Page({ searchParams }: PageProps) {
  const { supabase, canManageReports } = await requireModerationAccess();
  if (!canManageReports) redirect("/dashboard/admin/negocios");
  const newsCommentReportsResult = await supabase
    .from("reports")
    .select(
      `
      id,
      status,
      target_type,
      reason,
      title,
      description,
      news_comment_id,
      reporter_id,
      reported_user_id,
      created_at,
      reviewed_at,
      admin_notes,
      news_comment:news_comments (
        id,
        news_id,
        comment,
        status,
        hidden_reason,
        created_at,
        updated_at,
        news:local_news (
          id,
          title
        )
      )
    `,
    )
    .eq("target_type", "news_comment")
    .order("created_at", { ascending: false })
    .limit(50);

  const newsCommentReportsRaw = newsCommentReportsResult.data ?? [];
  const newsCommentReportsError = newsCommentReportsResult.error;

  const newsCommentReports =
    newsCommentReportsRaw as NewsCommentReportRow[];

  const activeNewsCommentReports = newsCommentReports.filter(
    (report) => report.status === "new" || report.status === "in_review",
  );

  const closedNewsCommentReports = newsCommentReports.filter(
    (report) => report.status !== "new" && report.status !== "in_review",
  );

  return (
    <ModerationPage section="comentarios" reports={Boolean(canManageReports)} {...await searchParams}>
      <section
        id="reportes-comentarios-noticias"
        className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
              Reportes de comentarios
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-950">
              Comentarios de noticias reportados
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Estos reportes no ocultan comentarios automáticamente. Revisa
              el caso y decide si el comentario se mantiene o se oculta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-orange-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                Pendientes
              </p>
              <p className="mt-1 text-3xl font-black text-orange-900">
                {activeNewsCommentReports.length}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                Historial
              </p>
              <p className="mt-1 text-3xl font-black text-gray-950">
                {closedNewsCommentReports.length}
              </p>
            </div>

            <div className="rounded-2xl bg-yellow-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-700">
                Total
              </p>
              <p className="mt-1 text-3xl font-black text-yellow-900">
                {newsCommentReports.length}
              </p>
            </div>
          </div>
        </div>

        {newsCommentReportsError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            No pudimos cargar los reportes de comentarios.
          </div>
        ) : null}

        {!newsCommentReportsError && newsCommentReports.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            Todavía no hay reportes de comentarios en noticias.
          </div>
        ) : null}

        {!newsCommentReportsError && newsCommentReports.length > 0 ? (
          <div className="mt-6 space-y-4">
            {newsCommentReports.map((report) => {
              const comment = getSingleRelation(report.news_comment);
              const news = getSingleRelation(comment?.news ?? null);
              const isActiveReport =
                report.status === "new" || report.status === "in_review";

              return (
                <article
                  key={report.id}
                  className="rounded-3xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            REPORT_STATUS_BADGE_CLASSES[report.status]
                          }`}
                        >
                          {REPORT_STATUS_LABELS[report.status]}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700">
                          {REPORT_REASON_LABELS[report.reason] ??
                            report.reason}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black text-gray-950">
                        {news?.title ?? "Noticia sin dato"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Reportado el {formatDate(report.created_at)}
                      </p>

                      <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {report.description}
                      </p>
                    </div>

                    {news?.id ? (
                      <Link
                        href={`/noticias#noticia-${news.id}`}
                        className="w-fit rounded-full bg-gray-950 px-4 py-2 text-sm font-black text-white transition hover:bg-gray-800"
                      >
                        Ver noticia
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                        Comentario reportado
                      </p>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {comment?.comment?.trim()
                          ? comment.comment
                          : "El comentario no está disponible."}
                      </p>

                      <p className="mt-3 text-xs text-gray-500">
                        Estado actual: {comment?.status ?? "Sin dato"}
                      </p>

                      {comment?.hidden_reason ? (
                        <p className="mt-2 text-xs text-red-700">
                          Motivo ocultamiento: {comment.hidden_reason}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                        Usuarios
                      </p>

                      <p className="mt-3 text-sm text-gray-700">
                        Reporta:{" "}
                        <span className="font-bold">
                          {formatShortId(report.reporter_id)}
                        </span>
                      </p>

                      <p className="mt-2 text-sm text-gray-700">
                        Autor del comentario:{" "}
                        <span className="font-bold">
                          {formatShortId(report.reported_user_id)}
                        </span>
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        ID reporte: {formatShortId(report.id)}
                      </p>

                      {report.admin_notes ? (
                        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                          {report.admin_notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {isActiveReport ? (
                      <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <p className="text-sm font-black text-gray-950">
                          Acciones del reporte
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {report.status === "new" ? (
                            <form action={markNewsCommentReportInReview}>
                              <input
                                type="hidden"
                                name="reportId"
                                value={report.id}
                              />
                              <button
                                type="submit"
                                className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-black text-white transition hover:bg-yellow-600"
                              >
                                Marcar en revisión
                              </button>
                            </form>
                          ) : null}

                          <form action={resolveNewsCommentReport}>
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />
                            <input
                              type="hidden"
                              name="adminNotes"
                              value="Reporte revisado sin ocultar el comentario."
                            />
                            <button
                              type="submit"
                              className="rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:bg-green-700"
                            >
                              Resolver sin ocultar
                            </button>
                          </form>

                          <form action={rejectNewsCommentReport}>
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />
                            <input
                              type="hidden"
                              name="adminNotes"
                              value="Reporte rechazado por administración."
                            />
                            <button
                              type="submit"
                              className="rounded-full bg-gray-700 px-4 py-2 text-sm font-black text-white transition hover:bg-gray-800"
                            >
                              Rechazar reporte
                            </button>
                          </form>

                          <form action={closeNewsCommentReport}>
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />
                            <input
                              type="hidden"
                              name="adminNotes"
                              value="Reporte cerrado por administración."
                            />
                            <button
                              type="submit"
                              className="rounded-full bg-zinc-600 px-4 py-2 text-sm font-black text-white transition hover:bg-zinc-700"
                            >
                              Cerrar
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : null}

                    {isActiveReport && report.news_comment_id ? (
                      <form
                        action={hideReportedNewsComment}
                        className="rounded-2xl border border-red-200 bg-red-50 p-4"
                      >
                        <input
                          type="hidden"
                          name="reportId"
                          value={report.id}
                        />
                        <input
                          type="hidden"
                          name="newsCommentId"
                          value={report.news_comment_id}
                        />

                        <label className="block">
                          <span className="text-sm font-black text-red-900">
                            Ocultar comentario
                          </span>

                          <textarea
                            name="hiddenReason"
                            rows={3}
                            minLength={10}
                            required
                            placeholder="Explica por qué se ocultará este comentario."
                            className="mt-2 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                          />
                        </label>

                        <button
                          type="submit"
                          className="mt-3 rounded-full bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800"
                        >
                          Ocultar comentario y resolver reporte
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </ModerationPage>
  );
}
