"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const SAFE_ADMIN_AD_RPC_MESSAGES = new Set([
  "Debes iniciar sesión para revisar anuncios.",
  "No tienes permiso para administrar anuncios.",
  "No se encontró el anuncio solicitado.",
  "Esta campaña pertenece al modelo anterior y no usa este flujo de revisión.",
  "Sólo pueden aprobarse anuncios pendientes de revisión.",
  "El negocio ya no está publicado y el anuncio no puede aprobarse.",
  "El negocio está vencido y el anuncio no puede aprobarse.",
  "El precio del anuncio no coincide con su duración.",
  "El precio diario del anuncio fijo no es válido.",
  "El anuncio fijo debe tener exactamente una imagen activa.",
  "El precio diario de la campaña emergente no es válido.",
  "La campaña emergente debe contener de 1 a 6 imágenes o exactamente un video.",
  "Uno o más archivos de la campaña emergente no cumplen las reglas de formato o tamaño.",
  "Este tipo de anuncio no puede aprobarse con este flujo.",
  "Este anuncio ya tiene un registro de pago.",
  "Debes iniciar sesión para verificar pagos.",
  "No tienes permiso para verificar pagos de anuncios.",
  "Las observaciones no pueden superar 2000 caracteres.",
  "No se encontró el anuncio.",
  "Este anuncio pertenece al modelo anterior.",
  "Sólo pueden activarse anuncios aprobados.",
  "El negocio ya no está publicado.",
  "El negocio está vencido.",
  "El tipo de campaña no puede activarse con este flujo.",
  "La campaña emergente ya no tiene una composición válida.",
  "No se encontró el pago del anuncio.",
  "El dueño todavía no ha reportado un pago pendiente de revisión.",
  "El monto del pago no coincide con el precio del anuncio.",
  "El anuncio programado no tiene una fecha de inicio válida.",
  "La fecha solicitada ya pasó. El dueño debe seleccionar una nueva fecha antes de verificar el pago.",
  "El modo de inicio del anuncio no es válido.",
]);

function getSafeAdminAdRpcErrorMessage(
  error: { code: string; message: string },
  fallback: string,
): string {
  if (
    error.code === "P0001" &&
    SAFE_ADMIN_AD_RPC_MESSAGES.has(error.message)
  ) {
    return error.message;
  }

  return fallback;
}

async function requireAdsAdminPermission() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: canManageAds } = await supabase.rpc(
    "has_permission",
    {
      permission_key: "admin.manage_ads",
    },
  );

  if (!canManageAds) {
    redirect("/dashboard");
  }

  return { supabase };
}

function redirectAdminAdsError(message: string): never {
  redirect(
    `/dashboard/admin/anuncios?error=${encodeURIComponent(
      message,
    )}`,
  );
}

function redirectAdminAdsSuccess(message: string): never {
  redirect(
    `/dashboard/admin/anuncios?message=${encodeURIComponent(
      message,
    )}`,
  );
}

function getCampaignId(formData: FormData) {
  const campaignId = String(
    formData.get("campaignId") ?? "",
  ).trim();

  if (!campaignId) {
    redirectAdminAdsError(
      "No se recibió el identificador del anuncio.",
    );
  }

  return campaignId;
}

function getRequiredNotes(
  formData: FormData,
  key: string,
  message: string,
) {
  const value = String(formData.get(key) ?? "").trim();

  if (value.length < 3) {
    redirectAdminAdsError(message);
  }

  return value;
}

function revalidateAdManagementPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/anuncios");
  revalidatePath("/dashboard/admin/anuncios");
}

function revalidatePublicAdPaths() {
  revalidatePath("/");
  revalidatePath("/negocios");
  revalidatePath("/productos");
  revalidatePath("/noticias");
  revalidatePath("/clima");
  revalidatePath("/negocio/[slug]", "page");
}

export async function approveAdRequestAction(
  formData: FormData,
) {
  const { supabase } = await requireAdsAdminPermission();
  const campaignId = getCampaignId(formData);

  const { data, error } = await supabase.rpc(
    "approve_ad_request",
    {
      p_campaign_id: campaignId,
    },
  );

  if (error) {
    redirectAdminAdsError(
      getSafeAdminAdRpcErrorMessage(
        error,
        "No se pudo aprobar el anuncio.",
      ),
    );
  }

  const payment = Array.isArray(data)
    ? data[0]
    : null;

  revalidateAdManagementPaths();

  if (payment?.payment_reference) {
    redirectAdminAdsSuccess(
      `Anuncio aprobado. Referencia de pago: ${payment.payment_reference}`,
    );
  }

  redirectAdminAdsSuccess(
    "Anuncio aprobado. Ya puede continuar al pago.",
  );
}

export async function requestAdChangesAction(
  formData: FormData,
) {
  const { supabase } = await requireAdsAdminPermission();
  const campaignId = getCampaignId(formData);

  const notes = getRequiredNotes(
    formData,
    "notes",
    "Escribe las correcciones que debe realizar el dueño.",
  );

  const { error } = await supabase.rpc(
    "request_ad_changes",
    {
      p_campaign_id: campaignId,
      p_notes: notes,
    },
  );

  if (error) {
    redirectAdminAdsError(
      getSafeAdminAdRpcErrorMessage(
        error,
        "No se pudieron solicitar las correcciones.",
      ),
    );
  }

  revalidateAdManagementPaths();

  redirectAdminAdsSuccess(
    "Se solicitaron correcciones al dueño.",
  );
}

export async function rejectAdRequestAction(
  formData: FormData,
) {
  const { supabase } = await requireAdsAdminPermission();
  const campaignId = getCampaignId(formData);

  const reason = getRequiredNotes(
    formData,
    "reason",
    "Escribe el motivo del rechazo.",
  );

  const { error } = await supabase.rpc(
    "reject_ad_request",
    {
      p_campaign_id: campaignId,
      p_reason: reason,
    },
  );

  if (error) {
    redirectAdminAdsError(
      getSafeAdminAdRpcErrorMessage(
        error,
        "No se pudo rechazar el anuncio.",
      ),
    );
  }

  revalidateAdManagementPaths();

  redirectAdminAdsSuccess(
    "El anuncio fue rechazado.",
  );
}

export async function pauseAdCampaign(
  formData: FormData,
) {
  const { supabase } = await requireAdsAdminPermission();
  const campaignId = getCampaignId(formData);

  const { data: campaign, error: campaignError } =
    await supabase
      .from("ad_campaigns")
      .select("id, status")
      .eq("id", campaignId)
      .single();

  if (campaignError || !campaign) {
    redirectAdminAdsError(
      "No se encontró el anuncio.",
    );
  }

  if (campaign.status !== "active") {
    redirectAdminAdsError(
      "Sólo se pueden pausar anuncios activos.",
    );
  }

  const { error } = await supabase
    .from("ad_campaigns")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  if (error) {
    redirectAdminAdsError(
      "No se pudo pausar el anuncio.",
    );
  }

  revalidateAdManagementPaths();
  revalidatePublicAdPaths();

  redirectAdminAdsSuccess(
    "Anuncio pausado correctamente.",
  );
}

export async function activateAdCampaign(
  formData: FormData,
) {
  const { supabase } = await requireAdsAdminPermission();
  const campaignId = getCampaignId(formData);

  const { data: campaign, error: campaignError } =
    await supabase
      .from("ad_campaigns")
      .select("id, status")
      .eq("id", campaignId)
      .single();

  if (campaignError || !campaign) {
    redirectAdminAdsError(
      "No se encontró el anuncio.",
    );
  }

  if (campaign.status !== "paused") {
    redirectAdminAdsError(
      "Sólo se pueden reactivar anuncios pausados.",
    );
  }

  const { error } = await supabase
    .from("ad_campaigns")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  if (error) {
    redirectAdminAdsError(
      "No se pudo reactivar el anuncio.",
    );
  }

  revalidateAdManagementPaths();
  revalidatePublicAdPaths();

  redirectAdminAdsSuccess(
    "Anuncio reactivado correctamente.",
  );
}


export async function verifyAdPaymentAction(
  formData: FormData,
) {
  const { supabase } =
    await requireAdsAdminPermission();

  const campaignId =
    getCampaignId(formData);

  const adminNotes = String(
    formData.get("adminNotes") ?? "",
  ).trim();

  if (adminNotes.length > 2000) {
    redirectAdminAdsError(
      "Las observaciones no pueden superar 2000 caracteres.",
    );
  }

  const { data, error } = await supabase.rpc(
    "verify_ad_payment",
    {
      p_campaign_id: campaignId,
      p_admin_notes:
        adminNotes || null,
    },
  );

  if (error) {
    redirectAdminAdsError(
      getSafeAdminAdRpcErrorMessage(
        error,
        "No se pudo verificar el pago.",
      ),
    );
  }

  const result =
    Array.isArray(data)
      ? data[0]
      : null;

  revalidateAdManagementPaths();
  revalidatePublicAdPaths();

  if (
    result?.starts_at &&
    result?.ends_at
  ) {
    redirectAdminAdsSuccess(
      "Pago verificado y anuncio habilitado correctamente.",
    );
  }

  redirectAdminAdsSuccess(
    "Pago verificado correctamente.",
  );
}

export async function rejectAdPaymentAction(
  formData: FormData,
) {
  const { supabase } =
    await requireAdsAdminPermission();

  const campaignId =
    getCampaignId(formData);

  const notes = getRequiredNotes(
    formData,
    "paymentNotes",
    "Explica por qué no se pudo verificar la transferencia.",
  );

  const { error } = await supabase.rpc(
    "reject_ad_payment",
    {
      p_campaign_id: campaignId,
      p_notes: notes,
    },
  );

  if (error) {
    redirectAdminAdsError(
      getSafeAdminAdRpcErrorMessage(
        error,
        "No se pudo rechazar el reporte de pago.",
      ),
    );
  }

  revalidateAdManagementPaths();

  redirectAdminAdsSuccess(
    "El reporte de pago fue rechazado.",
  );
}
