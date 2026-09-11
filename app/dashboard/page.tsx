// app/dashboard/page.tsx

import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type RoleRow = {
  roles: {
    key: string;
    name: string;
  } | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_published: boolean;
};

type PendingChangeEventRow = {
  business_id: string | null;
  business_slug_snapshot: string | null;
};

type NewsCandidateSummaryRow = {
  status: string;
};

type AdCampaignSummaryRow = {
  status: string;
};

type OwnerAdSummaryRow = {
  id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  correction_requested_at: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para entrar al panel.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, birthdate, sex, privacy_accepted_at, profile_completed_at, status")
    .eq("id", user.id)
    .single();

  const isProfileComplete = Boolean(
    profile?.full_name?.trim() &&
      profile.birthdate &&
      profile.sex &&
      profile.privacy_accepted_at &&
      profile.profile_completed_at,
  );

  const { data: roleRowsRaw } = await supabase
    .from("user_roles")
    .select("roles(key, name)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const roleRows = (roleRowsRaw ?? []) as unknown as RoleRow[];

  const { data: businessesRaw } = await supabase
    .from("businesses")
    .select("id, name, slug, status, is_published")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const businesses = (businessesRaw ?? []) as BusinessRow[];
  const businessIds = businesses.map((business) => business.id);

  let ownerAds: OwnerAdSummaryRow[] = [];

  if (businessIds.length > 0) {
    const { data: ownerAdsRaw } = await supabase
      .from("ad_campaigns")
      .select(
        "id, status, starts_at, ends_at, correction_requested_at",
      )
      .in("advertiser_business_id", businessIds)
      .order("created_at", { ascending: false });

    ownerAds = (ownerAdsRaw ?? []) as OwnerAdSummaryRow[];
  }

  const { data: canReviewBusinesses } = await supabase.rpc("has_permission", {
    permission_key: "admin.review_businesses",
  });

  const { data: canManageAds } = await supabase.rpc("has_permission", {
    permission_key: "admin.manage_ads",
  });

  let pendingReviewCount = 0;
  let approvedWithoutPublishCount = 0;
  let pendingChangeEventsCount = 0;
  let pendingChangeBusinessesCount = 0;

  let pendingNewsCount = 0;
  let publishedNewsCount = 0;
  let discardedNewsCount = 0;

  let totalAdCampaigns = 0;
  let activeAdCampaigns = 0;
  let pausedAdCampaigns = 0;

  if (canReviewBusinesses) {
    const { count: pendingCount } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");

    const { count: approvedCount } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("is_published", false);

    const { data: pendingChangeEventsRaw } = await supabase
      .from("business_change_events")
      .select("business_id, business_slug_snapshot")
      .eq("review_status", "unseen");

    const pendingChangeEvents =
      (pendingChangeEventsRaw ?? []) as PendingChangeEventRow[];

    const pendingChangeBusinessKeys = pendingChangeEvents
      .map((event) => event.business_id ?? event.business_slug_snapshot)
      .filter((key): key is string => Boolean(key));

    pendingReviewCount = pendingCount ?? 0;
    approvedWithoutPublishCount = approvedCount ?? 0;
    pendingChangeEventsCount = pendingChangeEvents.length;
    pendingChangeBusinessesCount = new Set(pendingChangeBusinessKeys).size;

    const { data: newsCandidatesRaw } = await supabase
      .from("news_candidates")
      .select("status");

    const newsCandidates =
      (newsCandidatesRaw ?? []) as NewsCandidateSummaryRow[];

    pendingNewsCount = newsCandidates.filter((candidate) =>
      ["candidate", "needs_review", "approved"].includes(candidate.status),
    ).length;

    publishedNewsCount = newsCandidates.filter(
      (candidate) => candidate.status === "published",
    ).length;

    discardedNewsCount = newsCandidates.filter((candidate) =>
      ["rejected", "duplicate"].includes(candidate.status),
    ).length;
  }

  if (canManageAds) {
    const { data: adCampaignsRaw } = await supabase
      .from("ad_campaigns")
      .select("status");

    const adCampaigns =
      (adCampaignsRaw ?? []) as AdCampaignSummaryRow[];

    totalAdCampaigns = adCampaigns.length;

    activeAdCampaigns = adCampaigns.filter(
      (campaign) => campaign.status === "active",
    ).length;

    pausedAdCampaigns = adCampaigns.filter(
      (campaign) => campaign.status === "paused",
    ).length;
  }

  const totalBusinesses = businesses.length;

  const publishedBusinesses = businesses.filter(
    (business) => business.is_published,
  ).length;

  const unpublishedBusinesses = totalBusinesses - publishedBusinesses;

  const draftBusinesses = businesses.filter(
    (business) => business.status === "draft",
  ).length;

  const ownerAdsPendingReview = ownerAds.filter(
    (campaign) => campaign.status === "pending_review",
  ).length;

  const ownerAdsChangesRequested = ownerAds.filter(
    (campaign) =>
      campaign.status === "draft" &&
      Boolean(campaign.correction_requested_at),
  ).length;

  const ownerAdsActive = ownerAds.filter(
    (campaign) => campaign.status === "active",
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-orange-600">Sabinapp</p>

          <h1 className="mt-2 text-3xl font-bold text-gray-950">
            Panel principal
          </h1>

          <p className="mt-2 max-w-2xl text-gray-600">
            Administra tus negocios, revisa su estado y actualiza la información
            que aparece en sus negocios públicos.
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      {!isProfileComplete ? (
        <section className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-yellow-950">
            Completa tu perfil para participar
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-yellow-900">
            Necesitamos tu nombre completo, fecha de nacimiento, sexo y
            aceptación del aviso para reducir cuentas falsas y proteger la
            comunidad de Sabinapp.
          </p>

          <Link
            href="/dashboard/perfil"
            className="mt-5 inline-flex rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-700"
          >
            Completar perfil
          </Link>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Tu cuenta</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-gray-500">Correo</dt>
              <dd className="text-gray-950">{profile?.email ?? user.email}</dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Nombre</dt>
              <dd className="text-gray-950">
                {profile?.full_name || "Sin nombre registrado"}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-gray-500">Estado de cuenta</dt>
              <dd className="text-gray-950">{profile?.status ?? "active"}</dd>
            </div></dl>

          <Link
            href="/dashboard/perfil"
            className="mt-5 inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Ver o editar perfil
          </Link>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">Tus permisos</h2>

          <p className="mt-2 text-sm text-gray-600">
            Los permisos definen qué acciones puedes realizar dentro de
            Sabinapp.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {roleRows.length > 0 ? (
              roleRows.map((row) =>
                row.roles ? (
                  <span
                    key={row.roles.key}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800"
                  >
                    {row.roles.name}
                  </span>
                ) : null,
              )
            ) : (
              <p className="text-sm text-gray-600">Sin permisos especiales.</p>
            )}
          </div>
        </article>
      </section>

      {canReviewBusinesses || canManageAds ? (
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-100 pb-5">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-700">
              Administración
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-950">
              Centro administrativo
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Consulta el estado de las áreas administrativas y entra sólo a
              la sección que necesites atender.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {canReviewBusinesses ? (
              <article className="flex flex-col rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                    Moderación
                  </p>

                  <h3 className="mt-2 text-xl font-black text-gray-950">
                    Revisión de negocios
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    Revisa negocios enviados, publicaciones aprobadas y cambios
                    realizados por sus dueños.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Pendientes
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-950">
                      {pendingReviewCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Sin publicar
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-950">
                      {approvedWithoutPublishCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Cambios
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-950">
                      {pendingChangeEventsCount}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs font-semibold text-gray-600">
                  Cambios agrupados en {pendingChangeBusinessesCount} negocio
                  {pendingChangeBusinessesCount === 1 ? "" : "s"}.
                </p>

                <div className="mt-auto pt-5">
                  <Link
                    href="/dashboard/admin/negocios"
                    className="inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    Revisar negocios
                  </Link>
                </div>
              </article>
            ) : null}

            {canReviewBusinesses ? (
              <article className="flex flex-col rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                    Contenido local
                  </p>

                  <h3 className="mt-2 text-xl font-black text-gray-950">
                    Revisión de noticias
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    Revisa candidatos de noticias, controla qué contenido se
                    publica y consulta lo que ya fue descartado.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Pendientes
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-950">
                      {pendingNewsCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-green-700">
                      Publicadas
                    </p>
                    <p className="mt-1 text-2xl font-black text-green-950">
                      {publishedNewsCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Descartadas
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-950">
                      {discardedNewsCount}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <Link
                    href="/dashboard/admin/noticias"
                    className="inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                  >
                    Revisar noticias
                  </Link>
                </div>
              </article>
            ) : null}

            {canManageAds ? (
              <article className="flex flex-col rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                    Publicidad
                  </p>

                  <h3 className="mt-2 text-xl font-black text-gray-950">
                    Anuncios
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    Consulta campañas publicitarias y revisa rápidamente cuáles
                    están activas o pausadas.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Campañas
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-950">
                      {totalAdCampaigns}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-green-700">
                      Activas
                    </p>
                    <p className="mt-1 text-2xl font-black text-green-950">
                      {activeAdCampaigns}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-orange-700">
                      Pausadas
                    </p>
                    <p className="mt-1 text-2xl font-black text-orange-950">
                      {pausedAdCampaigns}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <Link
                    href="/dashboard/admin/anuncios"
                    className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
                  >
                    Administrar anuncios
                  </Link>
                </div>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">
              Publicidad
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-950">
              Promociona tus negocios
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
              Consulta tus anuncios, revisa su estado y da seguimiento a
              solicitudes, correcciones, pagos y publicaciones.
            </p>
          </div>

          <Link
            href="/dashboard/anuncios"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800"
          >
            Mis Anuncios
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl bg-white p-4">
            <p className="text-xs font-bold text-gray-500">Total</p>
            <p className="mt-1 text-2xl font-black text-gray-950">
              {ownerAds.length}
            </p>
          </article>

          <article className="rounded-2xl bg-white p-4">
            <p className="text-xs font-bold text-yellow-700">En revisión</p>
            <p className="mt-1 text-2xl font-black text-yellow-950">
              {ownerAdsPendingReview}
            </p>
          </article>

          <article className="rounded-2xl bg-white p-4">
            <p className="text-xs font-bold text-orange-700">Por corregir</p>
            <p className="mt-1 text-2xl font-black text-orange-950">
              {ownerAdsChangesRequested}
            </p>
          </article>

          <article className="rounded-2xl bg-white p-4">
            <p className="text-xs font-bold text-green-700">Activos</p>
            <p className="mt-1 text-2xl font-black text-green-950">
              {ownerAdsActive}
            </p>
          </article>
        </div>

        {publishedBusinesses === 0 ? (
          <p className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-violet-900">
            Necesitas al menos un negocio publicado para solicitar publicidad.
          </p>
        ) : null}
      </section>

      <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">
              Tus negocios
            </p>

            <h2 className="mt-2 text-2xl font-black text-gray-950">
              Resumen de negocios
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Consulta el estado general de los negocios asociados a tu cuenta.
              Para editar, revisar o administrar uno en particular, entra a la
              sección completa de negocios.
            </p>
          </div>

          <Link
            href="/dashboard/negocios"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
          >
            Ver todos los negocios
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-500">
              Total
            </p>

            <p className="mt-2 text-3xl font-black text-gray-950">
              {totalBusinesses}
            </p>
          </article>

          <article className="rounded-2xl bg-green-50 p-5">
            <p className="text-sm font-semibold text-green-800">
              Publicados
            </p>

            <p className="mt-2 text-3xl font-black text-green-950">
              {publishedBusinesses}
            </p>
          </article>

          <article className="rounded-2xl bg-orange-50 p-5">
            <p className="text-sm font-semibold text-orange-800">
              No publicados
            </p>

            <p className="mt-2 text-3xl font-black text-orange-950">
              {unpublishedBusinesses}
            </p>
          </article>

          <article className="rounded-2xl bg-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-600">
              Borradores
            </p>

            <p className="mt-2 text-3xl font-black text-gray-950">
              {draftBusinesses}
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
