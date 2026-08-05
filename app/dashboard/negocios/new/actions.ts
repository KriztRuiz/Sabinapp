"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getFormText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getDateIso(value: string, endOfDay = false) {
  if (!value) {
    return null;
  }

  const time = endOfDay ? "23:59:59" : "00:00:00";
  const date = new Date(`${value}T${time}`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function redirectWithError(message: string): never {
  redirect(`/dashboard/negocios/new?error=${encodeURIComponent(message)}`);
}

export async function createBusinessFromDashboard(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para crear un negocio.");
  }

  const { data: canCreateBusiness } = await supabase.rpc("has_permission", {
    permission_key: "business.create",
  });

  if (!canCreateBusiness) {
    redirectWithError("Tu usuario no tiene permiso para crear negocios.");
  }

  const name = getFormText(formData, "name");
  const slugInput = getFormText(formData, "slug");
  const businessTypeId = getFormText(formData, "businessTypeId");
  const shortDescription = getFormText(formData, "shortDescription");
  const longDescription = getFormText(formData, "longDescription");
  const startsAtRaw = getFormText(formData, "startsAt");
  const endsAtRaw = getFormText(formData, "endsAt");
  const confirmedAuthorization =
    String(formData.get("ownerConfirmedAuthorization") ?? "") === "on";

  if (name.length < 2 || name.length > 120) {
    redirectWithError("El nombre debe tener entre 2 y 120 caracteres.");
  }

  if (shortDescription.length < 10 || shortDescription.length > 240) {
    redirectWithError(
      "La descripción corta debe tener entre 10 y 240 caracteres.",
    );
  }

  if (!businessTypeId) {
    redirectWithError("Selecciona un tipo de negocio.");
  }

  if (!confirmedAuthorization) {
    redirectWithError(
      "Debes confirmar que tienes autorización para administrar este negocio.",
    );
  }

  const slug = normalizeSlug(slugInput || name);

  if (!slug || slug.length < 3) {
    redirectWithError("El slug debe tener al menos 3 caracteres válidos.");
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    redirectWithError(
      "El slug solo puede usar minúsculas, números y guiones intermedios.",
    );
  }

  const { data: businessType, error: businessTypeError } = await supabase
    .from("business_types")
    .select("id, requires_start_end_dates, is_adult_related")
    .eq("id", businessTypeId)
    .eq("is_active", true)
    .single();

  if (businessTypeError || !businessType) {
    redirectWithError("El tipo de negocio seleccionado no es válido.");
  }

  const startsAt = getDateIso(startsAtRaw);
  const endsAt = getDateIso(endsAtRaw, true);

  if (businessType.requires_start_end_dates && (!startsAt || !endsAt)) {
    redirectWithError(
      "Este tipo de negocio requiere fecha de inicio y fecha de finalización.",
    );
  }

  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    redirectWithError("La fecha final no puede ser anterior a la fecha inicial.");
  }

  const now = new Date().toISOString();

  const { data: createdBusiness, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      business_type_id: businessType.id,
      category_id: null,
      name,
      slug,
      short_description: shortDescription,
      long_description: longDescription || null,
      status: "draft",
      is_published: false,
      is_adult_content: Boolean(businessType.is_adult_related),
      requires_age_verification: Boolean(businessType.is_adult_related),
      show_in_home: true,
      show_in_search: true,
      owner_confirmed_authorization: true,
      starts_at: startsAt,
      ends_at: endsAt,
      expires_at: endsAt,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !createdBusiness) {
    if (error?.code === "23505") {
      redirectWithError(
        "Ese slug ya está ocupado. Usa otro identificador para el negocio.",
      );
    }

    redirectWithError("No se pudo crear el negocio. Revisa los datos.");
  }

  await supabase.from("business_settings").insert({
    business_id: createdBusiness.id,
    visual_mode: "classic",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/negocios");

  redirect(
    `/dashboard/negocios/${createdBusiness.id}/edit?message=${encodeURIComponent(
      "Negocio creado como borrador. Completa la información antes de enviarlo a revisión.",
    )}`,
  );
}
