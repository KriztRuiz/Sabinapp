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

  const { data: canManageAds } = await supabase.rpc("has_permission", {
    permission_key: "admin.manage_ads",
  });

  if (!canManageAds) {
    redirect("/dashboard");
  }

  return { supabase };
}

function getCampaignId(formData: FormData) {
  const campaignId = String(formData.get("campaignId") ?? "").trim();

  if (!campaignId) {
    redirect(
      "/dashboard/admin/anuncios?error=No%20se%20recibio%20la%20campana",
    );
  }

  return campaignId;
}

function revalidateAdPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/anuncios");

  revalidatePath("/");
  revalidatePath("/negocios");
  revalidatePath("/productos");
  revalidatePath("/noticias");
  revalidatePath("/clima");

  revalidatePath("/negocio/[slug]", "page");
}

export async function pauseAdCampaign(formData: FormData) {
  const { supabase } = await requireAdsAdminPermission();
  const campaignId = getCampaignId(formData);

  const { data: campaign, error: campaignError } = await supabase
    .from("ad_campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    redirect(
      "/dashboard/admin/anuncios?error=No%20se%20encontro%20la%20campana",
    );
  }

  if (campaign.status !== "active") {
    redirect(
      "/dashboard/admin/anuncios?error=Solo%20se%20pueden%20pausar%20campanas%20activas",
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
    redirect(
      "/dashboard/admin/anuncios?error=No%20se%20pudo%20pausar%20la%20campana",
    );
  }

  revalidateAdPaths();

  redirect(
    "/dashboard/admin/anuncios?message=Campana%20pausada%20correctamente",
  );
}

export async function activateAdCampaign(formData: FormData) {
  const { supabase } = await requireAdsAdminPermission();
  const campaignId = getCampaignId(formData);

  const { data: campaign, error: campaignError } = await supabase
    .from("ad_campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    redirect(
      "/dashboard/admin/anuncios?error=No%20se%20encontro%20la%20campana",
    );
  }

  if (campaign.status !== "paused") {
    redirect(
      "/dashboard/admin/anuncios?error=Solo%20se%20pueden%20reactivar%20campanas%20pausadas",
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
    redirect(
      "/dashboard/admin/anuncios?error=No%20se%20pudo%20reactivar%20la%20campana",
    );
  }

  revalidateAdPaths();

  redirect(
    "/dashboard/admin/anuncios?message=Campana%20reactivada%20correctamente",
  );
}
