// app/dashboard/negocios/[businessId]/edit/actions.ts

"use server";

import {
  isBusinessItemType,
  isBusinessLocationType,
} from "./business-edit-types";
import { isLandingVisualMode } from "@/lib/landing/styles";
import { createClient } from "@/lib/supabase/server";
import { requireCompleteProfile } from "@/lib/profiles/require-complete-profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

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


  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para administrar tus negocios.",
  );

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, owner_id, status, short_description, long_description")
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

  const { data: currentSettings } = await supabase
    .from("business_settings")
    .select("visual_mode")
    .eq("business_id", businessId)
    .maybeSingle();

  const previousPublicData = {
    name: business.name,
    short_description: business.short_description,
    long_description: business.long_description,
    visual_mode: currentSettings?.visual_mode ?? null,
  };

  const nextPublicData = {
    name,
    short_description: shortDescription,
    long_description: longDescription || null,
    visual_mode: visualMode,
  };

  const hasPublicDataChanges =
    previousPublicData.name !== nextPublicData.name ||
    previousPublicData.short_description !== nextPublicData.short_description ||
    previousPublicData.long_description !== nextPublicData.long_description ||
    previousPublicData.visual_mode !== nextPublicData.visual_mode;

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

  if (business.status === "published" && hasPublicDataChanges) {
    const { error: changeEventError } = await supabase
      .from("business_change_events")
      .insert({
        business_id: businessId,
        business_name_snapshot: updatedBusiness.name,
        business_slug_snapshot: updatedBusiness.slug,
        actor_id: user.id,
        actor_email_snapshot: user.email ?? null,
        action_key: "business_public_content_updated",
        target_table: "businesses",
        target_id: businessId,
        summary: "El dueño actualizó contenido o estilo de un negocio publicado.",
        before_data: previousPublicData,
        after_data: nextPublicData,
      });

    if (changeEventError) {
      redirect(
        `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
          "Los cambios se guardaron, pero no se pudo crear el aviso para administración.",
        )}`,
      );
    }
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

const BUSINESS_MEDIA_BUCKET = "business-media";
const BUSINESS_MEDIA_MAX_BYTES = 5 * 1024 * 1024;

const BUSINESS_MEDIA_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ValidatedBusinessMediaFile = {
  file: File;
  extension: string;
};

function isValidMediaUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function getBusinessMediaAltText(formData: FormData) {
  return getFormValue(formData, "alt_text");
}

function getBusinessMediaFile(
  businessId: string,
  formData: FormData,
  required: boolean,
): ValidatedBusinessMediaFile | null {
  const value = formData.get("image_file");

  if (!value || typeof value === "string" || value.size === 0) {
    if (required) {
      redirectToEditBusiness(
        businessId,
        "Selecciona una imagen para continuar.",
      );
    }

    return null;
  }

  const extension = BUSINESS_MEDIA_MIME_EXTENSIONS[value.type];

  if (!extension) {
    redirectToEditBusiness(
      businessId,
      "La imagen debe ser JPEG, PNG o WebP.",
    );
  }

  if (value.size > BUSINESS_MEDIA_MAX_BYTES) {
    redirectToEditBusiness(
      businessId,
      "La imagen no puede superar 5 MB.",
    );
  }

  return {
    file: value,
    extension,
  };
}

async function uploadBusinessMediaFile(
  supabase: ServerSupabaseClient,
  businessId: string,
  image: ValidatedBusinessMediaFile,
) {
  const storagePath =
    `${businessId}/media/${randomUUID()}.${image.extension}`;

  const { error } = await supabase.storage
    .from(BUSINESS_MEDIA_BUCKET)
    .upload(storagePath, image.file, {
      cacheControl: "3600",
      contentType: image.file.type,
      upsert: false,
    });

  if (error) {
    redirectToEditBusiness(
      businessId,
      `No se pudo subir la imagen: ${error.message}`,
    );
  }

  return storagePath;
}

async function removeBusinessMediaStorageObject(
  supabase: ServerSupabaseClient,
  businessId: string,
  storageBucket: string | null,
  storagePath: string | null,
) {
  if (
    storageBucket !== BUSINESS_MEDIA_BUCKET ||
    !storagePath ||
    !storagePath.startsWith(`${businessId}/media/`)
  ) {
    return;
  }

  const { error } = await supabase.storage
    .from(BUSINESS_MEDIA_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error(
      "No se pudo eliminar archivo de business-media:",
      storagePath,
      error.message,
    );
  }
}

const BUSINESS_ITEM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

type ValidatedBusinessItemImageFile = {
  file: File;
  extension: string;
};

function getBusinessItemImageFile(
  businessId: string,
  formData: FormData,
): ValidatedBusinessItemImageFile | null {
  const value = formData.get("image_file");

  if (!value || typeof value === "string" || value.size === 0) {
    return null;
  }

  const extension = BUSINESS_MEDIA_MIME_EXTENSIONS[value.type];

  if (!extension) {
    redirectToEditBusiness(
      businessId,
      "La imagen del item debe ser JPEG, PNG o WebP.",
    );
  }

  if (value.size > BUSINESS_ITEM_IMAGE_MAX_BYTES) {
    redirectToEditBusiness(
      businessId,
      "La imagen del item no puede superar 5 MB.",
    );
  }

  return {
    file: value,
    extension,
  };
}

async function uploadBusinessItemImageFile(
  supabase: ServerSupabaseClient,
  businessId: string,
  image: ValidatedBusinessItemImageFile,
) {
  const storagePath =
    `${businessId}/items/${randomUUID()}.${image.extension}`;

  const { error } = await supabase.storage
    .from(BUSINESS_MEDIA_BUCKET)
    .upload(storagePath, image.file, {
      cacheControl: "3600",
      contentType: image.file.type,
      upsert: false,
    });

  if (error) {
    redirectToEditBusiness(
      businessId,
      `No se pudo subir la imagen del item: ${error.message}`,
    );
  }

  return storagePath;
}

async function removeBusinessItemStorageObject(
  supabase: ServerSupabaseClient,
  businessId: string,
  storageBucket: string | null,
  storagePath: string | null,
) {
  if (
    storageBucket !== BUSINESS_MEDIA_BUCKET ||
    !storagePath ||
    !storagePath.startsWith(`${businessId}/items/`)
  ) {
    return;
  }

  const { error } = await supabase.storage
    .from(BUSINESS_MEDIA_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error(
      "No se pudo eliminar archivo de item en business-media:",
      storagePath,
      error.message,
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
  },
) {
  if (!isBusinessItemType(input.type)) {
    redirectToEditBusiness(
      businessId,
      "Selecciona un tipo de item válido.",
    );
  }

  if (!input.name) {
    redirectToEditBusiness(
      businessId,
      "El nombre del item es obligatorio.",
    );
  }
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

type BusinessChangeData = Record<string, string | number | boolean | null>;

function normalizeBusinessChangeData(data: BusinessChangeData) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value ?? null]),
  ) as BusinessChangeData;
}

function hasBusinessChangeDataChanges(
  beforeData: BusinessChangeData,
  afterData: BusinessChangeData,
) {
  return JSON.stringify(beforeData) !== JSON.stringify(afterData);
}

async function recordPublishedBusinessChangeEvent({
  supabase,
  user,
  business,
  actionKey,
  targetTable,
  targetId,
  summary,
  beforeData,
  afterData,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string | null };
  business: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  actionKey: string;
  targetTable: string;
  targetId: string | null;
  summary: string;
  beforeData: BusinessChangeData;
  afterData: BusinessChangeData;
}) {
  if (business.status !== "published") {
    return;
  }

  const normalizedBeforeData = normalizeBusinessChangeData(beforeData);
  const normalizedAfterData = normalizeBusinessChangeData(afterData);

  if (
    !hasBusinessChangeDataChanges(normalizedBeforeData, normalizedAfterData)
  ) {
    return;
  }

  const { error } = await supabase.from("business_change_events").insert({
    business_id: business.id,
    business_name_snapshot: business.name,
    business_slug_snapshot: business.slug,
    actor_id: user.id,
    actor_email_snapshot: user.email ?? null,
    action_key: actionKey,
    target_table: targetTable,
    target_id: targetId,
    summary,
    before_data: normalizedBeforeData,
    after_data: normalizedAfterData,
  });

  if (error) {
    redirectToEditBusiness(
      business.id,
      "El cambio se guardó, pero no se pudo crear el aviso para administración.",
    );
  }
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


  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para administrar tus negocios.",
  );

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, owner_id, status")
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
    user,
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

  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_location_added",
    targetTable: "business_locations",
    targetId: insertedLocation.id,
    summary: "El dueño agregó una ubicación en un negocio publicado.",
    beforeData: {},
    afterData: {
      location_type: locationType,
      address_text: addressText || null,
      neighborhood: neighborhood || null,
      reference_notes: referenceNotes || null,
      service_area_text: serviceAreaText || null,
      map_url: mapUrl || null,
      is_primary: shouldBePrimary,
      is_public: isPublic,
    },
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Ubicación agregada correctamente.");
}

export async function deleteBusinessLocation(
  businessId: string,
  locationId: string,
) {
  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar ubicaciones.",
  );

  const { data: currentLocation, error: currentLocationError } = await supabase
    .from("business_locations")
    .select("id, location_type, address_text, neighborhood, reference_notes, service_area_text, map_url, is_primary, is_public")
    .eq("id", locationId)
    .eq("business_id", businessId)
    .single();

  if (currentLocationError || !currentLocation) {
    redirectToEditBusiness(
      businessId,
      `No se encontró la ubicación: ${
        currentLocationError?.message ?? "sin filas encontradas"
      }`,
    );
  }

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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_location_deleted",
    targetTable: "business_locations",
    targetId: locationId,
    summary: "El dueño eliminó una ubicación de un negocio publicado.",
    beforeData: {
      location_type: currentLocation.location_type,
      address_text: currentLocation.address_text,
      neighborhood: currentLocation.neighborhood,
      reference_notes: currentLocation.reference_notes,
      service_area_text: currentLocation.service_area_text,
      map_url: currentLocation.map_url,
      is_primary: currentLocation.is_primary,
      is_public: currentLocation.is_public,
    },
    afterData: {},
  });

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

  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar ubicaciones.",
  );

  const { data: currentLocation, error: currentLocationError } = await supabase
    .from("business_locations")
    .select("id, location_type, address_text, neighborhood, reference_notes, service_area_text, map_url, is_primary, is_public")
    .eq("id", locationId)
    .eq("business_id", businessId)
    .single();

  if (currentLocationError || !currentLocation) {
    redirectToEditBusiness(
      businessId,
      `No se encontró la ubicación: ${
        currentLocationError?.message ?? "sin filas encontradas"
      }`,
    );
  }

  const nextLocationData = {
    location_type: currentLocation.location_type,
    address_text: addressText || null,
    neighborhood: neighborhood || null,
    reference_notes: referenceNotes || null,
    service_area_text: serviceAreaText || null,
    map_url: mapUrl || null,
    is_primary: isPrimary,
    is_public: isPublic,
  };

  if (isPrimary) {
    await unsetOtherPrimaryLocations(supabase, businessId, locationId);
  }

  const { data: updatedLocation, error: updateLocationError } = await supabase
    .from("business_locations")
    .update({
      ...nextLocationData,
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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_location_updated",
    targetTable: "business_locations",
    targetId: locationId,
    summary: "El dueño actualizó una ubicación de un negocio publicado.",
    beforeData: {
      location_type: currentLocation.location_type,
      address_text: currentLocation.address_text,
      neighborhood: currentLocation.neighborhood,
      reference_notes: currentLocation.reference_notes,
      service_area_text: currentLocation.service_area_text,
      map_url: currentLocation.map_url,
      is_primary: currentLocation.is_primary,
      is_public: currentLocation.is_public,
    },
    afterData: nextLocationData,
  });

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

  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_hour_added",
    targetTable: "business_hours",
    targetId: insertedHour.id,
    summary: "El dueño agregó un horario en un negocio publicado.",
    beforeData: {},
    afterData: {
      day_of_week: dayOfWeek,
      period_order: periodOrder,
      opens_at: opensAt,
      closes_at: closesAt,
      is_closed: isClosed,
      notes: notes || null,
    },
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Horario agregado correctamente.");
}

export async function deleteBusinessHour(
  businessId: string,
  hourId: string,
) {
  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar horarios.",
  );

  const { data: currentHour, error: currentHourError } = await supabase
    .from("business_hours")
    .select("id, day_of_week, period_order, opens_at, closes_at, is_closed, notes")
    .eq("id", hourId)
    .eq("business_id", businessId)
    .single();

  if (currentHourError || !currentHour) {
    redirectToEditBusiness(
      businessId,
      `No se encontró el horario: ${
        currentHourError?.message ?? "sin filas encontradas"
      }`,
    );
  }

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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_hour_deleted",
    targetTable: "business_hours",
    targetId: hourId,
    summary: "El dueño eliminó un horario de un negocio publicado.",
    beforeData: {
      day_of_week: currentHour.day_of_week,
      period_order: currentHour.period_order,
      opens_at: currentHour.opens_at,
      closes_at: currentHour.closes_at,
      is_closed: currentHour.is_closed,
      notes: currentHour.notes,
    },
    afterData: {},
  });

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

  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar horarios.",
  );

  const { data: currentHour, error: currentHourError } = await supabase
    .from("business_hours")
    .select("id, day_of_week, period_order, opens_at, closes_at, is_closed, notes")
    .eq("id", hourId)
    .eq("business_id", businessId)
    .single();

  if (currentHourError || !currentHour) {
    redirectToEditBusiness(
      businessId,
      `No se encontró el horario: ${
        currentHourError?.message ?? "sin filas encontradas"
      }`,
    );
  }

  const nextHourData = {
    day_of_week: currentHour.day_of_week,
    period_order: periodOrder,
    opens_at: opensAt,
    closes_at: closesAt,
    is_closed: isClosed,
    notes: notes || null,
  };

  const { data: updatedHour, error: updateHourError } = await supabase
    .from("business_hours")
    .update({
      ...nextHourData,
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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_hour_updated",
    targetTable: "business_hours",
    targetId: hourId,
    summary: "El dueño actualizó un horario de un negocio publicado.",
    beforeData: {
      day_of_week: currentHour.day_of_week,
      period_order: currentHour.period_order,
      opens_at: currentHour.opens_at,
      closes_at: currentHour.closes_at,
      is_closed: currentHour.is_closed,
      notes: currentHour.notes,
    },
    afterData: nextHourData,
  });

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

  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_contact_added",
    targetTable: "contact_methods",
    targetId: insertedContact.id,
    summary: "El dueño agregó un contacto en un negocio publicado.",
    beforeData: {},
    afterData: {
      type,
      label,
      value,
      url: url || null,
      is_primary: isPrimary,
      is_active: isActive,
      sort_order: nextSortOrder,
    },
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Contacto agregado correctamente.");
}

export async function deleteBusinessContact(
  businessId: string,
  contactId: string,
) {
  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para eliminar contactos.",
  );

  const { data: currentContact, error: currentContactError } = await supabase
    .from("contact_methods")
    .select("id, type, label, value, url, is_primary, is_active, sort_order")
    .eq("id", contactId)
    .eq("business_id", businessId)
    .single();

  if (currentContactError || !currentContact) {
    redirectToEditBusiness(
      businessId,
      `No se encontró el contacto: ${
        currentContactError?.message ?? "sin filas encontradas"
      }`,
    );
  }

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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_contact_deleted",
    targetTable: "contact_methods",
    targetId: contactId,
    summary: "El dueño eliminó un contacto de un negocio publicado.",
    beforeData: {
      type: currentContact.type,
      label: currentContact.label,
      value: currentContact.value,
      url: currentContact.url,
      is_primary: currentContact.is_primary,
      is_active: currentContact.is_active,
      sort_order: currentContact.sort_order,
    },
    afterData: {},
  });

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

  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar contactos.",
  );

  const { data: currentContact, error: currentContactError } = await supabase
    .from("contact_methods")
    .select("id, type, label, value, url, is_primary, is_active, sort_order")
    .eq("id", contactId)
    .eq("business_id", businessId)
    .single();

  if (currentContactError || !currentContact) {
    redirectToEditBusiness(
      businessId,
      `No se encontró el contacto: ${
        currentContactError?.message ?? "sin filas encontradas"
      }`,
    );
  }

  const nextContactData = {
    type,
    label,
    value,
    url: url || null,
    is_primary: isPrimary,
    is_active: isActive,
    sort_order: sortOrder,
  };

  if (isPrimary) {
    await unsetOtherPrimaryContacts(supabase, businessId, contactId);
  }

  const { data: updatedContact, error: updateContactError } = await supabase
    .from("contact_methods")
    .update({
      ...nextContactData,
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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_contact_updated",
    targetTable: "contact_methods",
    targetId: contactId,
    summary: "El dueño actualizó un contacto de un negocio publicado.",
    beforeData: {
      type: currentContact.type,
      label: currentContact.label,
      value: currentContact.value,
      url: currentContact.url,
      is_primary: currentContact.is_primary,
      is_active: currentContact.is_active,
      sort_order: currentContact.sort_order,
    },
    afterData: nextContactData,
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Contacto actualizado correctamente.");
}

export async function updateBusinessMediaDetails(
  businessId: string,
  mediaId: string,
  formData: FormData,
) {
  const altText = getBusinessMediaAltText(formData);
  const replacementImage = getBusinessMediaFile(
    businessId,
    formData,
    false,
  );

  const sortOrderValue = getFormValue(formData, "sort_order");
  const sortOrder = parseNonNegativeIntegerOrZero(
    businessId,
    sortOrderValue,
  );

  const isActive = formData.get("is_active") === "on";

  const { supabase, user, business } =
    await getOwnedBusinessContextOrRedirect(
      businessId,
      "Inicia sesión para editar imágenes.",
    );

  const { data: currentMedia, error: currentMediaError } = await supabase
    .from("business_media")
    .select(
      "id, type, url, storage_bucket, storage_path, alt_text, is_active, is_cover, sort_order",
    )
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .single();

  if (currentMediaError || !currentMedia) {
    redirectToEditBusiness(
      businessId,
      `No se encontró la imagen: ${
        currentMediaError?.message ?? "sin filas encontradas"
      }`,
    );
  }

  let uploadedStoragePath: string | null = null;

  if (replacementImage) {
    uploadedStoragePath = await uploadBusinessMediaFile(
      supabase,
      businessId,
      replacementImage,
    );
  }

  const nextUrl = replacementImage ? null : currentMedia.url;

  const nextStorageBucket = replacementImage
    ? BUSINESS_MEDIA_BUCKET
    : currentMedia.storage_bucket;

  const nextStoragePath = replacementImage
    ? uploadedStoragePath
    : currentMedia.storage_path;

  const { data: updatedMedia, error: updateMediaError } = await supabase
    .from("business_media")
    .update({
      url: nextUrl,
      storage_bucket: nextStorageBucket,
      storage_path: nextStoragePath,
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
    if (uploadedStoragePath) {
      await removeBusinessMediaStorageObject(
        supabase,
        businessId,
        BUSINESS_MEDIA_BUCKET,
        uploadedStoragePath,
      );
    }

    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar la imagen: ${
        updateMediaError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  if (replacementImage) {
    await removeBusinessMediaStorageObject(
      supabase,
      businessId,
      currentMedia.storage_bucket,
      currentMedia.storage_path,
    );
  }

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_media_updated",
    targetTable: "business_media",
    targetId: mediaId,
    summary: "El dueño actualizó una imagen de un negocio publicado.",
    beforeData: {
      media_type: currentMedia.type,
      image_url: currentMedia.url,
      storage_bucket: currentMedia.storage_bucket,
      storage_path: currentMedia.storage_path,
      alt_text: currentMedia.alt_text,
      is_active: currentMedia.is_active,
      is_cover: currentMedia.is_cover,
      sort_order: currentMedia.sort_order,
    },
    afterData: {
      media_type: currentMedia.type,
      image_url: nextUrl,
      storage_bucket: nextStorageBucket,
      storage_path: nextStoragePath,
      alt_text: altText || null,
      is_active: isActive,
      is_cover: currentMedia.is_cover,
      sort_order: sortOrder,
    },
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(
    businessId,
    replacementImage
      ? "Imagen reemplazada correctamente."
      : "Imagen actualizada correctamente.",
  );
}

export async function setBusinessMediaAsCover(
  businessId: string,
  mediaId: string,
) {
  const { supabase, user, business } = await getOwnedBusinessContextOrRedirect(
    businessId,
    "Inicia sesión para editar imágenes.",
  );

  const { data: existingMedia, error: existingMediaError } = await supabase
    .from("business_media")
    .select("id, type, url, alt_text, is_active, is_cover, sort_order")
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .single();

  if (existingMediaError || !existingMedia) {
    redirectToEditBusiness(
      businessId,
      "No se encontró la imagen seleccionada.",
    );
  }

  const { data: currentCover } = await supabase
    .from("business_media")
    .select("id, url, alt_text")
    .eq("business_id", businessId)
    .eq("is_cover", true)
    .maybeSingle();

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

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_media_cover_changed",
    targetTable: "business_media",
    targetId: mediaId,
    summary: "El dueño cambió la portada de un negocio publicado.",
    beforeData: {
      cover_media_id: currentCover?.id ?? null,
      cover_image_url: currentCover?.url ?? null,
      cover_alt_text: currentCover?.alt_text ?? null,
    },
    afterData: {
      cover_media_id: existingMedia.id,
      cover_image_url: existingMedia.url,
      cover_alt_text: existingMedia.alt_text,
    },
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(businessId, "Portada actualizada correctamente.");
}

export async function deleteBusinessMedia(
  businessId: string,
  mediaId: string,
) {
  const { supabase, user, business } =
    await getOwnedBusinessContextOrRedirect(
      businessId,
      "Inicia sesión para eliminar imágenes.",
    );

  const { data: currentMedia, error: currentMediaError } = await supabase
    .from("business_media")
    .select(
      "id, type, url, storage_bucket, storage_path, alt_text, is_active, is_cover, sort_order",
    )
    .eq("id", mediaId)
    .eq("business_id", businessId)
    .single();

  if (currentMediaError || !currentMedia) {
    redirectToEditBusiness(
      businessId,
      `No se encontró la imagen: ${
        currentMediaError?.message ?? "sin filas encontradas"
      }`,
    );
  }

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

  await removeBusinessMediaStorageObject(
    supabase,
    businessId,
    currentMedia.storage_bucket,
    currentMedia.storage_path,
  );

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_media_deleted",
    targetTable: "business_media",
    targetId: mediaId,
    summary: "El dueño eliminó una imagen de un negocio publicado.",
    beforeData: {
      media_type: currentMedia.type,
      image_url: currentMedia.url,
      storage_bucket: currentMedia.storage_bucket,
      storage_path: currentMedia.storage_path,
      alt_text: currentMedia.alt_text,
      is_active: currentMedia.is_active,
      is_cover: currentMedia.is_cover,
      sort_order: currentMedia.sort_order,
    },
    afterData: {},
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(
    businessId,
    "Imagen eliminada correctamente.",
  );
}

export async function addBusinessMedia(
  businessId: string,
  formData: FormData,
) {
  const altText = getBusinessMediaAltText(formData);

  const image = getBusinessMediaFile(
    businessId,
    formData,
    true,
  );

  if (!image) {
    redirectToEditBusiness(
      businessId,
      "Selecciona una imagen para continuar.",
    );
  }

  const { supabase, user, business } =
    await getOwnedBusinessContextOrRedirect(
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

  const storagePath = await uploadBusinessMediaFile(
    supabase,
    businessId,
    image,
  );

  const { data: createdMedia, error: insertMediaError } = await supabase
    .from("business_media")
    .insert({
      business_id: businessId,
      type: shouldBeCover ? "cover" : "gallery",
      url: null,
      storage_bucket: BUSINESS_MEDIA_BUCKET,
      storage_path: storagePath,
      alt_text: altText || null,
      is_active: true,
      is_cover: shouldBeCover,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertMediaError || !createdMedia) {
    await removeBusinessMediaStorageObject(
      supabase,
      businessId,
      BUSINESS_MEDIA_BUCKET,
      storagePath,
    );

    redirectToEditBusiness(
      businessId,
      `No se pudo agregar la imagen: ${
        insertMediaError?.message ?? "sin imagen creada"
      }`,
    );
  }

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_media_added",
    targetTable: "business_media",
    targetId: createdMedia.id,
    summary: "El dueño agregó una imagen en un negocio publicado.",
    beforeData: {},
    afterData: {
      media_type: shouldBeCover ? "cover" : "gallery",
      image_url: null,
      storage_bucket: BUSINESS_MEDIA_BUCKET,
      storage_path: storagePath,
      alt_text: altText || null,
      is_active: true,
      is_cover: shouldBeCover,
      sort_order: nextSortOrder,
    },
  });

  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(
    businessId,
    "Imagen agregada correctamente.",
  );
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
  const imageAlt = getFormValue(formData, "image_alt");
  const sortOrderValue = getFormValue(formData, "sort_order");
  const showPrice = formData.get("show_price") === "on";
  const isFeatured = formData.get("is_featured") === "on";
  const isActive = formData.get("is_active") === "on";
  const removeImage = formData.get("remove_image") === "on";

  const replacementImage = getBusinessItemImageFile(
    businessId,
    formData,
  );

  if (replacementImage && removeImage) {
    redirectToEditBusiness(
      businessId,
      "Elige reemplazar la imagen o quitarla, no ambas opciones.",
    );
  }

  validateBusinessItemInput(businessId, {
    type,
    name,
  });

  const sortOrder = parseNonNegativeIntegerOrZero(
    businessId,
    sortOrderValue,
  );

  const price = parseOptionalNonNegativePrice(
    businessId,
    priceValue,
  );

  const { supabase, user, business } =
    await getOwnedBusinessContextOrRedirect(
      businessId,
      "Inicia sesión para editar items.",
    );

  const { data: currentItem, error: currentItemError } = await supabase
    .from("business_items")
    .select(
      "id, type, name, description, price, currency, show_price, is_featured, is_active, image_url, image_storage_bucket, image_storage_path, image_alt, sort_order",
    )
    .eq("id", itemId)
    .eq("business_id", businessId)
    .single();

  if (currentItemError || !currentItem) {
    redirectToEditBusiness(
      businessId,
      `No se encontró el item: ${
        currentItemError?.message ?? "sin filas encontradas"
      }`,
    );
  }

  let uploadedStoragePath: string | null = null;

  if (replacementImage) {
    uploadedStoragePath = await uploadBusinessItemImageFile(
      supabase,
      businessId,
      replacementImage,
    );
  }

  const nextImageUrl =
    replacementImage || removeImage
      ? null
      : currentItem.image_url;

  const nextImageStorageBucket = replacementImage
    ? BUSINESS_MEDIA_BUCKET
    : removeImage
      ? null
      : currentItem.image_storage_bucket;

  const nextImageStoragePath = replacementImage
    ? uploadedStoragePath
    : removeImage
      ? null
      : currentItem.image_storage_path;

  const nextItemData = {
    item_type: type,
    name,
    description: description || null,
    price,
    currency,
    show_price: showPrice,
    is_featured: isFeatured,
    is_active: isActive,
    image_url: nextImageUrl,
    image_storage_bucket: nextImageStorageBucket,
    image_storage_path: nextImageStoragePath,
    image_alt: imageAlt || null,
    sort_order: sortOrder,
  };

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
      image_url: nextImageUrl,
      image_storage_bucket: nextImageStorageBucket,
      image_storage_path: nextImageStoragePath,
      image_alt: imageAlt || null,
      sort_order: sortOrder,
      updated_at: getNowIsoTimestamp(),
    })
    .eq("id", itemId)
    .eq("business_id", businessId)
    .select("id")
    .single();

  if (updateItemError || !updatedItem) {
    if (uploadedStoragePath) {
      await removeBusinessItemStorageObject(
        supabase,
        businessId,
        BUSINESS_MEDIA_BUCKET,
        uploadedStoragePath,
      );
    }

    redirectToEditBusiness(
      businessId,
      `No se pudo actualizar el item: ${
        updateItemError?.message ?? "sin filas actualizadas"
      }`,
    );
  }

  if (replacementImage || removeImage) {
    await removeBusinessItemStorageObject(
      supabase,
      businessId,
      currentItem.image_storage_bucket,
      currentItem.image_storage_path,
    );
  }

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_item_updated",
    targetTable: "business_items",
    targetId: itemId,
    summary: "El dueño actualizó un item de un negocio publicado.",
    beforeData: {
      item_type: currentItem.type,
      name: currentItem.name,
      description: currentItem.description,
      price: currentItem.price,
      currency: currentItem.currency,
      show_price: currentItem.show_price,
      is_featured: currentItem.is_featured,
      is_active: currentItem.is_active,
      image_url: currentItem.image_url,
      image_storage_bucket: currentItem.image_storage_bucket,
      image_storage_path: currentItem.image_storage_path,
      image_alt: currentItem.image_alt,
      sort_order: currentItem.sort_order,
    },
    afterData: nextItemData,
  });

  revalidateBusinessEditAndPublic(
    businessId,
    business.slug,
  );

  redirectToEditBusiness(
    businessId,
    "Item actualizado correctamente.",
  );
}

export async function deleteBusinessItem(
  businessId: string,
  itemId: string,
) {
  const { supabase, user, business } =
    await getOwnedBusinessContextOrRedirect(
      businessId,
      "Inicia sesión para eliminar items.",
    );

  const { data: currentItem, error: currentItemError } = await supabase
    .from("business_items")
    .select(
      "id, type, name, description, price, currency, show_price, is_featured, is_active, image_url, image_storage_bucket, image_storage_path, image_alt, sort_order",
    )
    .eq("id", itemId)
    .eq("business_id", businessId)
    .single();

  if (currentItemError || !currentItem) {
    redirectToEditBusiness(
      businessId,
      `No se encontró el item: ${
        currentItemError?.message ?? "sin filas encontradas"
      }`,
    );
  }

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

  await removeBusinessItemStorageObject(
    supabase,
    businessId,
    currentItem.image_storage_bucket,
    currentItem.image_storage_path,
  );

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_item_deleted",
    targetTable: "business_items",
    targetId: itemId,
    summary: "El dueño eliminó un item de un negocio publicado.",
    beforeData: {
      item_type: currentItem.type,
      name: currentItem.name,
      description: currentItem.description,
      price: currentItem.price,
      currency: currentItem.currency,
      show_price: currentItem.show_price,
      is_featured: currentItem.is_featured,
      is_active: currentItem.is_active,
      image_url: currentItem.image_url,
      image_storage_bucket: currentItem.image_storage_bucket,
      image_storage_path: currentItem.image_storage_path,
      image_alt: currentItem.image_alt,
      sort_order: currentItem.sort_order,
    },
    afterData: {},
  });

  revalidateBusinessEditAndPublic(
    businessId,
    business.slug,
  );

  redirectToEditBusiness(
    businessId,
    "Item eliminado correctamente.",
  );
}

export async function addBusinessItem(
  businessId: string,
  formData: FormData,
) {
  const type = getFormValue(formData, "type");
  const name = getFormValue(formData, "name");
  const description = getFormValue(formData, "description");
  const priceValue = getFormValue(formData, "price").replace(",", ".");
  const currency = getFormValue(formData, "currency") || "MXN";
  const imageAlt = getFormValue(formData, "image_alt");

  const showPrice = formData.get("show_price") === "on";
  const isFeatured = formData.get("is_featured") === "on";

  const image = getBusinessItemImageFile(
    businessId,
    formData,
  );

  validateBusinessItemInput(businessId, {
    type,
    name,
  });

  const price = parseOptionalNonNegativePrice(
    businessId,
    priceValue,
  );

  const { supabase, user, business } =
    await getOwnedBusinessContextOrRedirect(
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

  const nextSortOrder = getNextSortOrder(
    existingItems ?? [],
  );

  let storagePath: string | null = null;

  if (image) {
    storagePath = await uploadBusinessItemImageFile(
      supabase,
      businessId,
      image,
    );
  }

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
      image_url: null,
      image_storage_bucket: storagePath
        ? BUSINESS_MEDIA_BUCKET
        : null,
      image_storage_path: storagePath,
      image_alt: imageAlt || null,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single();

  if (insertItemError || !createdItem) {
    if (storagePath) {
      await removeBusinessItemStorageObject(
        supabase,
        businessId,
        BUSINESS_MEDIA_BUCKET,
        storagePath,
      );
    }

    redirectToEditBusiness(
      businessId,
      `No se pudo agregar el item: ${
        insertItemError?.message ?? "sin item creado"
      }`,
    );
  }

  await recordPublishedBusinessChangeEvent({
    supabase,
    user,
    business,
    actionKey: "business_item_added",
    targetTable: "business_items",
    targetId: createdItem.id,
    summary: "El dueño agregó un item en un negocio publicado.",
    beforeData: {},
    afterData: {
      item_type: type,
      name,
      description: description || null,
      price,
      currency,
      show_price: showPrice,
      is_featured: isFeatured,
      is_active: true,
      image_url: null,
      image_storage_bucket: storagePath
        ? BUSINESS_MEDIA_BUCKET
        : null,
      image_storage_path: storagePath,
      image_alt: imageAlt || null,
      sort_order: nextSortOrder,
    },
  });

  revalidateBusinessEditAndPublic(
    businessId,
    business.slug,
  );

  redirectToEditBusiness(
    businessId,
    "Item agregado correctamente.",
  );
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

export async function publishApprovedOwnedBusiness(businessId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para publicar el negocio.");
  }


  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para administrar tus negocios.",
  );

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id, status, expires_at")
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

  if (business.status !== "approved") {
    redirectToEditBusiness(
      businessId,
      "Solo puedes publicar negocios aprobados por administración.",
    );
  }

  const isExpired = business.expires_at
    ? new Date(business.expires_at).getTime() < Date.now()
    : false;

  if (isExpired) {
    redirectToEditBusiness(
      businessId,
      "No se puede publicar porque la vigencia ya venció. Solicita una revisión al administrador.",
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
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      hidden_at: null,
      updated_at: now,
    })
    .eq("id", businessId)
    .eq("owner_id", user.id);

  if (error) {
    redirectToEditBusiness(
      businessId,
      "No se pudo publicar el negocio. Intenta de nuevo.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/negocios");
  revalidateBusinessEditAndPublic(businessId, business.slug);
  revalidatePath("/");
  revalidatePath("/negocios");
  revalidatePath("/productos");

  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      "Negocio publicado correctamente.",
    )}`,
  );
}


export async function pausePublishedOwnedBusiness(businessId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para administrar negocios.");
  }


  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para administrar tus negocios.",
  );

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id, status, is_published")
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

  if (business.status !== "published" || !business.is_published) {
    redirectToEditBusiness(
      businessId,
      "Solo puedes retirar del público un negocio publicado.",
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("businesses")
    .update({
      status: "hidden",
      is_published: false,
      show_in_search: false,
      show_in_home: false,
      hidden_at: now,
      updated_at: now,
    })
    .eq("id", businessId)
    .eq("owner_id", user.id);

  if (error) {
    redirectToEditBusiness(
      businessId,
      "No se pudo retirar el negocio del público. Intenta de nuevo.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/negocios");
  revalidateBusinessEditAndPublic(businessId, business.slug);
  revalidatePath("/");
  revalidatePath("/negocios");
  revalidatePath("/productos");

  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      "Negocio retirado del público correctamente.",
    )}`,
  );
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

export async function updateBusinessClassification(
  businessId: string,
  formData: FormData,
) {
  const businessTypeId = getFormValue(formData, "business_type_id");
  const categoryId = getFormValue(formData, "category_id");
  const startsAtRaw = getFormValue(formData, "starts_at");
  const endsAtRaw = getFormValue(formData, "ends_at");

  if (!businessTypeId) {
    redirectToEditBusiness(businessId, "Selecciona un tipo de negocio.");
  }

  if (!categoryId) {
    redirectToEditBusiness(businessId, "Selecciona una categoría.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para editar negocios.");
  }


  await requireCompleteProfile(
    supabase,
    user.id,
    "Completa tu perfil para administrar tus negocios.",
  );

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug, owner_id, status")
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

  const allowedClassificationEditStatuses = ["draft", "rejected", "hidden"];

  if (!allowedClassificationEditStatuses.includes(String(business.status))) {
    redirectToEditBusiness(
      businessId,
      "Para cambiar la clasificación o vigencia, el negocio debe estar en borrador, rechazado o retirado del público.",
    );
  }

  const { data: businessType, error: businessTypeError } = await supabase
    .from("business_types")
    .select("id, requires_start_end_dates, is_adult_related")
    .eq("id", businessTypeId)
    .eq("is_active", true)
    .single();

  if (businessTypeError || !businessType) {
    redirectToEditBusiness(
      businessId,
      "El tipo de negocio seleccionado no es válido.",
    );
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, business_type_id")
    .eq("id", categoryId)
    .eq("business_type_id", businessType.id)
    .eq("is_active", true)
    .single();

  if (categoryError || !category) {
    redirectToEditBusiness(
      businessId,
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
    redirectToEditBusiness(
      businessId,
      "Este tipo de negocio requiere fecha de inicio y fecha de finalización.",
    );
  }

  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    redirectToEditBusiness(
      businessId,
      "La fecha final no puede ser anterior a la fecha inicial.",
    );
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      business_type_id: businessType.id,
      category_id: category.id,
      is_adult_content: Boolean(businessType.is_adult_related),
      requires_age_verification: Boolean(businessType.is_adult_related),
      starts_at: startsAt,
      ends_at: endsAt,
      expires_at: endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .eq("owner_id", user.id);

  if (error) {
    redirectToEditBusiness(
      businessId,
      "No se pudo actualizar la clasificación del negocio.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/negocios");
  revalidateBusinessEditAndPublic(businessId, business.slug);

  redirectToEditBusiness(
    businessId,
    "Clasificación actualizada correctamente.",
  );
}
