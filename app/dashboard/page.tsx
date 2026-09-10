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

function getBusinessStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    pending_review: "Pendiente de revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    published: "Publicado",
    hidden: "Retirado del público",
    suspended: "Suspendido",
    archived: "Archivado",
    expired: "Expirado",
  };

  return labels[status] ?? status;
}

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
  }

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

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">
          Administración de negocios
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Edita contenido, imágenes, menú, destacados, contactos, horarios y
          estilo visual de tus negocios públicos.
        </p>

        <Link
          href="/dashboard/negocios"
          className="mt-5 inline-flex rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Ir a mis negocios
        </Link>
      </section>

      {canReviewBusinesses ? (
        <section className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-700">
            Administración
          </p>

          <h2 className="mt-2 text-xl font-semibold text-gray-950">
            Revisión de negocios
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-gray-700">
            Revisa negocios enviados por dueños, aprueba contenido, publica
            negocios aprobados, oculta negocios visibles o rechaza registros que
            no cumplan los requisitos.
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-orange-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-600">
                Pendientes de revisión
              </p>

              <p className="mt-2 text-3xl font-black text-gray-950">
                {pendingReviewCount}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-600">
                Aprobados sin publicar
              </p>

              <p className="mt-2 text-3xl font-black text-gray-950">
                {approvedWithoutPublishCount}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-white p-4">
              <p className="text-sm font-bold text-gray-600">
                Cambios pendientes
              </p>

              <p className="mt-2 text-3xl font-black text-gray-950">
                {pendingChangeEventsCount}
              </p>

              <p className="mt-1 text-xs font-semibold text-gray-500">
                En {pendingChangeBusinessesCount} negocio
                {pendingChangeBusinessesCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/admin/negocios"
            className="inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Ir a revisión de negocios
          </Link>

            <Link
              href="/dashboard/admin/noticias"
              className="inline-flex rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-50"
            >
              Revisar noticias
            </Link>
          </div>
        </section>
      ) : null}

      {canManageAds ? (
        <section className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
            Administración
          </p>

          <h2 className="mt-2 text-xl font-semibold text-gray-950">
            Anuncios de Sabinapp
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-gray-700">
            Revisa campañas publicitarias, impresiones, clics, rendimiento y
            archivos visuales de anuncios activos o pausados.
          </p>

          <Link
            href="/dashboard/admin/anuncios"
            className="mt-5 inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Ir a anuncios
          </Link>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">Tus negocios</h2>

        <p className="mt-2 text-sm text-gray-600">
          Estos son los negocios asociados a tu cuenta.
        </p>

        <div className="mt-5 grid gap-3">
          {businesses.length > 0 ? (
            businesses.map((business) => (
              <article
                key={business.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-950">
                      {business.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      /negocio/{business.slug}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      Estado: {getBusinessStatusLabel(business.status)}
                    </span>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {business.is_published ? "Publicado" : "No publicado"}
                    </span>

                    <Link
                      href={`/dashboard/negocios/${business.id}/edit`}
                      className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 transition hover:bg-orange-200"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-gray-600">
              Todavía no tienes negocios registrados.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
