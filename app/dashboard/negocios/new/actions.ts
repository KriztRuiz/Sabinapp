"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireCompleteProfile } from "@/lib/profiles/require-complete-profile";

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

  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para registrar negocios.",
  );

  const { data: canCreateBusiness } = await supabase.rpc("has_permission", {
    permission_key: "business.create",
  });

  if (!canCreateBusiness) {
    redirectWithError("Tu usuario no tiene permiso para crear negocios.");
  }

  const name = getFormText(formData, "name");
  const slugInput = getFormText(formData, "slug");
  const creationRequestId = getFormText(formData, "creationRequestId");
  const businessTypeId = getFormText(formData, "businessTypeId");
  const categoryId = getFormText(formData, "categoryId");
  const shortDescription = getFormText(formData, "shortDescription");
  const longDescription = getFormText(formData, "longDescription");
  const startsAtRaw = getFormText(formData, "startsAt");
  const endsAtRaw = getFormText(formData, "endsAt");
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

  if (!categoryId) {
    redirectWithError("Selecciona una categoría.");
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(creationRequestId)) {
    redirectWithError("La solicitud de registro no es valida. Recarga el formulario e intenta de nuevo.");
  }

  const slug = normalizeSlug(slugInput || name);

  if (!slug || slug.length < 3) {
    redirectWithError("El enlace público debe tener al menos 3 caracteres válidos.");
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    redirectWithError(
      "El enlace público sólo puede usar minúsculas, números y guiones intermedios.",
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

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, business_type_id")
    .eq("id", categoryId)
    .eq("business_type_id", businessType.id)
    .eq("is_active", true)
    .single();

  if (categoryError || !category) {
    redirectWithError(
      "La categoría seleccionada no corresponde al tipo de negocio.",
    );
  }

  const startsAt = businessType.requires_start_end_dates
    ? getDateIso(startsAtRaw)
    : null;
  const endsAt = businessType.requires_start_end_dates
    ? getDateIso(endsAtRaw, true)
    : null;

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
      creation_request_id: creationRequestId,
      business_type_id: businessType.id,
      category_id: category.id,
      name,
      slug,
      short_description: shortDescription,
      long_description: longDescription || null,
      status: "draft",
      is_published: false,
      is_adult_content: Boolean(businessType.is_adult_related),
      requires_age_verification: Boolean(businessType.is_adult_related),
      show_in_home: !businessType.is_adult_related,
      show_in_search: !businessType.is_adult_related,
      owner_confirmed_authorization: false,
      starts_at: startsAt,
      ends_at: endsAt,
      expires_at: endsAt,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !createdBusiness) {
    if (error?.code === "23505") {
      // Distinguir un reintento del mismo propietario de un slug ocupado.
      const { data: previous, error: lookupError } = await supabase
        .from("businesses")
        .select("id, status, name, slug, business_type_id, category_id, short_description, long_description, starts_at, ends_at")
        .eq("owner_id", user.id)
        .eq("creation_request_id", creationRequestId)
        .maybeSingle();

      if (!lookupError && previous) {
        const sameDate = (stored: string | null, submitted: string | null) =>
          stored === submitted ||
          (stored !== null && submitted !== null &&
            new Date(stored).getTime() === new Date(submitted).getTime());

        const samePayload =
          previous.name === name &&
          previous.slug === slug &&
          previous.business_type_id === businessType.id &&
          previous.category_id === category.id &&
          previous.short_description === shortDescription &&
          previous.long_description === (longDescription || null) &&
          sameDate(previous.starts_at, startsAt) &&
          sameDate(previous.ends_at, endsAt);

        if (!samePayload) {
          redirectWithError("Esta solicitud ya fue utilizada con otros datos. Abre un formulario nuevo.");
        }

        if (previous.status !== "draft") {
          redirectWithError("Esta solicitud ya fue procesada. Revisa el negocio desde tu panel.");
        }

        revalidatePath("/dashboard/negocios");
        redirect(
          `/dashboard/negocios/${previous.id}/edit?message=${encodeURIComponent(
            "El negocio ya estaba registrado. Se abrió el borrador existente.",
          )}`,
        );
      }

      redirectWithError(
        "Ese enlace público ya está ocupado. Usa otro identificador para el negocio.",
      );
    }

    redirectWithError("No se pudo crear el negocio. Revisa los datos.");
  }

  // La configuración inicial se crea automáticamente mediante
  // el trigger on_business_created_create_defaults de PostgreSQL.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/negocios");

  redirect(
    `/dashboard/negocios/${createdBusiness.id}/edit?message=${encodeURIComponent(
      "Negocio creado como borrador. Completa la información antes de enviarlo a revisión.",
    )}`,
  );
}
