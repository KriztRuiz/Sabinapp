import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { reportOwnerAdPayment } from "./actions";

import {
  OwnerAdMetrics,
  type OwnerAdMetric,
} from "@/components/ads/owner-ad-metrics";

type PageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_published: boolean;
};

type AdCampaignRow = {
  id: string;
  advertiser_business_id: string | null;
  title: string;
  status: string;
  price_mxn: number | string;
  requested_days: number | null;
  start_mode: string;
  requested_start_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  correction_requested_at: string | null;
  correction_notes: string | null;
  rejection_reason: string | null;
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

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin definir";
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

function getAdStatus(
  campaign: AdCampaignRow,
  payment: AdPaymentRow | undefined,
) {
  const now = Date.now();

  if (
    campaign.status === "draft" &&
    campaign.correction_requested_at
  ) {
    return {
      label: "Requiere correcciones",
      className: "bg-orange-100 text-orange-800",
    };
  }

  if (campaign.status === "pending_review") {
    return {
      label: "En revisión",
      className: "bg-yellow-100 text-yellow-800",
    };
  }

  if (campaign.status === "rejected") {
    return {
      label: "Rechazado",
      className: "bg-red-100 text-red-800",
    };
  }

  if (campaign.status === "approved") {
    if (payment?.status === "reported") {
      return {
        label: "Pago reportado",
        className: "bg-blue-100 text-blue-800",
      };
    }

    return {
      label: "Pendiente de pago",
      className: "bg-blue-100 text-blue-800",
    };
  }

  if (campaign.status === "paused") {
    return {
      label: "Pausado",
      className: "bg-orange-100 text-orange-800",
    };
  }

  if (campaign.status === "expired") {
    return {
      label: "Finalizado",
      className: "bg-gray-200 text-gray-700",
    };
  }

  if (campaign.status === "active") {
    const start = campaign.starts_at
      ? new Date(campaign.starts_at).getTime()
      : null;

    const end = campaign.ends_at
      ? new Date(campaign.ends_at).getTime()
      : null;

    if (start !== null && start > now) {
      return {
        label: "Programado",
        className: "bg-purple-100 text-purple-800",
      };
    }

    if (end !== null && end <= now) {
      return {
        label: "Finalizado",
        className: "bg-gray-200 text-gray-700",
      };
    }

    return {
      label: "Activo",
      className: "bg-green-100 text-green-800",
    };
  }

  return {
    label: campaign.status,
    className: "bg-gray-100 text-gray-700",
  };
}

export default async function DashboardAdsPage({
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para administrar anuncios.");
  }

  const { data: businessesRaw } = await supabase
    .from("businesses")
    .select("id, name, slug, status, is_published")
    .eq("owner_id", user.id)
    .order("name", { ascending: true });

  const businesses = (businessesRaw ?? []) as BusinessRow[];
  const businessIds = businesses.map((business) => business.id);

  let campaigns: AdCampaignRow[] = [];

  if (businessIds.length > 0) {
    const { data: campaignsRaw } = await supabase
      .from("ad_campaigns")
      .select(
        `
        id,
        advertiser_business_id,
        title,
        status,
        price_mxn,
        requested_days,
        start_mode,
        requested_start_at,
        starts_at,
        ends_at,
        correction_requested_at,
        correction_notes,
        rejection_reason,
        created_at
      `,
      )
      .in("advertiser_business_id", businessIds)
      .order("created_at", { ascending: false });

    campaigns = (campaignsRaw ?? []) as AdCampaignRow[];
  }

  const campaignIds = campaigns.map((campaign) => campaign.id);
  let payments: AdPaymentRow[] = [];

  if (campaignIds.length > 0) {
    const { data: paymentsRaw } = await supabase
      .from("ad_payments")
      .select(
        "campaign_id, payment_reference, expected_amount_mxn, status, reported_reference, reported_at, verified_at, admin_notes",
      )
      .in("campaign_id", campaignIds);

    payments = (paymentsRaw ?? []) as AdPaymentRow[];
  }

  // La RPC valida la propiedad mediante auth.uid().
  // No se consultan directamente ad_clicks ni
  // ad_impressions desde el dashboard del dueño.

  let metricsError: string | null = null;

  const metricsMap = new Map<
    string,
    OwnerAdMetric
  >();

  if (campaignIds.length > 0) {
    const {
      data: metricsRaw,
      error,
    } = await supabase.rpc(
      "get_owner_ad_metrics",
    );

    if (error) {
      metricsError = error.message;
    } else {
      const metrics =
        (metricsRaw ?? []) as OwnerAdMetric[];

      const allowedCampaignIds =
        new Set(campaignIds);

      for (const metric of metrics) {
        if (
          allowedCampaignIds.has(
            metric.campaign_id,
          )
        ) {
          metricsMap.set(
            metric.campaign_id,
            metric,
          );
        }
      }
    }
  }

  const businessMap = new Map(
    businesses.map((business) => [business.id, business]),
  );

  const paymentMap = new Map(
    payments.map((payment) => [payment.campaign_id, payment]),
  );

  const publishedBusinesses = businesses.filter(
    (business) =>
      business.status === "published" &&
      business.is_published,
  );

  const pendingReview = campaigns.filter(
    (campaign) => campaign.status === "pending_review",
  ).length;

  const changesRequested = campaigns.filter(
    (campaign) =>
      campaign.status === "draft" &&
      Boolean(campaign.correction_requested_at),
  ).length;

  const pendingPayment = campaigns.filter(
    (campaign) => campaign.status === "approved",
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          ← Volver al panel
        </Link>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-violet-700">
          Publicidad
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-950">
          Mis anuncios
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Consulta las solicitudes publicitarias de tus negocios y sigue su
          proceso de revisión, pago y publicación.
        </p>

        {publishedBusinesses.length > 0 ? (
          <Link
            href="/dashboard/anuncios/nuevo"
            className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-800"
          >
            Solicitar anuncio
          </Link>
        ) : null}
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

      {metricsError ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          No se pudieron cargar las estadísticas
          publicitarias. Inténtalo nuevamente
          más tarde.
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total</p>
          <p className="mt-2 text-3xl font-black text-gray-950">
            {campaigns.length}
          </p>
        </article>

        <article className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-yellow-800">
            En revisión
          </p>
          <p className="mt-2 text-3xl font-black text-yellow-950">
            {pendingReview}
          </p>
        </article>

        <article className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-800">
            Por corregir
          </p>
          <p className="mt-2 text-3xl font-black text-orange-950">
            {changesRequested}
          </p>
        </article>

        <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-800">
            Pendientes de pago
          </p>
          <p className="mt-2 text-3xl font-black text-blue-950">
            {pendingPayment}
          </p>
        </article>
      </section>

      {publishedBusinesses.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="font-black text-yellow-950">
            Necesitas un negocio publicado
          </h2>

          <p className="mt-2 text-sm text-yellow-900">
            Sólo los negocios publicados pueden solicitar publicidad.
          </p>

          <Link
            href="/dashboard/negocios"
            className="mt-4 inline-flex rounded-lg bg-yellow-700 px-4 py-2 text-sm font-bold text-white"
          >
            Ver mis negocios
          </Link>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-2xl font-black text-gray-950">
          Historial de anuncios
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Aquí aparecerán tus solicitudes y campañas anteriores.
        </p>

        <div className="mt-5 grid gap-4">
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => {
              const business = campaign.advertiser_business_id
                ? businessMap.get(campaign.advertiser_business_id)
                : undefined;

              const payment = paymentMap.get(campaign.id);
              const status = getAdStatus(campaign, payment);

              return (
                <article
                  key={campaign.id}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${status.className}`}
                      >
                        {status.label}
                      </span>

                      <h3 className="mt-3 text-xl font-black text-gray-950">
                        {campaign.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        {business?.name ?? "Negocio no disponible"}
                      </p>
                    </div>

                    <p className="text-xl font-black text-gray-950">
                      {formatMoney(campaign.price_mxn)}
                    </p>
                  </div>

                  <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-semibold text-gray-500">
                        Finaliza
                      </dt>
                      <dd className="mt-1 font-bold text-gray-950">
                        {formatDate(campaign.ends_at)}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-gray-500">
                        Inicio solicitado
                      </dt>
                      <dd className="mt-1 font-bold text-gray-950">
                        {campaign.start_mode === "scheduled"
                          ? formatDate(campaign.requested_start_at)
                          : "Lo antes posible"}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-gray-500">
                        Inicio
                      </dt>
                      <dd className="mt-1 font-bold text-gray-950">
                        {formatDate(campaign.starts_at)}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-gray-500">
                        Pago
                      </dt>
                      <dd className="mt-1 font-bold text-gray-950">
                        {payment
                          ? payment.status === "verified"
                            ? "Verificado"
                            : payment.status === "reported"
                              ? "Reportado"
                              : payment.status === "rejected"
                                ? "Reporte rechazado"
                                : payment.status === "refunded"
                                  ? "Reembolsado"
                                  : "Pendiente"
                          : campaign.requested_days
                            ? "Todavía no requerido"
                            : "Modelo anterior"}
                      </dd>
                    </div>
                  </dl>

                  {!metricsError ? (
                    <OwnerAdMetrics
                      metrics={
                        metricsMap.get(
                          campaign.id,
                        ) ?? null
                      }
                    />
                  ) : null}

                  {payment ? (
                    <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                            Referencia Sabinapp
                          </p>

                          <p className="mt-1 text-lg font-black">
                            {payment.payment_reference}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                            Monto
                          </p>

                          <p className="mt-1 text-lg font-black">
                            {formatMoney(payment.expected_amount_mxn)}
                          </p>
                        </div>
                      </div>

                      {payment.status === "pending" ||
                      payment.status === "rejected" ? (
                        <div className="mt-5 border-t border-blue-200 pt-5">
                          <h4 className="font-black text-blue-950">
                            Reportar transferencia SPEI
                          </h4>

                          <p className="mt-2 leading-6 text-blue-900">
                            Usa{" "}
                            <strong>
                              {payment.payment_reference}
                            </strong>{" "}
                            como concepto o referencia de la transferencia.
                            Después escribe aquí el folio o referencia que te
                            muestre tu banco.
                          </p>

                          {payment.status === "rejected" &&
                          payment.admin_notes ? (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
                              <p className="font-black">
                                El reporte anterior fue rechazado
                              </p>

                              <p className="mt-1">
                                {payment.admin_notes}
                              </p>
                            </div>
                          ) : null}

                          <ConfirmActionForm
                            action={reportOwnerAdPayment}
                            className="mt-4"
                            confirmMessage="¿Confirmas que deseas reportar este pago? Verifica que el folio de tu banco sea correcto antes de enviarlo a revisión."
                            confirmFieldName="reportedReference"
                            confirmFieldLabel="Folio bancario"
                          >
                            <input
                              type="hidden"
                              name="campaignId"
                              value={campaign.id}
                            />

                            <label className="block">
                              <span className="font-bold text-blue-950">
                                Folio o referencia de tu banco
                              </span>

                              <input
                                name="reportedReference"
                                type="text"
                                required
                                minLength={3}
                                maxLength={160}
                                defaultValue={
                                  payment.status === "rejected"
                                    ? payment.reported_reference ?? ""
                                    : ""
                                }
                                placeholder="Ej. 1234567890"
                                className="mt-2 w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-gray-950 sm:max-w-lg"
                              />
                            </label>

                            <button
                              type="submit"
                              className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-black text-white transition hover:bg-blue-800"
                            >
                              {payment.status === "rejected"
                                ? "Reportar pago nuevamente"
                                : "Reportar pago"}
                            </button>
                          </ConfirmActionForm>
                        </div>
                      ) : null}

                      {payment.status === "reported" ? (
                        <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-950">
                          <p className="font-black">
                            Pago reportado
                          </p>

                          <p className="mt-1">
                            Folio bancario:{" "}
                            {payment.reported_reference ??
                              "Sin referencia"}
                          </p>

                          <p className="mt-1 text-sm">
                            Estamos esperando que un administrador verifique la transferencia.
                          </p>
                        </div>
                      ) : null}

                      {payment.status === "verified" ? (
                        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-950">
                          <p className="font-black">
                            Pago verificado
                          </p>

                          <p className="mt-1">
                            Tu anuncio ya fue habilitado o quedó programado para su fecha de inicio.
                          </p>
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {campaign.correction_notes ? (
                    <div className="mt-5 rounded-2xl bg-orange-50 p-4 text-sm text-orange-950">
                      <p className="font-black">
                        Correcciones solicitadas
                      </p>

                      <p className="mt-2">
                        {campaign.correction_notes}
                      </p>
                    </div>
                  ) : null}

                  {campaign.status === "draft" &&
                  campaign.correction_requested_at ? (
                    <div className="mt-5">
                      <Link
                        href={`/dashboard/anuncios/${campaign.id}/editar`}
                        className="inline-flex rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700"
                      >
                        Corregir anuncio
                      </Link>
                    </div>
                  ) : null}

                  {campaign.rejection_reason ? (
                    <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-950">
                      <p className="font-black">Motivo de rechazo</p>
                      <p className="mt-2">
                        {campaign.rejection_reason}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <article className="rounded-3xl border border-dashed border-violet-200 bg-violet-50 p-8">
              <h3 className="text-xl font-black text-gray-950">
                Todavía no tienes anuncios
              </h3>

              <p className="mt-2 text-sm text-gray-700">
                Tus solicitudes publicitarias aparecerán aquí.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
