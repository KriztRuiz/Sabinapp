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
    .select("id, slug")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
    );
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "approved",
      is_published: false,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
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
    .select("id, slug")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
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
    .select("id, slug")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    redirect(
      "/dashboard/admin/negocios?error=No%20se%20encontro%20el%20negocio",
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
      updated_at: now,
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
