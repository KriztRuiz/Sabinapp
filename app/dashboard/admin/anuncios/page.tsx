import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { ConfirmAdminActionButton } from "@/app/dashboard/admin/negocios/confirm-admin-action-button";
import {
  activateAdCampaign,
  approveAdRequestAction,
  pauseAdCampaign,
  rejectAdPaymentAction,
  rejectAdRequestAction,
  requestAdChangesAction,
  verifyAdPaymentAction,
} from "./actions";

type PageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type AdAssetRow = {
  id: string;
  campaign_id: string;
  asset_type: string;
  url: string;
  is_active: boolean;
  sort_order: number | null;
};

type AdCampaignRow = {
  id: string;
  advertiser_business_id: string | null;
  title: string;
  description: string | null;
  campaign_type: string;
  status: string;
  price_mxn: number | string | null;

  requested_days: number | null;
  daily_price_mxn: number | string | null;

  start_mode: string;
  requested_start_at: string | null;

  starts_at: string | null;
  ends_at: string | null;

  target_kind: string | null;
  target_label: string | null;
  target_url: string | null;

  correction_requested_at: string | null;
  correction_notes: string | null;
  rejection_reason: string | null;

  submitted_at: string | null;
  reviewed_at: string | null;

  created_at: string;
};

type AdPaymentRow = {
  campaign_id: string;
  payment_reference: string;
  expected_amount_mxn: number | string;
  status: string;

  reported_reference: string | null;
  reported_at: string | null;

  verified_at: string | null;

  admin_notes: string | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
};

type MetricRow = {
  campaign_id: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(date);
}

function formatMoney(amount: number | string | null) {
  if (amount === null) {
    return "Sin precio";
  }

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return `${amount} MXN`;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

function getCampaignTypeLabel(type: string) {
  const labels: Record<string, string> = {
    fixed_banner: "Anuncio",
    interstitial: "Anuncio emergente",
  };

  return labels[type] ?? type;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    pending_review: "Pendiente de revisión",
    approved: "Aprobado",
    active: "Activo",
    paused: "Pausado",
    expired: "Expirado",
    rejected: "Rechazado",
    archived: "Archivado",
  };

  return labels[status] ?? status;
}

function getStatusClasses(status: string) {
  const classes: Record<string, string> = {
    active: "bg-green-50 text-green-800",
    approved: "bg-blue-50 text-blue-800",
    pending_review: "bg-yellow-50 text-yellow-800",
    paused: "bg-orange-50 text-orange-800",
    draft: "bg-gray-100 text-gray-700",
    expired: "bg-gray-100 text-gray-700",
    rejected: "bg-red-50 text-red-800",
    archived: "bg-gray-200 text-gray-700",
  };

  return classes[status] ?? "bg-gray-100 text-gray-700";
}

function countByCampaign(rows: MetricRow[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.campaign_id, (map.get(row.campaign_id) ?? 0) + 1);
  }

  return map;
}

function calculateCtr(clicks: number, impressions: number) {
  if (impressions <= 0) {
    return "0%";
  }

  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

function getAssetsByCampaign(assets: AdAssetRow[]) {
  const map = new Map<string, AdAssetRow[]>();

  for (const asset of assets) {
    const currentAssets = map.get(asset.campaign_id) ?? [];
    currentAssets.push(asset);
    map.set(asset.campaign_id, currentAssets);
  }

  return map;
}

export default async function AdminAdsPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para revisar anuncios.");
  }

  const { data: canManageAds } = await supabase.rpc("has_permission", {
    permission_key: "admin.manage_ads",
  });

  if (!canManageAds) {
    redirect("/dashboard?error=No tienes permiso para administrar anuncios.");
  }

  const { data: campaignsRaw, error: campaignsError } = await supabase
    .from("ad_campaigns")
    .select(
      `
      id,
      advertiser_business_id,
      title,
      description,
      campaign_type,
      status,
      price_mxn,
      requested_days,
      daily_price_mxn,
      start_mode,
      requested_start_at,
      starts_at,
      ends_at,
      target_kind,
      target_label,
      target_url,
      correction_requested_at,
      correction_notes,
      rejection_reason,
      submitted_at,
      reviewed_at,
      created_at
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const campaigns = (campaignsRaw ?? []) as AdCampaignRow[];
  const campaignIds = campaigns.map((campaign) => campaign.id);

  let assets: AdAssetRow[] = [];
  let impressions: MetricRow[] = [];
  let clicks: MetricRow[] = [];
  let payments: AdPaymentRow[] = [];

  if (campaignIds.length > 0) {
    const { data: assetsRaw } = await supabase
      .from("ad_assets")
      .select("id, campaign_id, asset_type, url, is_active, sort_order")
      .in("campaign_id", campaignIds)
      .order("sort_order", { ascending: true });

    const { data: impressionsRaw } = await supabase
      .from("ad_impressions")
      .select("campaign_id")
      .in("campaign_id", campaignIds);

    const { data: clicksRaw } = await supabase
      .from("ad_clicks")
      .select("campaign_id")
      .in("campaign_id", campaignIds);

    const { data: paymentsRaw } = await supabase
      .from("ad_payments")
      .select(
        "campaign_id, payment_reference, expected_amount_mxn, status, reported_reference, reported_at, verified_at, admin_notes",
      )
      .in("campaign_id", campaignIds);

    assets = (assetsRaw ?? []) as AdAssetRow[];
    impressions = (impressionsRaw ?? []) as MetricRow[];
    clicks = (clicksRaw ?? []) as MetricRow[];
    payments = (paymentsRaw ?? []) as AdPaymentRow[];
  }

  const advertiserBusinessIds = Array.from(
    new Set(
      campaigns
        .map((campaign) => campaign.advertiser_business_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let businesses: BusinessRow[] = [];

  if (advertiserBusinessIds.length > 0) {
    const { data: businessesRaw } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .in("id", advertiserBusinessIds);

    businesses = (businessesRaw ?? []) as BusinessRow[];
  }

  const businessMap = new Map(businesses.map((business) => [business.id, business]));
  const assetsByCampaign = getAssetsByCampaign(assets);
  const impressionsByCampaign = countByCampaign(impressions);
  const clicksByCampaign = countByCampaign(clicks);

  const paymentByCampaign = new Map(
    payments.map((payment) => [
      payment.campaign_id,
      payment,
    ]),
  );

  const pendingReviewCampaigns = campaigns.filter(
    (campaign) =>
      campaign.status === "pending_review" &&
      campaign.requested_days !== null,
  ).length;

  const totalImpressions = impressions.length;
  const totalClicks = clicks.length;
  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "active",
  ).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          ← Volver al panel
        </Link>

        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-orange-700">
          Administración
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-950">
          Anuncios de Sabinapp
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
          Revisa solicitudes de anuncios, pagos, publicación, impresiones,
          clics y rendimiento básico.
        </p>
      </header>

      {query.message ? (
        <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          {query.message}
        </section>
      ) : null}

      {query.error ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {query.error}
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-5">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Anuncios</p>
          <p className="mt-2 text-3xl font-black text-gray-950">
            {campaigns.length}
          </p>
        </article>

        <article className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-yellow-800">
            En revisión
          </p>
          <p className="mt-2 text-3xl font-black text-yellow-950">
            {pendingReviewCampaigns}
          </p>
        </article>

        <article className="rounded-2xl border border-green-100 bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-800">Activas</p>
          <p className="mt-2 text-3xl font-black text-green-950">
            {activeCampaigns}
          </p>
        </article>

        <article className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-800">Impresiones</p>
          <p className="mt-2 text-3xl font-black text-orange-950">
            {totalImpressions}
          </p>
        </article>

        <article className="rounded-2xl border border-sky-100 bg-sky-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-sky-800">Clics</p>
          <p className="mt-2 text-3xl font-black text-sky-950">{totalClicks}</p>
          <p className="mt-1 text-sm font-semibold text-sky-800">
            CTR general: {calculateCtr(totalClicks, totalImpressions)}
          </p>
        </article>
      </section>

      {campaignsError ? (
        <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h2 className="text-xl font-black">
            No se pudieron cargar los anuncios
          </h2>

          <p className="mt-2 text-sm">
            {campaignsError.message}
          </p>
        </section>
      ) : null}

      {!campaignsError ? (
        <section className="mt-8 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-gray-950">
              Anuncios registrados
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Revisa nuevas solicitudes y administra anuncios que ya están
              publicados o en proceso de pago.
            </p>
          </div>

          {campaigns.length > 0 ? (
            <div className="grid gap-5">
              {campaigns.map((campaign) => {
                const business = campaign.advertiser_business_id
                  ? businessMap.get(campaign.advertiser_business_id)
                  : null;

                const campaignAssets = assetsByCampaign.get(campaign.id) ?? [];
                const activeAssets = campaignAssets.filter((asset) => asset.is_active);
                const campaignImpressions =
                  impressionsByCampaign.get(campaign.id) ?? 0;
                const campaignClicks = clicksByCampaign.get(campaign.id) ?? 0;
                const payment = paymentByCampaign.get(campaign.id);
                const isOwnerRequest = campaign.requested_days !== null;

                return (
                  <article
                    key={campaign.id}
                    className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                              campaign.status,
                            )}`}
                          >
                            {getStatusLabel(campaign.status)}
                          </span>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                            {getCampaignTypeLabel(campaign.campaign_type)}
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-black text-gray-950">
                          {campaign.title}
                        </h3>

                        {campaign.description ? (
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                            {campaign.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4 text-sm">
                        <p className="font-black text-gray-950">
                          {formatMoney(campaign.price_mxn)}
                        </p>

                        {campaign.requested_days ? (
                          <p className="mt-1 text-gray-600">
                            {campaign.requested_days} día
                            {campaign.requested_days === 1 ? "" : "s"} ·{" "}
                            {formatMoney(campaign.daily_price_mxn)} al día
                          </p>
                        ) : (
                          <p className="mt-1 text-gray-600">
                            Anuncio del modelo anterior
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl bg-orange-50 p-4">
                        <p className="text-sm font-semibold text-orange-800">
                          Impresiones
                        </p>
                        <p className="mt-1 text-2xl font-black text-orange-950">
                          {campaignImpressions}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-sky-50 p-4">
                        <p className="text-sm font-semibold text-sky-800">
                          Clics
                        </p>
                        <p className="mt-1 text-2xl font-black text-sky-950">
                          {campaignClicks}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-sm font-semibold text-gray-500">CTR</p>
                        <p className="mt-1 text-2xl font-black text-gray-950">
                          {calculateCtr(campaignClicks, campaignImpressions)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-sm font-semibold text-gray-500">
                          Assets activos
                        </p>
                        <p className="mt-1 text-2xl font-black text-gray-950">
                          {activeAssets.length}/{campaignAssets.length}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-gray-500">
                          Negocio anunciante
                        </dt>
                        <dd className="mt-1 text-gray-950">
                          {business ? (
                            <Link
                              href={`/negocio/${business.slug}`}
                              className="font-bold text-orange-700 hover:text-orange-800"
                            >
                              {business.name}
                            </Link>
                          ) : (
                            "Sin negocio asociado"
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-gray-500">
                          Vigencia
                        </dt>
                        <dd className="mt-1 text-gray-950">
                          {formatDate(campaign.starts_at)} —{" "}
                          {formatDate(campaign.ends_at)}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-gray-500">
                          Botón del anuncio
                        </dt>
                        <dd className="mt-1 text-gray-950">
                          {campaign.target_label ?? "Sin texto"}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-gray-500">Destino</dt>
                        <dd className="mt-1 break-all text-gray-950">
                          {campaign.target_url ? (
                            <a
                              href={campaign.target_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-orange-700 hover:text-orange-800"
                            >
                              {campaign.target_url}
                            </a>
                          ) : (
                            "Sin destino"
                          )}
                        </dd>
                      </div>
                    </dl>

                    {isOwnerRequest ? (
                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-violet-50 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">
                            Inicio solicitado
                          </p>

                          <p className="mt-2 text-sm font-bold text-violet-950">
                            {campaign.start_mode === "scheduled"
                              ? formatDate(campaign.requested_start_at)
                              : "Lo antes posible"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                            Pago
                          </p>

                          <p className="mt-2 text-sm font-bold text-blue-950">
                            {payment
                              ? payment.status === "verified"
                                ? "Verificado"
                                : payment.status === "reported"
                                  ? "Reportado"
                                  : payment.status === "rejected"
                                    ? "Pago rechazado"
                                    : payment.status === "refunded"
                                      ? "Reembolsado"
                                      : "Pendiente"
                              : "Todavía no generado"}
                          </p>

                          {payment ? (
                            <p className="mt-1 text-xs font-semibold text-blue-800">
                              {payment.payment_reference}
                            </p>
                          ) : null}
                        </div>

                        <div className="rounded-2xl bg-gray-50 p-4">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                            Vigencia real
                          </p>

                          <p className="mt-2 text-sm font-bold text-gray-950">
                            {campaign.starts_at
                              ? `${formatDate(campaign.starts_at)} — ${formatDate(
                                  campaign.ends_at,
                                )}`
                              : "Todavía no iniciada"}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {campaign.status === "pending_review" &&
                    isOwnerRequest ? (
                      <section className="mt-6 rounded-3xl border border-yellow-200 bg-yellow-50 p-5">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-700">
                            Revisión administrativa
                          </p>

                          <h4 className="mt-2 text-lg font-black text-yellow-950">
                            Decide qué hacer con esta solicitud
                          </h4>
                        </div>

                        <form
                          action={approveAdRequestAction}
                          className="mt-5"
                        >
                          <input
                            type="hidden"
                            name="campaignId"
                            value={campaign.id}
                          />

                          <ConfirmAdminActionButton
                            confirmMessage="¿Aprobar este anuncio? Se generará la referencia de pago, pero el anuncio todavía no se publicará."
                            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800"
                          >
                            Aprobar anuncio
                          </ConfirmAdminActionButton>
                        </form>

                        <div className="mt-5 grid gap-5 lg:grid-cols-2">
                          <form
                            action={requestAdChangesAction}
                            className="rounded-2xl border border-orange-200 bg-white p-4"
                          >
                            <input
                              type="hidden"
                              name="campaignId"
                              value={campaign.id}
                            />

                            <label className="block">
                              <span className="text-sm font-black text-orange-900">
                                Solicitar cambios
                              </span>

                              <textarea
                                name="notes"
                                required
                                minLength={3}
                                maxLength={2000}
                                rows={4}
                                placeholder="Explica qué debe corregir el dueño."
                                className="mt-2 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm text-gray-950"
                              />
                            </label>

                            <button
                              type="submit"
                              className="mt-3 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-700"
                            >
                              Enviar correcciones
                            </button>
                          </form>

                          <form
                            action={rejectAdRequestAction}
                            className="rounded-2xl border border-red-200 bg-white p-4"
                          >
                            <input
                              type="hidden"
                              name="campaignId"
                              value={campaign.id}
                            />

                            <label className="block">
                              <span className="text-sm font-black text-red-900">
                                Rechazar anuncio
                              </span>

                              <textarea
                                name="reason"
                                required
                                minLength={3}
                                maxLength={500}
                                rows={4}
                                placeholder="Indica el motivo definitivo del rechazo."
                                className="mt-2 w-full rounded-xl border border-red-200 px-3 py-2 text-sm text-gray-950"
                              />
                            </label>

                            <button
                              type="submit"
                              className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
                            >
                              Rechazar anuncio
                            </button>
                          </form>
                        </div>
                      </section>
                    ) : null}

                    {isOwnerRequest &&
                    campaign.status === "approved" &&
                    payment?.status === "reported" ? (
                      <section className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                          Verificación de pago
                        </p>

                        <h4 className="mt-2 text-lg font-black text-blue-950">
                          El dueño reportó una transferencia
                        </h4>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold text-gray-500">
                              Referencia Sabinapp
                            </p>

                            <p className="mt-1 font-black text-gray-950">
                              {payment.payment_reference}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold text-gray-500">
                              Monto esperado
                            </p>

                            <p className="mt-1 font-black text-gray-950">
                              {formatMoney(
                                payment.expected_amount_mxn,
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4">
                            <p className="text-xs font-bold text-gray-500">
                              Folio bancario
                            </p>

                            <p className="mt-1 break-all font-black text-gray-950">
                              {payment.reported_reference ??
                                "Sin folio"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-blue-900">
                          Reportado:{" "}
                          {formatDate(
                            payment.reported_at,
                          )}
                        </p>

                        <div className="mt-5 grid gap-5 lg:grid-cols-2">
                          <form
                            action={verifyAdPaymentAction}
                            className="rounded-2xl border border-green-200 bg-white p-4"
                          >
                            <input
                              type="hidden"
                              name="campaignId"
                              value={campaign.id}
                            />

                            <h5 className="font-black text-green-950">
                              Verificar transferencia
                            </h5>

                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              Confirma en tu banco que recibiste el monto correcto.
                              Al verificar, Sabinapp iniciará o programará la
                              vigencia del anuncio.
                            </p>

                            <label className="mt-4 block">
                              <span className="text-sm font-bold text-gray-700">
                                Observaciones opcionales
                              </span>

                              <textarea
                                name="adminNotes"
                                maxLength={2000}
                                rows={3}
                                placeholder="Opcional"
                                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950"
                              />
                            </label>

                            <div className="mt-4">
                              <ConfirmAdminActionButton
                                confirmMessage="¿Confirmas que verificaste esta transferencia? El anuncio quedará habilitado y comenzará su vigencia según la fecha contratada."
                                className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800"
                              >
                                Verificar pago
                              </ConfirmAdminActionButton>
                            </div>
                          </form>

                          <ConfirmActionForm
                            action={rejectAdPaymentAction}
                            className="rounded-2xl border border-red-200 bg-white p-4"
                            confirmMessage="¿Rechazar este reporte de pago? La campaña permanecerá sin activarse y el dueño tendrá que volver a reportar un pago válido."
                            confirmFieldName="paymentNotes"
                            confirmFieldLabel="Motivo"
                          >
                            <input
                              type="hidden"
                              name="campaignId"
                              value={campaign.id}
                            />

                            <h5 className="font-black text-red-950">
                              No se pudo verificar
                            </h5>

                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              Úsalo si no encuentras la transferencia, el monto
                              no coincide o los datos son incorrectos.
                            </p>

                            <label className="mt-4 block">
                              <span className="text-sm font-bold text-red-900">
                                Motivo
                              </span>

                              <textarea
                                name="paymentNotes"
                                required
                                minLength={3}
                                maxLength={2000}
                                rows={3}
                                placeholder="Ej. No encontramos una transferencia con este folio."
                                className="mt-2 w-full rounded-xl border border-red-200 px-3 py-2 text-sm text-gray-950"
                              />
                            </label>

                            <button
                              type="submit"
                              className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
                            >
                              Rechazar reporte
                            </button>
                          </ConfirmActionForm>
                        </div>
                      </section>
                    ) : null}

                    {campaign.status === "active" ? (
                      <form action={pauseAdCampaign} className="mt-5">
                        <input
                          type="hidden"
                          name="campaignId"
                          value={campaign.id}
                        />

                        <ConfirmAdminActionButton
                          confirmMessage="¿Pausar esta campaña? Dejará de mostrarse inmediatamente en Sabinapp."
                          className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
                        >
                          Pausar campaña
                        </ConfirmAdminActionButton>
                      </form>
                    ) : null}

                    {campaign.status === "paused" ? (
                      <form action={activateAdCampaign} className="mt-5">
                        <input
                          type="hidden"
                          name="campaignId"
                          value={campaign.id}
                        />

                        <ConfirmAdminActionButton
                          confirmMessage="¿Reactivar esta campaña? Volverá a mostrarse en las ubicaciones configuradas."
                          className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-800"
                        >
                          Reactivar campaña
                        </ConfirmAdminActionButton>
                      </form>
                    ) : null}

                    {campaignAssets.length > 0 ? (
                      <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-gray-500">
                          Archivos del anuncio
                        </p>

                        <div className="mt-3 grid gap-2">
                          {campaignAssets.map((asset) => (
                            <div
                              key={asset.id}
                              className="rounded-xl bg-white p-3 text-sm"
                            >
                              <p className="font-bold text-gray-950">
                                {asset.asset_type} ·{" "}
                                {asset.is_active ? "Activo" : "Inactivo"}
                              </p>

                              {asset.asset_type === "image" ? (
                                <div className="mt-3">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={asset.url}
                                    alt={`Imagen de ${campaign.title}`}
                                    className="max-h-72 w-full rounded-xl border border-gray-200 object-contain"
                                  />
                                </div>
                              ) : null}

                              <p className="mt-2 break-all text-gray-600">
                                {asset.url}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <article className="rounded-3xl border border-dashed border-orange-200 bg-white p-8">
              <h3 className="text-2xl font-black text-gray-950">
                Todavía no hay anuncios
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                Cuando existan solicitudes o anuncios, aparecerán aquí para
                revisión administrativa.
              </p>
            </article>
          )}
        </section>
      ) : null}
    </main>
  );
}
