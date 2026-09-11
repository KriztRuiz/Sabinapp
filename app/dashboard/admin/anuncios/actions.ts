"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
      error.message ||
        "No se pudo aprobar el anuncio.",
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
      error.message ||
        "No se pudieron solicitar las correcciones.",
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
      error.message ||
        "No se pudo rechazar el anuncio.",
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
