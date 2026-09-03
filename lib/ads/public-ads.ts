import { createClient } from "@/lib/supabase/server";

export type PublicAdCampaignType = "fixed_banner" | "interstitial";

export type PublicAdAssetType = "image" | "video";

export type PublicAdPlacement =
  | "home"
  | "negocios"
  | "productos"
  | "noticias"
  | "clima"
  | "business_profile";

type PublicAdRpcRow = {
  campaign_id: string;
  campaign_type: PublicAdCampaignType;
  title: string;
  description: string | null;
  target_label: string | null;
  target_url: string | null;
  advertiser_business_id: string | null;
  priority: number;
  probability_weight: number | string;
  asset_id: string;
  asset_type: PublicAdAssetType;
  asset_url: string;
  asset_alt_text: string | null;
  asset_sort_order: number;
  asset_duration_seconds: number | null;
};

export type PublicAdAsset = {
  id: string;
  type: PublicAdAssetType;
  url: string;
  altText: string;
  sortOrder: number;
  durationSeconds: number | null;
};

export type PublicAdCampaign = {
  id: string;
  type: PublicAdCampaignType;
  title: string;
  description: string | null;
  targetLabel: string;
  targetUrl: string | null;
  advertiserBusinessId: string | null;
  priority: number;
  probabilityWeight: number;
  assets: PublicAdAsset[];
};

export type PublicAdsResult = {
  ads: PublicAdCampaign[];
  error: string | null;
};

function toNumber(value: number | string) {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function groupPublicAds(rows: PublicAdRpcRow[]) {
  const campaigns = new Map<string, PublicAdCampaign>();

  for (const row of rows) {
    const existingCampaign = campaigns.get(row.campaign_id);

    const asset: PublicAdAsset = {
      id: row.asset_id,
      type: row.asset_type,
      url: row.asset_url,
      altText: row.asset_alt_text ?? row.title,
      sortOrder: row.asset_sort_order,
      durationSeconds: row.asset_duration_seconds,
    };

    if (existingCampaign) {
      existingCampaign.assets.push(asset);
      continue;
    }

    campaigns.set(row.campaign_id, {
      id: row.campaign_id,
      type: row.campaign_type,
      title: row.title,
      description: row.description,
      targetLabel: row.target_label ?? "Ver promocion",
      targetUrl: row.target_url,
      advertiserBusinessId: row.advertiser_business_id,
      priority: row.priority,
      probabilityWeight: toNumber(row.probability_weight),
      assets: [asset],
    });
  }

  return Array.from(campaigns.values()).map((campaign) => ({
    ...campaign,
    assets: campaign.assets.sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

export async function getPublicAds(params: {
  placement: PublicAdPlacement;
  currentBusinessId?: string | null;
  includeInterstitial?: boolean;
}): Promise<PublicAdsResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_ads", {
    requested_placement: params.placement,
    current_business_id: params.currentBusinessId ?? null,
    include_interstitial: params.includeInterstitial ?? false,
  });

  if (error) {
    return {
      ads: [],
      error: error.message,
    };
  }

  const rows = (data ?? []) as unknown as PublicAdRpcRow[];

  return {
    ads: groupPublicAds(rows),
    error: null,
  };
}
