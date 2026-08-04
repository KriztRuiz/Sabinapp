// app/dashboard/negocios/[businessId]/edit/actions.ts

"use server";

import {
  isBusinessItemType,
  isBusinessLocationType,
} from "./business-edit-types";
import { isLandingVisualMode } from "@/lib/landing/styles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateBusinessLanding(
  businessId: string,
  formData: FormData,
) {
  const name = getFormValue(formData, "name");
  const shortDescription = getFormValue(formData, "short_description");
  const longDescription = getFormValue(formData, "long_description");
  const visualMode = getFormValue(formData, "visual_mode");

  if (!name || !shortDescription) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        "Nombre y descripción corta son obligatorios.",
      )}`,
    );
  }

  if (shortDescription.length < 10) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        "La descripción corta debe tener al menos 10 caracteres.",
      )}`,
    );
  }

  if (!isLandingVisualMode(visualMode)) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        "Selecciona un estilo visual válido.",
      )}`,
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para guardar cambios.");
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirect(
      `/dashboard/negocios?message=${encodeURIComponent(
        "No se encontró el negocio o no tienes permiso.",
      )}`,
    );
  }

  const { data: updatedBusiness, error: updateBusinessError } = await supabase
    .from("businesses")
    .update({
      name,
      short_description: shortDescription,
      long_description: longDescription || null,
    })
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .select("id, name, short_description, long_description, slug")
    .single();

  if (updateBusinessError || !updatedBusiness) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        `No se pudo actualizar el contenido del negocio: ${
          updateBusinessError?.message ?? "sin filas actualizadas"
        }`,
      )}`,
    );
  }

  const { data: updatedSettings, error: upsertSettingsError } = await supabase
    .from("business_settings")
    .upsert(
      {
        business_id: businessId,
        visual_mode: visualMode,
      },
      {
        onConflict: "business_id",
      },
    )
    .select("business_id, visual_mode")
    .single();

  if (upsertSettingsError || !updatedSettings) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        `El contenido se guardó, pero no se pudo guardar el estilo visual: ${
          upsertSettingsError?.message ?? "sin configuración actualizada"
        }`,
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/negocios");
  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      "Cambios guardados correctamente.",
    )}`,
  );
}

function isValidMediaUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function validateRequiredMediaUrl(businessId: string, url: string) {
  if (!url) {
    redirectToEditBusiness(businessId, "La URL de la imagen es obligatoria.");
  }

  if (!isValidMediaUrl(url)) {
    redirectToEditBusiness(
      businessId,
      "La URL de la imagen debe iniciar con http:// o https://.",
    );
  }
}

function getBusinessMediaFormInput(businessId: string, formData: FormData) {
  const url = getFormValue(formData, "url");
  const altText = getFormValue(formData, "alt_text");

  validateRequiredMediaUrl(businessId, url);

  return {
    url,
    altText,
  };
}

function validateOptionalItemImageUrl(businessId: string, url: string) {
  if (!url) {
    return;
  }

  if (!isValidMediaUrl(url)) {
    redirectToEditBusiness(
      businessId,
      "La URL de imagen del item debe iniciar con http:// o https://.",
    );
  }
}

function validateOptionalLocationMapUrl(businessId: string, url: string) {
  if (!url) {
    return;
  }

  if (!isValidMediaUrl(url)) {
    redirectToEditBusiness(
      businessId,
      "La URL del mapa debe iniciar con http:// o https://.",
    );
  }
}

function validateBusinessItemInput(
  businessId: string,
  input: {
    type: string;
    name: string;
    imageUrl: string;
  },
) {
  if (!isBusinessItemType(input.type)) {
    redirectToEditBusiness(businessId, "Selecciona un tipo de item válido.");
  }

  if (!input.name) {
    redirectToEditBusiness(businessId, "El nombre del item es obligatorio.");
  }

  validateOptionalItemImageUrl(businessId, input.imageUrl);
}

function redirectToEditBusiness(businessId: string, message: string): never {
  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      message,
    )}`,
  );
}

function revalidateBusinessEditAndPublic(businessId: string, slug: string) {
  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${slug}`);
}

function parseOptionalNonNegativePrice(
  businessId: string,
  value: string,
): number | null {
  if (!value) {
    return null;
  }

  const numericPrice = Number(value);

  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    redirectToEditBusiness(
      businessId,
      "El precio debe ser un número válido mayor o igual a cero.",
    );
  }

  return numericPrice;
}

function parseNonNegativeIntegerOrZero(
  businessId: string,
  value: string,
): number {
  if (!value) {
    return 0;
  }

  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 0) {
    redirectToEditBusiness(
      businessId,
      "El orden debe ser un número entero mayor o igual a cero.",
    );
  }

  return numericValue;
}

function parseDayOfWeek(businessId: string, value: string) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > 6) {
    redirectToEditBusiness(
      businessId,
      "Selecciona un día de la semana válido.",
    );
  }

  return parsedValue;
}

function parsePositiveIntegerOrOne(businessId: string, value: string) {
  if (!value) {
    return 1;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    redirectToEditBusiness(
      businessId,
      "El periodo debe ser un número entero mayor o igual a uno.",
    );
  }

  return parsedValue;
}

function normalizeBusinessHourTime(
  businessId: string,
  value: string,
  fieldLabel: string,
) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.length === 5 ? `${value}:00` : value;
  const isValidTime = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(
    normalizedValue,
  );

  if (!isValidTime) {
    redirectToEditBusiness(
      businessId,
      `${fieldLabel} debe tener formato HH:MM, por ejemplo 08:00.`,
    );
  }

  return normalizedValue;
}

function getNextSortOrder(rows: { sort_order?: number | null }[]) {
  const maxSortOrder = rows.reduce(
    (currentMax, row) => Math.max(currentMax, row.sort_order ?? 0),
    0,
  );

  return maxSortOrder + 1;
}

async function unsetOtherPrimaryContacts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  currentContactId?: string,
) {
  let query = supabase
    .from("contact_methods")
    .update({
      is_primary: false,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("business_id", businessId);

  if (currentContactId) {
    query = query.neq("id", currentContactId);
  }

  const { error } = await query;

  if (error) {
    redirectToEditBusiness(
      businessId,
      `No se pudieron actualizar los contactos principales: ${error.message}`,
    );
  }
}

async function unsetOtherPrimaryLocations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  currentLocationId?: string,
) {
  let query = supabase
    .from("business_locations")
    .update({
      is_primary: false,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("business_id", businessId);

  if (currentLocationId) {
    query = query.neq("id", currentLocationId);
  }

  const { error } = await query;

  if (error) {
    redirectToEditBusiness(
      businessId,
      `No se pudieron actualizar las ubicaciones principales: ${error.message}`,
    );
  }
}

function getNowIsoTimestamp() {
  return new Date().toISOString();
}

async function getOwnedBusinessContextOrRedirect(
  businessId: string,
  loginMessage: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?message=${encodeURIComponent(loginMessage)}`);
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (businessError || !business) {
    redirectToEditBusiness(
      businessId,
      "No se encontró el negocio o no tienes permiso.",
    );
  }

  return {
    supabase,
    business,
  };
}

export async function addBusinessLocation(
  businessId: string,
  formData: FormData,
) {
  const locationType = getFormValue(formData, "location_type");
  const addressText = getFormValue(formData, "address_text");
  const neighborhood = getFormValue(formData, "neighborhood");
  const referenceNotes = getFormValue(formData, "reference_notes");
  const serviceAreaText = getFormValue(formData, "service_area_text");
  const mapUrl = getFormValue(formData, "map_url");
  const isPrimary = formData.get("is_primary") === "on";
  const isPublic = formData.get("is_public") === "on";

  if (!isBusinessLocationType(locationType)) {
    redirectToEditBusiness(
      businessId,
      "Selecciona un tipo de ubicación válido.",
    );
  }

  validateOptionalLocationMapUrl(businessId, mapUrl);

  if (
    isPublic &&
    !addressText &&
    !serviceAreaText &&
    !referenceNotes &&
    !mapUrl
  ) {
    redirectToEditBusiness(
      businessId,
      "Una ubicación pública debe tener dirección, área de servicio, referencia o enlace de mapa.",
    );
  }

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para agregar ubicaciones.",
  );

  const { data: existingLocations, error: existingLocationsError } =
    await supabase
      .from("business_locations")
      .select("id")
      .eq("business_id", businessId);

  if (existingLocationsError) {
    redirectToEditBusiness(
      businessId,
      `No se pudieron revisar las ubicaciones actuales: ${existingLocationsError.message}`,
    );
  }

  const shouldBePrimary = isPrimary || (existingLocations?.length ?? 0) === 0;

  if (shouldBePrimary) {
    await unsetOtherPrimaryLocations(supabase, businessId);
  }

  const { data: insertedLocation, error: insertLocationError } = await supabase
    .from("business_locations")
    .insert({
      business_id: businessId,
      location_type: locationType,
      address_text: addressText || null,
      neighborhood: neighborhood || null,
      reference_notes: referenceNotes || null,
      service_area_text: serviceAreaText || null,
      map_url: mapUrl || null,
      is_primary: shouldBePrimary,
      is_public: isPublic,
      updated_at: getNowIsoTimestamp(),
    })
    .select("id")
    .single();

  if (insertLocationError || !insertedLocation) {
    redirectToEditBusiness(
      businessId,
      `No se pudo agregar la ubicación: ${
        insertLocationError?.message ?? "sin filas insertadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Ubicación agregada correctamente.");
}

export async function deleteBusinessLocation(
  businessId: string,
  locationId: string,
) {
  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar ubicaciones.",
  );

  const { data: deletedLocation, error: deleteLocationError } = await supabase
    .from("business_locations")
    .delete()
    .eq("id", locationId)
    .eq("business_id", businessId)
    .select("id, is_primary")
    .single();

  if (deleteLocationError || !deletedLocation) {
    redirectToEditBusiness(
      businessId,
      `No se pudo eliminar la ubicación: ${
        deleteLocationError?.message ?? "sin filas eliminadas"
      }`,
    );
  }

  if (deletedLocation.is_primary) {
    const { data: remainingLocations, error: remainingLocationsError } =
      await supabase
        .from("business_locations")
        .select("id")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })
        .limit(1);

    if (remainingLocationsError) {
      redirectToEditBusiness(
        businessId,
        `La ubicación se eliminó, pero no se pudo revisar la nueva principal: ${remainingLocationsError.message}`,
      );
    }

    const nextPrimaryLocation = remainingLocations?.[0];

    if (nextPrimaryLocation) {
      const { error: promoteLocationError } = await supabase
        .from("business_locations")
        .update({
          is_primary: true,
          updated_at: getNowIsoTimestamp(),
        })
        .eq("id", nextPrimaryLocation.id)
        .eq("business_id", businessId);

      if (promoteLocationError) {
        redirectToEditBusiness(
          businessId,
          `La ubicación se eliminó, pero no se pudo asignar una nueva principal: ${promoteLocationError.message}`,
        );
      }
    }
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Ubicación eliminada correctamente.");
}

export async function updateBusinessLocationDetails(
  businessId: string,
  locationId: string,
  formData: FormData,
) {
  const addressText = getFormValue(formData, "address_text");
  const neighborhood = getFormValue(formData, "neighborhood");
  const referenceNotes = getFormValue(formData, "reference_notes");
  const serviceAreaText = getFormValue(formData, "service_area_text");
  const mapUrl = getFormValue(formData, "map_url");
  const isPrimary = formData.get("is_primary") === "on";
  const isPublic = formData.get("is_public") === "on";

  validateOptionalLocationMapUrl(businessId, mapUrl);

  if (
    isPublic &&
    !addressText &&
    !serviceAreaText &&
    !referenceNotes &&
    !mapUrl
  ) {
    redirectToEditBusiness(
      businessId,
      "Una ubicación pública debe tener dirección, área de servicio, referencia o enlace de mapa.",
    );
  }

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar ubicaciones.",
  );

  if (isPrimary) {
    await unsetOtherPrimaryLocations(supabase, businessId, locationId);
  }

  const { data: updatedLocation, error: updateLocationError } = await supabase
    .from("business_locations")
    .update({
      address_text: addressText || null,
      neighborhood: neighborhood || null,
      reference_notes: referenceNotes || null,
      service_area_text: serviceAreaText || null,
      map_url: mapUrl || null,
      is_primary: isPrimary,
      is_public: isPublic,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("id", locationId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateLocationError || !updatedLocation) {
    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar la ubicación: ${
        updateLocationError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Ubicación actualizada correctamente.");
}

export async function addBusinessHour(
  businessId: string,
  formData: FormData,
) {
  const dayOfWeekValue = getFormValue(formData, "day_of_week");
  const periodOrderValue = getFormValue(formData, "period_order");
  const opensAtValue = getFormValue(formData, "opens_at");
  const closesAtValue = getFormValue(formData, "closes_at");
  const notes = getFormValue(formData, "notes");
  const isClosed = formData.get("is_closed") === "on";

  const dayOfWeek = parseDayOfWeek(businessId, dayOfWeekValue);
  const periodOrder = parsePositiveIntegerOrOne(
    businessId,
    periodOrderValue,
  );

  const opensAt = isClosed
    ? null
    : normalizeBusinessHourTime(businessId, opensAtValue, "La hora de apertura");

  const closesAt = isClosed
    ? null
    : normalizeBusinessHourTime(businessId, closesAtValue, "La hora de cierre");

  if (!isClosed && (!opensAt || !closesAt)) {
    redirectToEditBusiness(
      businessId,
      "La hora de apertura y cierre son obligatorias cuando el día está abierto.",
    );
  }

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para agregar horarios.",
  );

  const { data: insertedHour, error: insertHourError } = await supabase
    .from("business_hours")
    .insert({
      business_id: businessId,
      day_of_week: dayOfWeek,
      period_order: periodOrder,
      opens_at: opensAt,
      closes_at: closesAt,
      is_closed: isClosed,
      notes: notes || null,
      updated_at: getNowIsoTimestamp(),
    })
    .select("id")
    .single();

  if (insertHourError || !insertedHour) {
    redirectToEditBusiness(
      businessId,
      `No se pudo agregar el horario: ${
        insertHourError?.message ?? "sin filas insertadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Horario agregado correctamente.");
}

export async function deleteBusinessHour(
  businessId: string,
  hourId: string,
) {
  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar horarios.",
  );

  const { data: deletedHour, error: deleteHourError } = await supabase
    .from("business_hours")
    .delete()
    .eq("id", hourId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (deleteHourError || !deletedHour) {
    redirectToEditBusiness(
      businessId,
      `No se pudo eliminar el horario: ${
        deleteHourError?.message ?? "sin filas eliminadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Horario eliminado correctamente.");
}

export async function updateBusinessHourDetails(
  businessId: string,
  hourId: string,
  formData: FormData,
) {
  const periodOrderValue = getFormValue(formData, "period_order");
  const opensAtValue = getFormValue(formData, "opens_at");
  const closesAtValue = getFormValue(formData, "closes_at");
  const notes = getFormValue(formData, "notes");
  const isClosed = formData.get("is_closed") === "on";

  const periodOrder = parsePositiveIntegerOrOne(
    businessId,
    periodOrderValue,
  );

  const opensAt = isClosed
    ? null
    : normalizeBusinessHourTime(businessId, opensAtValue, "La hora de apertura");

  const closesAt = isClosed
    ? null
    : normalizeBusinessHourTime(businessId, closesAtValue, "La hora de cierre");

  if (!isClosed && (!opensAt || !closesAt)) {
    redirectToEditBusiness(
      businessId,
      "La hora de apertura y cierre son obligatorias cuando el día está abierto.",
    );
  }

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar horarios.",
  );

  const { data: updatedHour, error: updateHourError } = await supabase
    .from("business_hours")
    .update({
      period_order: periodOrder,
      opens_at: opensAt,
      closes_at: closesAt,
      is_closed: isClosed,
      notes: notes || null,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("id", hourId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateHourError || !updatedHour) {
    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar el horario: ${
        updateHourError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Horario actualizado correctamente.");
}

export async function addBusinessContact(
  businessId: string,
  formData: FormData,
) {
  const type = getFormValue(formData, "type");
  const label = getFormValue(formData, "label");
  const value = getFormValue(formData, "value");
  const url = getFormValue(formData, "url");
  const isPrimary = formData.get("is_primary") === "on";
  const isActive = formData.get("is_active") === "on";

  if (!type) {
    redirectToEditBusiness(businessId, "El tipo de contacto es obligatorio.");
  }

  if (!label) {
    redirectToEditBusiness(businessId, "La etiqueta del contacto es obligatoria.");
  }

  if (!value) {
    redirectToEditBusiness(businessId, "El texto visible del contacto es obligatorio.");
  }

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para agregar contactos.",
  );

  const { data: existingContacts, error: existingContactsError } = await supabase
    .from("contact_methods")
    .select("sort_order")
    .eq("business_id", businessId);

  if (existingContactsError) {
    redirectToEditBusiness(
      businessId,
      `No se pudo calcular el orden del contacto: ${existingContactsError.message}`,
    );
  }

  const nextSortOrder = getNextSortOrder(existingContacts ?? []);

  if (isPrimary) {
    await unsetOtherPrimaryContacts(supabase, businessId);
  }

  const { data: insertedContact, error: insertContactError } = await supabase
    .from("contact_methods")
    .insert({
      business_id: businessId,
      type,
      label,
      value,
      url: url || null,
      is_primary: isPrimary,
      is_active: isActive,
      is_approved: true,
      sort_order: nextSortOrder,
      updated_at: getNowIsoTimestamp(),
    })
    .select("id")
    .single();

  if (insertContactError || !insertedContact) {
    redirectToEditBusiness(
      businessId,
      `No se pudo agregar el contacto: ${
        insertContactError?.message ?? "sin filas insertadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Contacto agregado correctamente.");
}

export async function deleteBusinessContact(
  businessId: string,
  contactId: string,
) {
  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar contactos.",
  );

  const { data: deletedContact, error: deleteContactError } = await supabase
    .from("contact_methods")
    .delete()
    .eq("id", contactId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (deleteContactError || !deletedContact) {
    redirectToEditBusiness(
      businessId,
      `No se pudo eliminar el contacto: ${
        deleteContactError?.message ?? "sin filas eliminadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Contacto eliminado correctamente.");
}

export async function updateBusinessContactDetails(
  businessId: string,
  contactId: string,
  formData: FormData,
) {
  const type = getFormValue(formData, "type");
  const label = getFormValue(formData, "label");
  const value = getFormValue(formData, "value");
  const url = getFormValue(formData, "url");
  const sortOrderValue = getFormValue(formData, "sort_order");
  const sortOrder = parseNonNegativeIntegerOrZero(businessId, sortOrderValue);
  const isPrimary = formData.get("is_primary") === "on";
  const isActive = formData.get("is_active") === "on";

  if (!type) {
    redirectToEditBusiness(businessId, "El tipo de contacto es obligatorio.");
  }

  if (!label) {
    redirectToEditBusiness(businessId, "La etiqueta del contacto es obligatoria.");
  }

  if (!value) {
    redirectToEditBusiness(businessId, "El valor del contacto es obligatorio.");
  }

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar contactos.",
  );

  if (isPrimary) {
    await unsetOtherPrimaryContacts(supabase, businessId, contactId);
  }

  const { data: updatedContact, error: updateContactError } = await supabase
    .from("contact_methods")
    .update({
      type,
      label,
      value,
      url: url || null,
      is_primary: isPrimary,
      is_active: isActive,
      sort_order: sortOrder,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("id", contactId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateContactError || !updatedContact) {
    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar el contacto: ${
        updateContactError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Contacto actualizado correctamente.");
}

export async function updateBusinessMediaDetails(
  businessId: string,
  mediaId: string,
  formData: FormData,
) {
  const { url, altText } = getBusinessMediaFormInput(businessId, formData);
  const sortOrderValue = getFormValue(formData, "sort_order");
  const sortOrder = parseNonNegativeIntegerOrZero(businessId, sortOrderValue);
  const isActive = formData.get("is_active") === "on";

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar imágenes.",
  );

  const { data: updatedMedia, error: updateMediaError } = await supabase
    .from("business_media")
    .update({
      url,
      alt_text: altText || null,
      is_active: isActive,
      sort_order: sortOrder,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateMediaError || !updatedMedia) {
    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar la imagen: ${
        updateMediaError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Imagen actualizada correctamente.");
}

export async function setBusinessMediaAsCover(
  businessId: string,
  mediaId: string,
) {
  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar imágenes.",
  );

  const { data: existingMedia, error: existingMediaError } = await supabase
    .from("business_media")
    .select("id")
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .single();

  if (existingMediaError || !existingMedia) {
    redirectToEditBusiness(
      businessId,
      "No se encontró la imagen seleccionada.",
    );
  }

  const { error: resetCoverError } = await supabase
    .from("business_media")
    .update({
      type: "gallery",
      is_cover: false,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("business_id", businessId)
    .neq("id", mediaId);

  if (resetCoverError) {
    redirectToEditBusiness(
      businessId,
      `No se pudo limpiar la portada anterior: ${resetCoverError.message}`,
    );
  }

  const { data: updatedCover, error: updateCoverError } = await supabase
    .from("business_media")
    .update({
      type: "cover",
      is_cover: true,
      is_active: true,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateCoverError || !updatedCover) {
    redirectToEditBusiness(
      businessId,
      `No se pudo cambiar la portada: ${
        updateCoverError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Portada actualizada correctamente.");
}

export async function deleteBusinessMedia(
  businessId: string,
  mediaId: string,
) {
  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar imágenes.",
  );

  const { data: deletedMedia, error: deleteMediaError } = await supabase
    .from("business_media")
    .delete()
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (deleteMediaError || !deletedMedia) {
    redirectToEditBusiness(
      businessId,
      `No se pudo eliminar la imagen: ${
        deleteMediaError?.message ?? "sin filas eliminadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Imagen eliminada correctamente.");
}

export async function addBusinessMedia(businessId: string, formData: FormData) {
  const { url, altText } = getBusinessMediaFormInput(businessId, formData);

  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para agregar imágenes.",
  );

  const { data: existingMedia, error: existingMediaError } = await supabase
    .from("business_media")
    .select("id, sort_order")
    .eq("business_id", businessId);

  if (existingMediaError) {
    redirectToEditBusiness(
      businessId,
      `No se pudieron revisar las imágenes actuales: ${existingMediaError.message}`,
    );
  }

  const mediaCount = existingMedia?.length ?? 0;

  const nextSortOrder = getNextSortOrder(existingMedia ?? []);

  const shouldBeCover = mediaCount === 0;

  const { data: createdMedia, error: insertMediaError } = await supabase
    .from("business_media")
    .insert({
      business_id: businessId,
      type: shouldBeCover ? "cover" : "gallery",
      url,
      alt_text: altText || null,
      is_active: true,
      is_cover: shouldBeCover,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertMediaError || !createdMedia) {
    redirectToEditBusiness(
      businessId,
      `No se pudo agregar la imagen: ${
        insertMediaError?.message ?? "sin imagen creada"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Imagen agregada correctamente.");
}

export async function updateBusinessItemDetails(
  businessId: string,
  itemId: string,
  formData: FormData,
) {
  const type = getFormValue(formData, "type");
  const name = getFormValue(formData, "name");
  const description = getFormValue(formData, "description");
  const priceValue = getFormValue(formData, "price").replace(",", ".");
  const currency = getFormValue(formData, "currency") || "MXN";
  const imageUrl = getFormValue(formData, "image_url");
  const imageAlt = getFormValue(formData, "image_alt");
  const sortOrderValue = getFormValue(formData, "sort_order");
  const showPrice = formData.get("show_price") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const isActive = formData.get("is_active") === "on";

  validateBusinessItemInput(businessId, {
    type,
    name,
    imageUrl,
  });

  const sortOrder = parseNonNegativeIntegerOrZero(
    businessId,
    sortOrderValue,
  );

  const price = parseOptionalNonNegativePrice(businessId, priceValue);


  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar items.",
  );

  const { data: updatedItem, error: updateItemError } = await supabase
    .from("business_items")
    .update({
      type,
      name,
      description: description || null,
      price,
      currency,
      show_price: showPrice,
      is_featured: isFeatured,
      is_active: isActive,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
      sort_order: sortOrder,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("id", itemId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateItemError || !updatedItem) {
    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar el item: ${
        updateItemError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Item actualizado correctamente.");
}

export async function deleteBusinessItem(
  businessId: string,
  itemId: string,
) {
  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar items.",
  );

  const { data: deletedItem, error: deleteItemError } = await supabase
    .from("business_items")
    .delete()
    .eq("id", itemId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (deleteItemError || !deletedItem) {
    redirectToEditBusiness(
      businessId,
      `No se pudo eliminar el item: ${
        deleteItemError?.message ?? "sin filas eliminadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Item eliminado correctamente.");
}

export async function addBusinessItem(businessId: string, formData: FormData) {
  const type = getFormValue(formData, "type");
  const name = getFormValue(formData, "name");
  const description = getFormValue(formData, "description");
  const priceValue = getFormValue(formData, "price").replace(",", ".");
  const currency = getFormValue(formData, "currency") || "MXN";
  const imageUrl = getFormValue(formData, "image_url");
  const imageAlt = getFormValue(formData, "image_alt");

  const showPrice = formData.get("show_price") === "on";
  const isFeatured = formData.get("is_featured") === "on";

  validateBusinessItemInput(businessId, {
    type,
    name,
    imageUrl,
  });

  const price = parseOptionalNonNegativePrice(businessId, priceValue);


  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para agregar items.",
  );

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("business_items")
    .select("id, sort_order")
    .eq("business_id", businessId);

  if (existingItemsError) {
    redirectToEditBusiness(
      businessId,
      `No se pudieron revisar los items actuales: ${existingItemsError.message}`,
    );
  }

  const nextSortOrder = getNextSortOrder(existingItems ?? []);

  const { data: createdItem, error: insertItemError } = await supabase
    .from("business_items")
    .insert({
      business_id: businessId,
      type,
      name,
      description: description || null,
      price,
      currency,
      show_price: showPrice,
      is_featured: isFeatured,
      is_active: true,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertItemError || !createdItem) {
    redirectToEditBusiness(
      businessId,
      `No se pudo agregar el item: ${
        insertItemError?.message ?? "sin item creado"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Item agregado correctamente.");
}
export async function submitBusinessForReview(businessId: string) {
  const { supabase, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para enviar tu negocio a revisión.",
  );

  const { data: currentBusiness, error: currentBusinessError } = await supabase
    .from("businesses")
    .select("id, status")
    .eq("id", businessId)
    .eq("owner_id", business.owner_id)
    .single();

  if (currentBusinessError || !currentBusiness) {
    redirectToEditBusiness(
      businessId,
      "No se pudo revisar el estado actual del negocio.",
    );
  }

  const allowedStatuses = ["draft", "rejected", "hidden", "approved"];

  if (!allowedStatuses.includes(String(currentBusiness.status))) {
    redirectToEditBusiness(
      businessId,
      "Este negocio no se puede enviar a revisión desde su estado actual.",
    );
  }

  const now = new Date().toISOString();

  const { data: updatedBusiness, error: updateBusinessError } = await supabase
    .from("businesses")
    .update({
      status: "pending_review",
      is_published: false,
      submitted_at: now,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      hidden_at: null,
      published_at: null,
      updated_at: now,
    })
    .eq("id", businessId)
    .select("id")
    .single();

  if (updateBusinessError || !updatedBusiness) {
    redirectToEditBusiness(
      businessId,
      `No se pudo enviar a revisión: ${
        updateBusinessError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Negocio enviado a revisión.");
}
