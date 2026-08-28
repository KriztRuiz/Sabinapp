"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCompleteProfile } from "@/lib/profiles/require-complete-profile";

const REPORT_REASONS = [
  "incorrect_information",
  "suspicious_content",
  "inappropriate_content",
  "technical_problem",
  "other",
] as const;

type ReportReason = (typeof REPORT_REASONS)[number];

function buildReportRedirect(
  slug: string,
  type: "reviewMessage" | "reviewError",
  message: string,
) {
  return `/negocio/${slug}?${type}=${encodeURIComponent(message)}#opiniones`;
}

function normalizeReason(value: FormDataEntryValue | null): ReportReason | null {
  const reason = String(value ?? "").trim();

  if (REPORT_REASONS.includes(reason as ReportReason)) {
    return reason as ReportReason;
  }

  return null;
}

function normalizeDescription(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function reportBusinessReview(
  businessId: string,
  slug: string,
  reviewId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/login?message=${encodeURIComponent(
        "Inicia sesión para reportar una reseña.",
      )}`,
    );
  }

  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para reportar reseñas.",
  );

  const reason = normalizeReason(formData.get("reason"));
  const description = normalizeDescription(formData.get("description"));

  if (!reason) {
    redirect(
      buildReportRedirect(
        slug,
        "reviewError",
        "Selecciona un motivo válido para el reporte.",
      ),
    );
  }

  if (description.length < 10 || description.length > 1000) {
    redirect(
      buildReportRedirect(
        slug,
        "reviewError",
        "Describe el problema con al menos 10 caracteres y máximo 1000.",
      ),
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!profile) {
    redirect(
      buildReportRedirect(
        slug,
        "reviewError",
        "Tu cuenta no puede reportar reseñas en este momento.",
      ),
    );
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("id, business_id, user_id, status")
    .eq("id", reviewId)
    .eq("business_id", businessId)
    .eq("status", "published")
    .maybeSingle();

  if (!review) {
    redirect(
      buildReportRedirect(
        slug,
        "reviewError",
        "No encontramos la reseña que quieres reportar.",
      ),
    );
  }

  if (review.user_id === user.id) {
    redirect(
      buildReportRedirect(
        slug,
        "reviewError",
        "No puedes reportar tu propia reseña.",
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
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .maybeSingle();

  if (!business) {
    redirect(
      buildReportRedirect(
        slug,
        "reviewError",
        "Este negocio no está disponible en este momento.",
      ),
    );
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: "review",
    business_id: businessId,
    review_id: reviewId,
    reported_user_id: review.user_id,
    reason,
    title: "Reporte de reseña",
    description,
    status: "new",
  });

  if (error) {
    redirect(
      buildReportRedirect(
        slug,
        "reviewError",
        "No pudimos registrar el reporte. Intenta de nuevo.",
      ),
    );
  }

  revalidatePath(`/negocio/${slug}`);

  redirect(
    buildReportRedirect(
      slug,
      "reviewMessage",
      "Reporte enviado. Un administrador lo revisará.",
    ),
  );
}

function buildNewsReportRedirect(
  newsId: string,
  type: "commentMessage" | "commentError",
  message: string,
) {
  return `/noticias?${type}=${encodeURIComponent(message)}#noticia-${newsId}`;
}

export async function reportNewsComment(
  newsId: string,
  commentId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/login?message=${encodeURIComponent(
        "Inicia sesión para reportar un comentario.",
      )}`,
    );
  }

  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para reportar comentarios.",
  );

  const reason = normalizeReason(formData.get("reason"));
  const description = normalizeDescription(formData.get("description"));

  if (!reason) {
    redirect(
      buildNewsReportRedirect(
        newsId,
        "commentError",
        "Selecciona un motivo válido para el reporte.",
      ),
    );
  }

  if (description.length < 10 || description.length > 1000) {
    redirect(
      buildNewsReportRedirect(
        newsId,
        "commentError",
        "Describe el problema con al menos 10 caracteres y máximo 1000.",
      ),
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!profile) {
    redirect(
      buildNewsReportRedirect(
        newsId,
        "commentError",
        "Tu cuenta no puede reportar comentarios en este momento.",
      ),
    );
  }

  const { data: comment } = await supabase
    .from("news_comments")
    .select("id, news_id, user_id, status")
    .eq("id", commentId)
    .eq("news_id", newsId)
    .eq("status", "published")
    .maybeSingle();

  if (!comment) {
    redirect(
      buildNewsReportRedirect(
        newsId,
        "commentError",
        "No encontramos el comentario que quieres reportar.",
      ),
    );
  }

  if (comment.user_id === user.id) {
    redirect(
      buildNewsReportRedirect(
        newsId,
        "commentError",
        "No puedes reportar tu propio comentario.",
      ),
    );
  }

  const now = new Date().toISOString();

  const { data: news } = await supabase
    .from("local_news")
    .select("id")
    .eq("id", newsId)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .maybeSingle();

  if (!news) {
    redirect(
      buildNewsReportRedirect(
        newsId,
        "commentError",
        "Esta noticia no está disponible en este momento.",
      ),
    );
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: "news_comment",
    news_comment_id: commentId,
    reported_user_id: comment.user_id,
    reason,
    title: "Reporte de comentario en noticia",
    description,
    status: "new",
  });

  if (error) {
    redirect(
      buildNewsReportRedirect(
        newsId,
        "commentError",
        "No pudimos registrar el reporte. Intenta de nuevo.",
      ),
    );
  }

  revalidatePath("/noticias");

  redirect(
    buildNewsReportRedirect(
      newsId,
      "commentMessage",
      "Reporte enviado. Un administrador lo revisará.",
    ),
  );
}
