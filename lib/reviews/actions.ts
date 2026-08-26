"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const REVIEW_WAIT_HOURS = 8;
const REVIEW_WAIT_MS = REVIEW_WAIT_HOURS * 60 * 60 * 1000;

function buildReviewRedirect(
  slug: string,
  type: "reviewMessage" | "reviewError",
  message: string,
) {
  return `/negocio/${slug}?${type}=${encodeURIComponent(message)}#opiniones`;
}

function normalizeComment(value: FormDataEntryValue | null) {
  const comment = String(value ?? "").trim();

  return comment.length > 0 ? comment : null;
}

function normalizeRating(value: FormDataEntryValue | null) {
  const rawRating = String(value ?? "").trim();

  if (!rawRating) {
    return null;
  }

  const rating = Number(rawRating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return undefined;
  }

  return rating;
}

function normalizeId(value: FormDataEntryValue | null) {
  const id = String(value ?? "").trim();

  return id.length > 0 ? id : null;
}

function getWaitMessage(updatedAt: string) {
  const nextAllowedAt = new Date(updatedAt).getTime() + REVIEW_WAIT_MS;
  const remainingMs = nextAllowedAt - Date.now();

  if (remainingMs <= 0) {
    return null;
  }

  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `Podrás volver a comentar o modificar tu reseña en ${hours} h ${minutes} min.`;
  }

  if (hours > 0) {
    return `Podrás volver a comentar o modificar tu reseña en ${hours} h.`;
  }

  return `Podrás volver a comentar o modificar tu reseña en ${minutes} min.`;
}

async function getLatestOwnReview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("reviews")
    .select("id, updated_at")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function submitBusinessReview(
  businessId: string,
  slug: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/login?message=${encodeURIComponent(
        "Inicia sesión para comentar o calificar.",
      )}`,
    );
  }

  const reviewId = normalizeId(formData.get("reviewId"));
  const rating = normalizeRating(formData.get("rating"));
  const comment = normalizeComment(formData.get("comment"));

  if (rating === undefined) {
    redirect(
      buildReviewRedirect(
        slug,
        "reviewError",
        "Selecciona una calificación válida.",
      ),
    );
  }

  if (rating === null && !comment) {
    redirect(
      buildReviewRedirect(
        slug,
        "reviewError",
        "Agrega una calificación, un comentario o ambas cosas.",
      ),
    );
  }

  if (comment && (comment.length < 3 || comment.length > 1000)) {
    redirect(
      buildReviewRedirect(
        slug,
        "reviewError",
        "El comentario debe tener entre 3 y 1000 caracteres.",
      ),
    );
  }

  const now = new Date().toISOString();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_published", true)
    .eq("is_adult_content", false)
    .eq("show_reviews_publicly", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .maybeSingle();

  if (!business) {
    redirect(
      buildReviewRedirect(
        slug,
        "reviewError",
        "Este negocio no está disponible para reseñas en este momento.",
      ),
    );
  }

  if (reviewId) {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id, updated_at")
      .eq("id", reviewId)
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("status", "published")
      .maybeSingle();

    if (!existingReview) {
      redirect(
        buildReviewRedirect(
          slug,
          "reviewError",
          "No encontramos esa reseña para modificar.",
        ),
      );
    }

    const waitMessage = getWaitMessage(existingReview.updated_at);

    if (waitMessage) {
      redirect(buildReviewRedirect(slug, "reviewError", waitMessage));
    }

    const { error } = await supabase
      .from("reviews")
      .update({
        rating,
        comment,
        updated_at: now,
      })
      .eq("id", reviewId)
      .eq("business_id", businessId)
      .eq("user_id", user.id);

    if (error) {
      redirect(
        buildReviewRedirect(
          slug,
          "reviewError",
          "No pudimos modificar tu reseña. Intenta de nuevo.",
        ),
      );
    }

    revalidatePath(`/negocio/${slug}`);

    redirect(
      buildReviewRedirect(
        slug,
        "reviewMessage",
        "Tu reseña se modificó correctamente.",
      ),
    );
  }

  const latestReview = await getLatestOwnReview(supabase, businessId, user.id);

  if (latestReview) {
    const waitMessage = getWaitMessage(latestReview.updated_at);

    if (waitMessage) {
      redirect(buildReviewRedirect(slug, "reviewError", waitMessage));
    }
  }

  const { error } = await supabase.from("reviews").insert({
    business_id: businessId,
    user_id: user.id,
    rating,
    comment,
    status: "published",
    updated_at: now,
  });

  if (error) {
    redirect(
      buildReviewRedirect(
        slug,
        "reviewError",
        "No pudimos guardar tu reseña. Intenta de nuevo.",
      ),
    );
  }

  revalidatePath(`/negocio/${slug}`);

  redirect(
    buildReviewRedirect(
      slug,
      "reviewMessage",
      "Tu reseña se guardó correctamente.",
    ),
  );
}
