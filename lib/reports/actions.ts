"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
