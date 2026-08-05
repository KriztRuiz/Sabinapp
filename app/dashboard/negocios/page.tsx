// app/dashboard/negocios/page.tsx

import {
  getBusinessVisualMode,
  type BusinessSettingsRelation,
} from "@/lib/landing/business-settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_published: boolean;
  is_adult_content: boolean;
  show_in_search: boolean;
  expires_at: string | null;
  hidden_at: string | null;
  short_description: string;
  business_settings: BusinessSettingsRelation;
};

function getBusinessStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Borrador",
    pending_review: "Pendiente de revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    published: "Publicado",
    hidden: "Oculto",
    suspended: "Suspendido",
    archived: "Archivado",
    expired: "Expirado",
  };

  return labels[status] ?? status;
}

function getPublicVisibilityStatus(business: BusinessRow) {
  const isExpired = business.expires_at
    ? new Date(business.expires_at).getTime() < Date.now()
    : false;

  if (business.status === "pending_review") {
    return {
      label: "En revisión",
      detail: "Un administrador debe revisar este negocio antes de publicarlo.",
      canOpenPublicPage: false,
      badgeClass: "bg-yellow-100 text-yellow-800",
    };
  }

  if (business.status === "approved" && !business.is_published) {
    return {
      label: "Aprobado, falta publicar",
      detail: "El negocio ya fue aprobado, pero todavía no está publicado.",
      canOpenPublicPage: false,
      badgeClass: "bg-blue-100 text-blue-800",
    };
  }

  if (business.status === "rejected") {
    return {
      label: "Rechazado",
      detail: "El negocio fue rechazado. Revisa el motivo y vuelve a enviarlo.",
      canOpenPublicPage: false,
      badgeClass: "bg-red-100 text-red-800",
    };
  }

  if (business.status === "hidden" || business.hidden_at) {
    return {
      label: "Oculto",
      detail: "El negocio fue ocultado y no aparece públicamente.",
      canOpenPublicPage: false,
      badgeClass: "bg-gray-200 text-gray-800",
    };
  }

  if (business.status === "suspended") {
    return {
      label: "Suspendido",
      detail: "El negocio está suspendido y no aparece públicamente.",
      canOpenPublicPage: false,
      badgeClass: "bg-orange-100 text-orange-800",
    };
  }

  if (business.status === "archived") {
    return {
      label: "Archivado",
      detail: "El negocio está archivado y no aparece públicamente.",
      canOpenPublicPage: false,
      badgeClass: "bg-zinc-100 text-zinc-800",
    };
  }

  if (business.status === "expired" || isExpired) {
    return {
      label: "Vencido",
      detail: "El negocio está vencido. Debe renovarse o extender su vigencia.",
      canOpenPublicPage: false,
      badgeClass: "bg-purple-100 text-purple-800",
    };
  }

  if (!business.is_published || business.status !== "published") {
    return {
      label: "No publicado",
      detail: "El negocio todavía no está publicado.",
      canOpenPublicPage: false,
      badgeClass: "bg-gray-100 text-gray-700",
    };
  }

  if (business.is_adult_content) {
    return {
      label: "Contenido adulto",
      detail: "Los negocios con contenido adulto no aparecen en el directorio público general.",
      canOpenPublicPage: false,
      badgeClass: "bg-red-100 text-red-800",
    };
  }

  if (!business.show_in_search) {
    return {
      label: "Fuera de búsqueda",
      detail: "El negocio está publicado, pero no aparece en el directorio público.",
      canOpenPublicPage: false,
      badgeClass: "bg-slate-100 text-slate-800",
    };
  }

  return {
    label: "Visible públicamente",
    detail: "El negocio aparece en el directorio público.",
    canOpenPublicPage: true,
    badgeClass: "bg-green-100 text-green-800",
  };
}

export default async function DashboardBusinessesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para administrar negocios.");
  }

  const { data: businessesRaw, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      status,
      is_published,
      is_adult_content,
      show_in_search,
      expires_at,
      hidden_at,
      short_description,
      business_settings (
        visual_mode
      )
    `,
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-950">Mis negocios</h1>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar tus negocios. Intenta de nuevo.
        </div>
      </main>
    );
  }

  const businesses = (businessesRaw ?? []) as unknown as BusinessRow[];

  const { data: canCreateBusiness } = await supabase.rpc("has_permission", {
    permission_key: "business.create",
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Volver al menú principal
        </Link>

        <p className="mt-6 text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">Mis negocios</h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          Administra el contenido básico y el estilo visual de las landing pages
          públicas.
        </p>

        {canCreateBusiness ? (
          <Link
            href="/dashboard/negocios/new"
            className="mt-5 inline-flex rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Registrar nuevo negocio
          </Link>
        ) : null}
      </header>

      <section className="mt-8 grid gap-4">
        {businesses.length > 0 ? (
          businesses.map((business) => {
            const visualMode = getBusinessVisualMode(
              business.business_settings,
            );
            const publicVisibility = getPublicVisibilityStatus(business);

            return (
              <article
                key={business.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-950">
                      {business.name}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm text-gray-600">
                      {business.short_description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Estado: {getBusinessStatusLabel(business.status)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${publicVisibility.badgeClass}`}
                      >
                        {publicVisibility.label}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                        Estilo: {visualMode}
                      </span>
                    </div>

                    {!publicVisibility.canOpenPublicPage ? (
                      <p className="mt-3 max-w-2xl rounded-2xl bg-yellow-50 p-3 text-sm font-medium text-yellow-900">
                        {publicVisibility.detail}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                    <Link
                      href={`/dashboard/negocios/${business.id}/edit`}
                      className="rounded-lg bg-gray-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Editar landing
                    </Link>

                    {publicVisibility.canOpenPublicPage ? (
                      <Link
                        href={`/negocio/${business.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Ver pública
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
            Todavía no tienes negocios registrados.
          </div>
        )}
      </section>
    </main>
  );
}