import { getPublicStorageUrl } from "@/lib/storage/public-storage-url";
import Link from "next/link";
import {
  redirect,
} from "next/navigation";
import {
  createClient,
} from "@/lib/supabase/server";
import {
  EditAdRequestForm,
  type EditAdContact,
} from "./edit-ad-request-form";

import {
  EditInterstitialAdRequestForm,
  type EditInterstitialAsset,
} from "./edit-interstitial-ad-request-form";

type PageProps = {
  params: Promise<{
    campaignId: string;
  }>;

  searchParams: Promise<{
    error?: string;
  }>;
};

type CampaignRow = {
  id: string;
  advertiser_business_id: string | null;

  title: string;
  description: string | null;

  campaign_type: string;
  status: string;

  requested_days: number | null;

  start_mode: string;
  requested_start_at: string | null;

  target_kind: string | null;
  target_contact_method_id: string | null;

  correction_requested_at: string | null;
  correction_notes: string | null;
};

type AssetRow = {
  id: string;
  asset_type: string;
  url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  is_active: boolean;
};

type ContactRow = {
  id: string;
  type: string;
  label: string;
  value: string;
  url: string | null;
  is_active: boolean;
  is_approved: boolean;
  sort_order: number | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  status: string;
  is_published: boolean;

  contact_methods:
    | ContactRow[]
    | null;
};

function isCompatibleContact(
  contact: ContactRow,
) {
  if (
    !contact.is_active ||
    !contact.is_approved
  ) {
    return false;
  }

  const explicitUrl =
    contact.url?.trim() ?? "";

  const value =
    contact.value.trim();

  if (
    explicitUrl.startsWith("http://") ||
    explicitUrl.startsWith("https://") ||
    explicitUrl.startsWith("tel:") ||
    explicitUrl.startsWith("mailto:")
  ) {
    return true;
  }

  if (
    [
      "phone",
      "email",
      "whatsapp",
    ].includes(contact.type)
  ) {
    return Boolean(value);
  }

  return (
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function toDateTimeLocal(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const formatter =
    new Intl.DateTimeFormat(
      "sv-SE",
      {
        timeZone:
          "America/Monterrey",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",

        hour: "2-digit",
        minute: "2-digit",

        hourCycle: "h23",
      },
    );

  const parts =
    formatter.formatToParts(date);

  const values =
    Object.fromEntries(
      parts.map((part) => [
        part.type,
        part.value,
      ]),
    );

  return (
    `${values.year}-` +
    `${values.month}-` +
    `${values.day}T` +
    `${values.hour}:` +
    `${values.minute}`
  );
}

export default async function EditOwnerAdPage({
  params,
  searchParams,
}: PageProps) {
  const { campaignId } =
    await params;

  const query =
    await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const {
    data: campaignRaw,
    error: campaignError,
  } = await supabase
    .from("ad_campaigns")
    .select(
      `
      id,
      advertiser_business_id,
      title,
      description,
      campaign_type,
      status,
      requested_days,
      start_mode,
      requested_start_at,
      target_kind,
      target_contact_method_id,
      correction_requested_at,
      correction_notes
      `,
    )
    .eq("id", campaignId)
    .single();

  const campaign =
    campaignRaw as CampaignRow | null;

  if (
    campaignError ||
    !campaign
  ) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "No se encontró el anuncio.",
        ),
    );
  }

  if (
    campaign.requested_days === null ||
    campaign.status !== "draft" ||
    !campaign.correction_requested_at ||
    !campaign.correction_notes
  ) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "Este anuncio no está disponible para correcciones.",
        ),
    );
  }

  if (
    !campaign.advertiser_business_id
  ) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "El anuncio no tiene un negocio válido.",
        ),
    );
  }

  const {
    data: businessRaw,
    error: businessError,
  } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      owner_id,
      status,
      is_published,
      contact_methods (
        id,
        type,
        label,
        value,
        url,
        is_active,
        is_approved,
        sort_order
      )
      `,
    )
    .eq(
      "id",
      campaign.advertiser_business_id,
    )
    .eq("owner_id", user.id)
    .eq("status", "published")
    .eq("is_published", true)
    .single();

  const business =
    businessRaw as unknown as
      | BusinessRow
      | null;

  if (
    businessError ||
    !business
  ) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "El negocio ya no está disponible para publicidad.",
        ),
    );
  }

  const {
    data: assetsRaw,
    error: assetsError,
  } = await supabase
    .from("ad_assets")
    .select(
      "id, asset_type, url, storage_bucket, storage_path, is_active",
    )
    .eq(
      "campaign_id",
      campaign.id,
    )
    .order(
      "sort_order",
      { ascending: true },
    );

  const assets =
    (assetsRaw ?? []) as AssetRow[];

  if (
    assetsError ||
    assets.length === 0
  ) {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "No se pudieron cargar los archivos del anuncio.",
        ),
    );
  }

  const resolvedAssets: Array<
    AssetRow & {
      public_url: string;
    }
  > = [];

  for (const asset of assets) {
    const publicUrl =
      getPublicStorageUrl({
        bucket:
          asset.storage_bucket,
        path:
          asset.storage_path,
        legacyUrl:
          asset.url,
      });

    if (!publicUrl) {
      redirect(
        "/dashboard/anuncios?error=" +
          encodeURIComponent(
            "Uno de los archivos del anuncio no tiene una URL válida.",
          ),
      );
    }

    resolvedAssets.push({
      ...asset,
      public_url: publicUrl,
    });
  }

  let currentImageUrl:
    string | null = null;

  let interstitialAssets:
    Array<
      AssetRow & {
        public_url: string;
      }
    > = [];

  if (
    campaign.campaign_type ===
    "fixed_banner"
  ) {
    if (
      resolvedAssets.length !== 1 ||
      resolvedAssets[0].asset_type !==
        "image"
    ) {
      redirect(
        "/dashboard/anuncios?error=" +
          encodeURIComponent(
            "No se pudo cargar la imagen del anuncio.",
          ),
      );
    }

    currentImageUrl =
      resolvedAssets[0].public_url;
  } else if (
    campaign.campaign_type ===
    "interstitial"
  ) {
    interstitialAssets =
      resolvedAssets.filter(
        (asset) =>
          asset.is_active,
      );

    const validImageMode =
      interstitialAssets.length >= 1 &&
      interstitialAssets.length <= 6 &&
      interstitialAssets.every(
        (asset) =>
          asset.asset_type ===
          "image",
      );

    const validVideoMode =
      interstitialAssets.length === 1 &&
      interstitialAssets[0]
        .asset_type === "video";

    const usesStorage =
      interstitialAssets.every(
        (asset) =>
          asset.storage_bucket ===
            "ad-assets" &&
          Boolean(
            asset.storage_path,
          ),
      );

    if (
      (
        !validImageMode &&
        !validVideoMode
      ) ||
      !usesStorage
    ) {
      redirect(
        "/dashboard/anuncios?error=" +
          encodeURIComponent(
            "Los archivos actuales de la campaña emergente no tienen una composición válida.",
          ),
      );
    }
  } else {
    redirect(
      "/dashboard/anuncios?error=" +
        encodeURIComponent(
          "El tipo de campaña no es compatible con este formulario.",
        ),
    );
  }

  const contacts: EditAdContact[] =
    (business.contact_methods ?? [])
      .filter(isCompatibleContact)
      .sort(
        (a, b) =>
          (a.sort_order ?? 0) -
          (b.sort_order ?? 0),
      )
      .map((contact) => ({
        id: contact.id,
        type: contact.type,
        label: contact.label,
        value: contact.value,
      }));

  let targetChoice =
    "business_page";

  if (
    campaign.target_kind ===
      "contact" &&
    campaign.target_contact_method_id
  ) {
    const contactStillExists =
      contacts.some(
        (contact) =>
          contact.id ===
          campaign.target_contact_method_id,
      );

    if (contactStillExists) {
      targetChoice =
        `contact:${campaign.target_contact_method_id}`;
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard/anuncios"
          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          ← Volver a Mis Anuncios
        </Link>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-orange-700">
          Corrección de anuncio
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-950">
          Corregir anuncio
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Realiza los cambios solicitados y vuelve a enviar el anuncio para revisión.
        </p>
      </header>

      {query.error ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {query.error}
        </section>
      ) : null}

      {campaign.campaign_type ===
      "interstitial" ? (
        <EditInterstitialAdRequestForm
          campaignId={campaign.id}
          businessId={business.id}
          businessName={business.name}
          title={campaign.title}
          description={
            campaign.description ?? ""
          }
          requestedDays={
            campaign.requested_days
          }
          startMode={
            campaign.start_mode
          }
          requestedStartAt={
            toDateTimeLocal(
              campaign.requested_start_at,
            )
          }
          targetChoice={
            targetChoice
          }
          contacts={contacts}
          correctionNotes={
            campaign.correction_notes
          }
          assets={
            interstitialAssets.map(
              (asset): EditInterstitialAsset => ({
                id: asset.id,
                assetType:
                  asset.asset_type === "video"
                    ? "video"
                    : "image",
                storagePath:
                  asset.storage_path as string,
                publicUrl:
                  asset.public_url,
              }),
            )
          }
        />
      ) : currentImageUrl ? (
        <EditAdRequestForm
          campaignId={campaign.id}
          businessName={
            business.name
          }
          title={campaign.title}
          description={
            campaign.description ?? ""
          }
          requestedDays={
            campaign.requested_days
          }
          startMode={
            campaign.start_mode
          }
          requestedStartAt={
            toDateTimeLocal(
              campaign.requested_start_at,
            )
          }
          targetChoice={
            targetChoice
          }
          imageUrl={
            currentImageUrl
          }
          contacts={contacts}
          correctionNotes={
            campaign.correction_notes
          }
        />
      ) : null}
    </main>
  );
}
