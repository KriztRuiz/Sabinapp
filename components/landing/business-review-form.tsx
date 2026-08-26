import Link from "next/link";
import { submitBusinessReview } from "@/lib/reviews/actions";
import type { PublicLandingData } from "@/lib/landing/styles/types";

type Review = NonNullable<PublicLandingData["reviews"]>[number];

type Props = {
  data: PublicLandingData;
  mode?: "create" | "edit";
  review?: Review;
};

export function BusinessReviewForm({ data, mode = "create", review }: Props) {
  const reviewForm = data.reviewForm;
  const saveReview = submitBusinessReview.bind(null, data.id, data.slug);
  const defaultRating = review?.rating ?? null;

  if (!reviewForm?.isEnabled) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        Las reseñas no están disponibles para este negocio en este momento.
      </div>
    );
  }

  if (!reviewForm.isAuthenticated) {
    return (
      <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <p className="font-bold text-gray-950">
          ¿Quieres comentar o calificar este negocio?
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Inicia sesión con tu cuenta de Sabinapp para participar.
        </p>
        <Link
          href="/auth/login?message=Inicia+sesi%C3%B3n+para+comentar+o+calificar."
          className="mt-4 inline-flex rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      action={saveReview}
      className="mt-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="reviewId" value={review?.id ?? ""} />

      <p className="font-bold text-gray-950">
        {mode === "edit" ? "Modificar esta reseña" : "Agregar una reseña"}
      </p>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        Puedes sólo calificar, sólo comentar o hacer ambas cosas. Después de
        guardar, deberás esperar 8 horas para volver a comentar o modificar en
        este negocio.
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-gray-800">
          Calificación opcional
        </legend>

        <div className="mt-3 flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300">
            <input
              type="radio"
              name="rating"
              value=""
              defaultChecked={defaultRating === null}
              className="mr-2"
            />
            Sin calificación
          </label>

          {[1, 2, 3, 4, 5].map((rating) => (
            <label
              key={rating}
              className="cursor-pointer rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300"
            >
              <input
                type="radio"
                name="rating"
                value={rating}
                defaultChecked={defaultRating === rating}
                className="mr-2"
              />
              {rating} ★
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-sm font-bold text-gray-800">
          Comentario opcional
        </span>
        <textarea
          name="comment"
          rows={4}
          minLength={3}
          maxLength={1000}
          defaultValue={review?.comment ?? ""}
          placeholder="Ejemplo: Buen servicio, precios claros y atención amable."
          className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />
      </label>

      <button
        type="submit"
        className="mt-5 rounded-full bg-orange-600 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-700"
      >
        {mode === "edit" ? "Guardar cambios" : "Publicar reseña"}
      </button>
    </form>
  );
}
