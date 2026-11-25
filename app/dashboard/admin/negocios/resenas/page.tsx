import { requireModerationAccess } from "../moderation-access";
import { ModerationPage, type PageProps } from "../moderation-page";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  resolveReviewReport,
  rejectReviewReport,
  markReviewReportInReview,
  hideReportedReview,
  closeReviewReport,
} from "../actions";
import { type ReportStatus, REPORT_STATUS_LABELS, REPORT_STATUS_BADGE_CLASSES, REPORT_REASON_LABELS, getSingleRelation, formatShortId, formatDate } from "../moderation-format";

type ReportBusinessRelation =
  | {
      name: string;
      slug: string;
    }
  | {
      name: string;
      slug: string;
    }[]
  | null;

type ReportReviewRelation =
  | {
      rating: number | null;
      comment: string | null;
      status: string;
      hidden_reason: string | null;
      created_at: string;
      updated_at: string;
    }
  | {
      rating: number | null;
      comment: string | null;
      status: string;
      hidden_reason: string | null;
      created_at: string;
      updated_at: string;
    }[]
  | null;

type ReviewReportRow = {
  id: string;
  status: ReportStatus;
  target_type: string;
  reason: string;
  title: string | null;
  description: string;
  business_id: string | null;
  review_id: string | null;
  reporter_id: string | null;
  reported_user_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  business: ReportBusinessRelation;
  review: ReportReviewRelation;
};

export default async function Page({ searchParams }: PageProps) {
  const { supabase, canManageReports } = await requireModerationAccess();
  if (!canManageReports) redirect("/dashboard/admin/negocios");
  const reviewReportsResult = await supabase
    .from("reports")
    .select(
      `
      id,
      status,
      target_type,
      reason,
      title,
      description,
      business_id,
      review_id,
      reporter_id,
      reported_user_id,
      created_at,
      reviewed_at,
      admin_notes,
      business:businesses (
        name,
        slug
      ),
      review:reviews (
        rating,
        comment,
        status,
        hidden_reason,
        created_at,
        updated_at
      )
    `,
    )
    .eq("target_type", "review")
    .order("created_at", { ascending: false })
    .limit(50);

  const reviewReportsRaw = reviewReportsResult.data ?? [];
  const reviewReportsError = reviewReportsResult.error;

  const reviewReports = reviewReportsRaw as ReviewReportRow[];

  const activeReviewReports = reviewReports.filter(
    (report) => report.status === "new" || report.status === "in_review",
  );

  const closedReviewReports = reviewReports.filter(
    (report) => report.status !== "new" && report.status !== "in_review",
  );

  return (
    <ModerationPage section="resenas" reports={Boolean(canManageReports)} {...await searchParams}>
      <section
        id="reportes-resenas"
        className="mt-8 rounded-3xl border border-red-100 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-red-600">
              Reportes de reseñas
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-950">
              Reseñas reportadas por usuarios
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Estos reportes no ocultan nada automáticamente. Revisa el caso
              y decide si la reseña se mantiene visible o se oculta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-red-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                Pendientes
              </p>
              <p className="mt-1 text-3xl font-black text-red-900">
                {activeReviewReports.length}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-600">
                Historial
              </p>
              <p className="mt-1 text-3xl font-black text-gray-950">
                {closedReviewReports.length}
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
                Total
              </p>
              <p className="mt-1 text-3xl font-black text-orange-900">
                {reviewReports.length}
              </p>
            </div>
          </div>
        </div>

        {reviewReportsError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            No pudimos cargar los reportes de reseñas.
          </div>
        ) : null}

        {!reviewReportsError && reviewReports.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            Todavía no hay reportes de reseñas.
          </div>
        ) : null}

        {!reviewReportsError && reviewReports.length > 0 ? (
          <div className="mt-6 space-y-4">
            {reviewReports.map((report) => {
              const business = getSingleRelation(report.business);
              const review = getSingleRelation(report.review);
              const businessSlug = business?.slug ?? null;
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
                        {business?.name ?? "Negocio sin dato"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Reportado el {formatDate(report.created_at)}
                      </p>

                      <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {report.description}
                      </p>
                    </div>

                    {businessSlug ? (
                      <Link
                        href={`/negocio/${businessSlug}`}
                        className="w-fit rounded-full bg-gray-950 px-4 py-2 text-sm font-black text-white transition hover:bg-gray-800"
                      >
                        Ver negocio
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                        Reseña reportada
                      </p>

                      <p className="mt-3 text-sm font-bold text-gray-900">
                        Calificación:{" "}
                        {review?.rating ? `${review.rating}/5` : "Sin calificación"}
                      </p>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {review?.comment?.trim()
                          ? review.comment
                          : "La reseña no tiene comentario escrito."}
                      </p>

                      <p className="mt-3 text-xs text-gray-500">
                        Estado actual: {review?.status ?? "Sin dato"}
                      </p>

                      {review?.hidden_reason ? (
                        <p className="mt-2 text-xs text-red-700">
                          Motivo ocultamiento: {review.hidden_reason}
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
                        Autor de la reseña:{" "}
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
                            <form action={markReviewReportInReview}>
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

                          <form action={resolveReviewReport}>
                            <input
                              type="hidden"
                              name="reportId"
                              value={report.id}
                            />
                            <input
                              type="hidden"
                              name="adminNotes"
                              value="Reporte revisado sin ocultar la reseña."
                            />
                            <button
                              type="submit"
                              className="rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white transition hover:bg-green-700"
                            >
                              Resolver sin ocultar
                            </button>
                          </form>

                          <form action={rejectReviewReport}>
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

                          <form action={closeReviewReport}>
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

                    {isActiveReport && report.review_id ? (
                      <form
                        action={hideReportedReview}
                        className="rounded-2xl border border-red-200 bg-red-50 p-4"
                      >
                        <input
                          type="hidden"
                          name="reportId"
                          value={report.id}
                        />
                        <input
                          type="hidden"
                          name="reviewId"
                          value={report.review_id}
                        />
                        <input
                          type="hidden"
                          name="businessSlug"
                          value={businessSlug ?? ""}
                        />

                        <label className="block">
                          <span className="text-sm font-black text-red-900">
                            Ocultar reseña
                          </span>

                          <textarea
                            name="hiddenReason"
                            rows={3}
                            minLength={10}
                            required
                            placeholder="Explica por qué se ocultará esta reseña."
                            className="mt-2 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                          />
                        </label>

                        <button
                          type="submit"
                          className="mt-3 rounded-full bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800"
                        >
                          Ocultar reseña y resolver reporte
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
