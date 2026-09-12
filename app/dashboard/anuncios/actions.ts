"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function redirectAdError(message: string): never {
  redirect(
    `/dashboard/anuncios/nuevo?error=${encodeURIComponent(message)}`,
  );
}

function redirectAdEditError(
  campaignId: string,
  message: string,
): never {
  redirect(
    `/dashboard/anuncios/${campaignId}/editar?error=${encodeURIComponent(
      message,
    )}`,
  );
}

function getRequiredText(
  formData: FormData,
  key: string,
  label: string,
) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    redirectAdError(`Falta el campo: ${label}.`);
  }

  return value;
}

function parseScheduledDate(value: string) {
  const cleanValue = value.trim();

  const validFormat =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(cleanValue);

  if (!validFormat) {
    redirectAdError("La fecha y hora de inicio no son válidas.");
  }

  const withSeconds =
    cleanValue.length === 16
      ? `${cleanValue}:00`
      : cleanValue;

  const date = new Date(`${withSeconds}-06:00`);

  if (Number.isNaN(date.getTime())) {
    redirectAdError("La fecha y hora de inicio no son válidas.");
  }

  return date.toISOString();
}

export async function submitOwnerAdRequest(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const businessId = getRequiredText(
    formData,
    "businessId",
    "negocio",
  );

  const title = getRequiredText(
    formData,
    "title",
    "título",
  );

  const description =
    String(formData.get("description") ?? "").trim();

  const requestedDaysRaw = getRequiredText(
    formData,
    "requestedDays",
    "duración",
  );

  const requestedDays = Number(requestedDaysRaw);

  if (
    !Number.isInteger(requestedDays) ||
    requestedDays < 1
  ) {
    redirectAdError(
      "La duración debe ser de al menos un día.",
    );
  }

  const startMode = getRequiredText(
    formData,
    "startMode",
    "tipo de inicio",
  );

  if (!["asap", "scheduled"].includes(startMode)) {
    redirectAdError(
      "La opción de inicio seleccionada no es válida.",
    );
  }

  let requestedStartAt: string | null = null;

  if (startMode === "scheduled") {
    requestedStartAt = parseScheduledDate(
      getRequiredText(
        formData,
        "requestedStartAt",
        "fecha y hora de inicio",
      ),
    );
  }

  const targetChoice = getRequiredText(
    formData,
    "targetChoice",
    "destino",
  );

  let targetKind = "";
  let targetContactMethodId: string | null = null;

  if (targetChoice === "business_page") {
    targetKind = "business_page";
  } else if (targetChoice.startsWith("contact:")) {
    const contactId = targetChoice.slice("contact:".length).trim();

    if (!contactId) {
      redirectAdError(
        "El contacto seleccionado no es válido.",
      );
    }

    targetKind = "contact";
    targetContactMethodId = contactId;
  } else {
    redirectAdError(
      "El destino seleccionado no es válido.",
    );
  }

  const imageUrl = getRequiredText(
    formData,
    "imageUrl",
    "imagen",
  );

  const { error } = await supabase.rpc(
    "submit_ad_request",
    {
      p_business_id: businessId,
      p_title: title,
      p_description: description || null,
      p_requested_days: requestedDays,
      p_start_mode: startMode,
      p_requested_start_at: requestedStartAt,
      p_target_kind: targetKind,
      p_target_contact_method_id: targetContactMethodId,
      p_image_url: imageUrl,
    },
  );

  if (error) {
    redirectAdError(
      error.message ||
        "No se pudo enviar la solicitud del anuncio.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anuncios");
  revalidatePath("/dashboard/admin/anuncios");

  redirect(
    "/dashboard/anuncios?message=" +
      encodeURIComponent(
        "Tu anuncio fue enviado a revisión correctamente.",
      ),
  );
}


export async function resubmitOwnerAdRequest(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const campaignId = String(
    formData.get("campaignId") ?? "",
  ).trim();

  if (!campaignId) {
    redirect("/dashboard/anuncios");
  }

  function getEditRequiredText(
    key: string,
    label: string,
  ) {
    const value = String(
      formData.get(key) ?? "",
    ).trim();

    if (!value) {
      redirectAdEditError(
        campaignId,
        `Falta el campo: ${label}.`,
      );
    }

    return value;
  }

  const title = getEditRequiredText(
    "title",
    "título",
  );

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  const requestedDaysRaw = getEditRequiredText(
    "requestedDays",
    "duración",
  );

  const requestedDays = Number(
    requestedDaysRaw,
  );

  if (
    !Number.isInteger(requestedDays) ||
    requestedDays < 1
  ) {
    redirectAdEditError(
      campaignId,
      "La duración debe ser de al menos un día.",
    );
  }

  const startMode = getEditRequiredText(
    "startMode",
    "tipo de inicio",
  );

  if (!["asap", "scheduled"].includes(startMode)) {
    redirectAdEditError(
      campaignId,
      "La opción de inicio seleccionada no es válida.",
    );
  }

  let requestedStartAt: string | null = null;

  if (startMode === "scheduled") {
    const requestedStartValue =
      getEditRequiredText(
        "requestedStartAt",
        "fecha y hora de inicio",
      );

    const cleanValue =
      requestedStartValue.trim();

    const validFormat =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(
        cleanValue,
      );

    if (!validFormat) {
      redirectAdEditError(
        campaignId,
        "La fecha y hora de inicio no son válidas.",
      );
    }

    const withSeconds =
      cleanValue.length === 16
        ? `${cleanValue}:00`
        : cleanValue;

    const date = new Date(
      `${withSeconds}-06:00`,
    );

    if (Number.isNaN(date.getTime())) {
      redirectAdEditError(
        campaignId,
        "La fecha y hora de inicio no son válidas.",
      );
    }

    requestedStartAt = date.toISOString();
  }

  const targetChoice = getEditRequiredText(
    "targetChoice",
    "destino",
  );

  let targetKind = "";
  let targetContactMethodId: string | null = null;

  if (targetChoice === "business_page") {
    targetKind = "business_page";
  } else if (
    targetChoice.startsWith("contact:")
  ) {
    const contactId = targetChoice
      .slice("contact:".length)
      .trim();

    if (!contactId) {
      redirectAdEditError(
        campaignId,
        "El contacto seleccionado no es válido.",
      );
    }

    targetKind = "contact";
    targetContactMethodId = contactId;
  } else {
    redirectAdEditError(
      campaignId,
      "El destino seleccionado no es válido.",
    );
  }

  const imageUrl = getEditRequiredText(
    "imageUrl",
    "imagen",
  );

  const { error } = await supabase.rpc(
    "resubmit_ad_request",
    {
      p_campaign_id: campaignId,
      p_title: title,
      p_description:
        description || null,
      p_requested_days: requestedDays,
      p_start_mode: startMode,
      p_requested_start_at:
        requestedStartAt,
      p_target_kind: targetKind,
      p_target_contact_method_id:
        targetContactMethodId,
      p_image_url: imageUrl,
    },
  );

  if (error) {
    redirectAdEditError(
      campaignId,
      error.message ||
        "No se pudo reenviar el anuncio.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anuncios");
  revalidatePath(
    "/dashboard/admin/anuncios",
  );

  redirect(
    "/dashboard/anuncios?message=" +
      encodeURIComponent(
        "El anuncio fue corregido y enviado nuevamente a revisión.",
      ),
  );
}
