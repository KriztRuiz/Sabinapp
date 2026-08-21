"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdminReviewPermission() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: canReview } = await supabase.rpc("has_permission", {
    permission_key: "admin.review_businesses",
  });

  if (!canReview) {
    redirect("/dashboard");
  }

  return { supabase, user };
}

function getBusinessId(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "").trim();

  if (!businessId) {
    throw new Error("No se recibió el negocio.");
  }

  return businessId;
}

function revalidateBusinessPaths(slug: string | null) {
  revalidatePath("/dashboard/admin/negocios");
  revalidatePath("/");
  revalidatePath("/negocios");
  revalidatePath("/productos");

  if (slug) {
    revalidatePath(`/negocio/${slug}`);
  }
}

export async function approveBusinessForReview(formData: FormData) {
  const { supabase, user } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, status, expires_at")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  if (business.status !== "pending_review") {
    redirect(
      "/dashboard/admin/negocios?error=Solo%20se%20pueden%20aprobar%20negocios%20pendientes%20de%20revision",
    );
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "approved",
      is_published: false,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      owner_confirmed_authorization: true,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      hidden_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20aprobar%20el%20negocio",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect("/dashboard/admin/negocios?message=Negocio%20aprobado");
}

export async function rejectBusinessForReview(formData: FormData) {
  const { supabase, user } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (rejectionReason.length < 10) {
    redirect(
      "/dashboard/admin/negocios?error=El%20motivo%20de%20rechazo%20debe%20tener%20al%20menos%2010%20caracteres",
    );
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, status")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  const rejectableStatuses = ["pending_review", "approved"];

  if (!rejectableStatuses.includes(String(business.status))) {
    redirect(
      "/dashboard/admin/negocios?error=Solo%20se%20pueden%20rechazar%20negocios%20en%20revision%20o%20aprobados",
    );
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "rejected",
      is_published: false,
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      rejection_reason: rejectionReason,
      approved_at: null,
      approved_by: null,
      published_at: null,
      hidden_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20rechazar%20el%20negocio",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect("/dashboard/admin/negocios?message=Negocio%20rechazado");
}

export async function hideBusinessFromPublic(formData: FormData) {
  const { supabase, user } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, status")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  if (business.status !== "published") {
    redirect(
      "/dashboard/admin/negocios?error=Solo%20se%20pueden%20ocultar%20negocios%20publicados",
    );
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "hidden",
      is_published: false,
      hidden_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      approved_by: user.id,
    })
    .eq("id", businessId);

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20ocultar%20el%20negocio",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect("/dashboard/admin/negocios?message=Negocio%20ocultado");
}

export async function publishApprovedBusiness(formData: FormData) {
  const { supabase, user } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, status, approved_at, approved_by")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  if (business.status !== "approved") {
    redirect(
      "/dashboard/admin/negocios?error=Solo%20se%20pueden%20publicar%20negocios%20aprobados",
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "published",
      is_published: true,
      show_in_search: true,
      show_in_home: true,
      published_at: now,
      approved_at: business.approved_at ?? now,
      approved_by: business.approved_by ?? user.id,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      hidden_at: null,
    })
    .eq("id", businessId);

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20publicar%20el%20negocio",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect("/dashboard/admin/negocios?message=Negocio%20publicado");
}

export async function extendBusinessExpiration(formData: FormData) {
  const { supabase } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);
  const daysValue = Number(formData.get("days") ?? 30);
  const allowedDays = [30, 90, 180, 365];

  const days = allowedDays.includes(daysValue) ? daysValue : 30;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, starts_at")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + days);

  const { error } = await supabase
    .from("businesses")
    .update({
      starts_at: business.starts_at ?? now.toISOString(),
      ends_at: expiresAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20extender%20la%20vigencia",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect("/dashboard/admin/negocios?message=Vigencia%20actualizada");
}

export async function restoreHiddenBusinessToPublic(formData: FormData) {
  const { supabase } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, status, expires_at")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  if (business.status !== "hidden") {
    redirect(
      "/dashboard/admin/negocios?error=Solo%20se%20pueden%20restaurar%20negocios%20ocultos",
    );
  }

  const isExpired = business.expires_at
    ? new Date(business.expires_at).getTime() < Date.now()
    : false;

  if (isExpired) {
    redirect(
      "/dashboard/admin/negocios?error=Extiende%20la%20vigencia%20antes%20de%20volver%20a%20mostrar%20este%20negocio",
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "published",
      is_published: true,
      show_in_search: true,
      show_in_home: true,
      hidden_at: null,
      published_at: now,
    })
    .eq("id", businessId);

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20volver%20a%20mostrar%20el%20negocio",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect("/dashboard/admin/negocios?message=Negocio%20visible%20nuevamente");
}

export async function archiveBusinessFromAdmin(formData: FormData) {
  const { supabase } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, status, expires_at")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  const archivableStatuses = ["hidden", "rejected", "expired"];
  const isPublishedExpired =
    business.status === "published" &&
    business.expires_at &&
    new Date(business.expires_at).getTime() < Date.now();

  if (
    !archivableStatuses.includes(String(business.status)) &&
    !isPublishedExpired
  ) {
    redirect(
      "/dashboard/admin/negocios?error=Solo%20se%20pueden%20archivar%20negocios%20ocultos%2C%20rechazados%20o%20vencidos",
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "archived",
      is_published: false,
      show_in_search: false,
      show_in_home: false,
      archived_at: now,
    })
    .eq("id", businessId);

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20archivar%20el%20negocio",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect("/dashboard/admin/negocios?message=Negocio%20archivado");
}

function getChangeEventId(formData: FormData) {
  const changeEventId = String(formData.get("changeEventId") ?? "").trim();

  if (!changeEventId) {
    throw new Error("No se recibió el cambio.");
  }

  return changeEventId;
}

export async function markBusinessChangeEventSeen(formData: FormData) {
  const { supabase, user } = await requireAdminReviewPermission();
  const changeEventId = getChangeEventId(formData);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("business_change_events")
    .update({
      review_status: "seen",
      seen_at: now,
      seen_by: user.id,
    })
    .eq("id", changeEventId)
    .eq("review_status", "unseen");

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20marcar%20el%20cambio%20como%20visto",
    );
  }

  revalidatePath("/dashboard/admin/negocios");

  redirect("/dashboard/admin/negocios?message=Cambio%20marcado%20como%20visto");
}

export async function markAllBusinessChangeEventsSeenForBusiness(
  formData: FormData,
) {
  const { supabase, user } = await requireAdminReviewPermission();
  const businessId = getBusinessId(formData);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("business_change_events")
    .update({
      review_status: "seen",
      seen_at: now,
      seen_by: user.id,
    })
    .eq("business_id", businessId)
    .eq("review_status", "unseen");

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudieron%20marcar%20los%20cambios%20como%20vistos",
    );
  }

  revalidatePath("/dashboard/admin/negocios");

  redirect(
    "/dashboard/admin/negocios?message=Cambios%20del%20negocio%20marcados%20como%20vistos",
  );
}

export async function sendBusinessChangeBackToReview(formData: FormData) {
  const { supabase, user } = await requireAdminReviewPermission();
  const changeEventId = getChangeEventId(formData);

  const { data: changeEvent, error: changeEventError } = await supabase
    .from("business_change_events")
    .select("id, business_id, business_slug_snapshot")
    .eq("id", changeEventId)
    .single();

  if (changeEventError || !changeEvent?.business_id) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20cambio%20o%20el%20negocio",
    );
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", changeEvent.business_id)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  const now = new Date().toISOString();

  const { error: businessUpdateError } = await supabase
    .from("businesses")
    .update({
      status: "pending_review",
      is_published: false,
      show_in_search: false,
      show_in_home: false,
      submitted_at: now,
      published_at: null,
      hidden_at: now,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
    })
    .eq("id", business.id);

  if (businessUpdateError) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudo%20mandar%20el%20negocio%20a%20revision",
    );
  }

  const { error: changeEventsUpdateError } = await supabase
    .from("business_change_events")
    .update({
      review_status: "sent_to_review",
      resolved_at: now,
      resolved_by: user.id,
      admin_note:
        "El negocio fue retirado del público y enviado nuevamente a revisión.",
    })
    .eq("business_id", business.id)
    .eq("review_status", "unseen");

  if (changeEventsUpdateError) {
    redirect(
      "/dashboard/admin/negocios?error=El%20negocio%20se%20mando%20a%20revision%2C%20pero%20no%20se%20pudieron%20actualizar%20los%20avisos",
    );
  }

  revalidateBusinessPaths(business.slug);

  redirect(
    "/dashboard/admin/negocios?message=Negocio%20retirado%20del%20publico%20y%20enviado%20a%20revision",
  );
}

export async function markAllBusinessChangeEventsSeen() {
  const { supabase, user } = await requireAdminReviewPermission();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("business_change_events")
    .update({
      review_status: "seen",
      seen_at: now,
      seen_by: user.id,
    })
    .eq("review_status", "unseen");

  if (error) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20pudieron%20marcar%20todos%20los%20cambios%20como%20vistos",
    );
  }

  revalidatePath("/dashboard/admin/negocios");

  redirect(
    "/dashboard/admin/negocios?message=Todos%20los%20cambios%20pendientes%20fueron%20marcados%20como%20vistos",
  );
}
