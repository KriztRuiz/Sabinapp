// app/dashboard/negocios/[businessId]/edit/actions.ts

"use server";

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
  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      "Cambios guardados correctamente.",
    )}`,
  );
}

function isValidMediaUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function redirectToEditBusiness(businessId: string, message: string): never {
  redirect(
    `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function updateBusinessMediaDetails(
  businessId: string,
  mediaId: string,
  formData: FormData,
) {
  const url = getFormValue(formData, "url");
  const altText = getFormValue(formData, "alt_text");
  const isActive = formData.get("is_active") === "on";

  if (!url) {
    redirectToEditBusiness(businessId, "La URL de la imagen es obligatoria.");
  }

  if (!isValidMediaUrl(url)) {
    redirectToEditBusiness(
      businessId,
      "La URL de la imagen debe iniciar con http:// o https://.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para editar imágenes.");
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

  const { data: updatedMedia, error: updateMediaError } = await supabase
    .from("business_media")
    .update({
      url,
      alt_text: altText || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
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

  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirectToEditBusiness(businessId, "Imagen actualizada correctamente.");
}

export async function setBusinessMediaAsCover(
  businessId: string,
  mediaId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para editar imágenes.");
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
      updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
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

  revalidatePath(`/dashboard/negocios/${businessId}/edit`);
  revalidatePath(`/negocio/${business.slug}`);

  redirectToEditBusiness(businessId, "Portada actualizada correctamente.");
}