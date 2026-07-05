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
  short_description: string;
  business_settings: BusinessSettingsRelation;
};

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

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <p className="text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">Mis negocios</h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          Administra el contenido básico y el estilo visual de las landing pages
          públicas.
        </p>
      </header>

      <section className="mt-8 grid gap-4">
        {businesses.length > 0 ? (
          businesses.map((business) => {
            const visualMode = getBusinessVisualMode(
              business.business_settings,
            );

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
                        Estado: {business.status}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {business.is_published ? "Publicado" : "No publicado"}
                      </span>

                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                        Estilo: {visualMode}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                    <Link
                      href={`/dashboard/negocios/${business.id}/edit`}
                      className="rounded-lg bg-gray-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Editar landing
                    </Link>

                    {business.is_published ? (
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