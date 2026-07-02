// app/dashboard/negocios/[businessId]/edit/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isValidVisualMode(value: string) {
  return (
    value === "classic" ||
    value === "modern" ||
    value === "warm" ||
    value === "compact" ||
    value === "elegant" ||
    value === "impact"
  );
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

  if (!isValidVisualMode(visualMode)) {
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

  const { data: existingSettings, error: settingsReadError } = await supabase
    .from("business_settings")
    .select("business_id")
    .eq("business_id", businessId)
    .maybeSingle();

  if (settingsReadError) {
    redirect(
      `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
        `No se pudo leer la configuración visual: ${settingsReadError.message}`,
      )}`,
    );
  }

  if (!existingSettings) {
    const { error: insertSettingsError } = await supabase
      .from("business_settings")
      .insert({
        business_id: businessId,
        visual_mode: visualMode,
      });

    if (insertSettingsError) {
      redirect(
        `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
          `El contenido se guardó, pero no se pudo crear la configuración visual: ${insertSettingsError.message}`,
        )}`,
      );
    }
  } else {
    const { data: updatedSettings, error: updateSettingsError } = await supabase
      .from("business_settings")
      .update({
        visual_mode: visualMode,
      })
      .eq("business_id", businessId)
      .select("business_id, visual_mode")
      .single();

    if (updateSettingsError || !updatedSettings) {
      redirect(
        `/dashboard/negocios/${businessId}/edit?message=${encodeURIComponent(
          `El contenido se guardó, pero no se pudo actualizar el estilo visual: ${
            updateSettingsError?.message ?? "sin filas actualizadas"
          }`,
        )}`,
      );
    }
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