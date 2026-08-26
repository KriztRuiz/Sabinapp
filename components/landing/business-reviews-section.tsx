import { BusinessReviewForm } from "./business-review-form";
import { BusinessReviewReportForm } from "./business-review-report-form";
import type { PublicLandingData } from "@/lib/landing/styles/types";

type Props = {
  data: PublicLandingData;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Monterrey",
  }).format(new Date(value));
}

function formatRating(rating: number | null) {
  if (!rating) {
    return "Sin calificación";
  }

  return `${rating}/5`;
}

function getAverageRating(reviews: NonNullable<PublicLandingData["reviews"]>) {
  const ratings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => typeof rating === "number");

  if (ratings.length === 0) {
    return null;
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);

  return total / ratings.length;
}

function getStars(rating: number | null) {
  if (!rating) {
    return "Sin estrellas";
  }

  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function BusinessReviewsSection({ data }: Props) {
  const reviews = data.reviews ?? [];
  const currentUserId = data.reviewForm?.userId ?? null;
  const averageRating = getAverageRating(reviews);
  const reviewsWithComment = reviews.filter((review) => review.comment?.trim());
  const ownReviews = currentUserId
    ? reviews.filter((review) => review.userId === currentUserId)
    : [];

  return (
    <section id="opiniones" className="bg-white px-5 py-16 text-gray-950">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="rounded-[2rem] border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-700">
              Opiniones
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Reseñas de {data.name}
            </h2>

            {data.reviewNotice ? (
              <div
                className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
                  data.reviewNotice.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {data.reviewNotice.message}
              </div>
            ) : null}

            <BusinessReviewForm data={data} />

            {ownReviews.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-900">
                  Tus reseñas anteriores
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Puedes modificar una reseña tuya desde aquí. Esta opción está
                  guardada para no saturar la pantalla principal.
                </p>

                <div className="mt-4 space-y-3">
                  {ownReviews.map((review) => (
                    <details
                      key={review.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <summary className="cursor-pointer text-sm font-bold text-gray-900">
                        Modificar reseña del {formatDate(review.createdAt)}
                      </summary>

                      <BusinessReviewForm
                        data={data}
                        mode="edit"
                        review={review}
                      />
                    </details>
                  ))}
                </div>
              </div>
            ) : null}

            {reviews.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Calificación promedio</p>
                  <p className="mt-2 text-4xl font-black">
                    {averageRating ? averageRating.toFixed(1) : "—"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {averageRating
                      ? `Basado en ${reviews.length} reseña${
                          reviews.length === 1 ? "" : "s"
                        }`
                      : "Aún no hay calificaciones"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Participación</p>
                  <p className="mt-2 text-4xl font-black">{reviews.length}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {reviews.length === 1
                      ? "Usuario registrado participó"
                      : "Usuarios registrados participaron"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-gray-600">
                Este negocio todavía no tiene reseñas. Cuando los usuarios
                registrados participen, aparecerán aquí.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {reviewsWithComment.length > 0 ? (
              reviewsWithComment.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">Usuario de Sabinapp</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>

                    <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800">
                      {formatRating(review.rating)}
                    </div>
                  </div>

                  {review.rating ? (
                    <p className="mt-4 text-lg tracking-wide text-orange-500">
                      {getStars(review.rating)}
                    </p>
                  ) : null}

                  {review.comment ? (
                    <p className="mt-4 leading-7 text-gray-700">
                      {review.comment}
                    </p>
                  ) : null}

                  <BusinessReviewReportForm data={data} review={review} />
                </article>
              ))
            ) : reviews.length > 0 ? (
              <div className="rounded-[1.5rem] border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
                Ya hay calificaciones para este negocio, pero todavía no hay
                comentarios escritos.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
