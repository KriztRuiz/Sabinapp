import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { createBusinessFromDashboard } from "./actions";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type BusinessTypeRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  requires_start_end_dates: boolean;
  is_adult_related: boolean;
};

export default async function NewBusinessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?message=Inicia sesión para crear un negocio.");
  }

  const { data: canCreateBusiness } = await supabase.rpc("has_permission", {
    permission_key: "business.create",
  });

  const { data: businessTypesRaw, error: businessTypesError } = await supabase
    .from("business_types")
    .select(
      "id, key, name, description, requires_start_end_dates, is_adult_related",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const businessTypes = (businessTypesRaw ?? []) as BusinessTypeRow[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-gray-200 pb-6">
        <Link
          href="/dashboard/negocios"
          className="text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Volver a mis negocios
        </Link>

        <p className="mt-6 text-sm font-medium text-orange-600">Sabinapp</p>

        <h1 className="mt-2 text-3xl font-bold text-gray-950">
          Registrar nuevo negocio
        </h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          Crea el negocio como borrador. Después podrás agregar imágenes,
          contactos, horarios, ubicación, menú y enviarlo a revisión.
        </p>
      </header>

      {params.error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {params.error}
        </div>
      ) : null}

      {params.message ? (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
          {params.message}
        </div>
      ) : null}

      {!canCreateBusiness ? (
        <section className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900">
          <h2 className="text-xl font-black">No puedes crear negocios</h2>

          <p className="mt-2 text-sm">
            Tu cuenta no tiene el permiso business.create. Revisa tus roles o
            solicita acceso.
          </p>
        </section>
      ) : null}

      {businessTypesError ? (
        <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h2 className="text-xl font-black">
            No se pudieron cargar los tipos de negocio
          </h2>

          <p className="mt-2 text-sm">
            Revisa la tabla business_types y sus políticas RLS.
          </p>
        </section>
      ) : null}

      {canCreateBusiness && !businessTypesError ? (
        <form
          action={createBusinessFromDashboard}
          className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-bold text-gray-800"
              >
                Nombre del negocio
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder="Ejemplo: Tacos Don Pepe"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="text-sm font-bold text-gray-800"
              >
                Slug público opcional
              </label>

              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="ejemplo: tacos-don-pepe"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Si lo dejas vacío, se generará desde el nombre. Solo usa letras
                minúsculas, números y guiones.
              </p>
            </div>

            <div>
              <label
                htmlFor="businessTypeId"
                className="text-sm font-bold text-gray-800"
              >
                Tipo de negocio
              </label>

              <select
                id="businessTypeId"
                name="businessTypeId"
                required
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Selecciona un tipo</option>

                {businessTypes.map((businessType) => (
                  <option key={businessType.id} value={businessType.id}>
                    {businessType.name}
                    {businessType.requires_start_end_dates
                      ? " — temporal"
                      : ""}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Si eliges un tipo temporal, llena también las fechas.
              </p>
            </div>

            <div>
              <label
                htmlFor="shortDescription"
                className="text-sm font-bold text-gray-800"
              >
                Descripción corta
              </label>

              <textarea
                id="shortDescription"
                name="shortDescription"
                required
                minLength={10}
                maxLength={240}
                rows={3}
                placeholder="Describe brevemente qué ofrece el negocio."
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="longDescription"
                className="text-sm font-bold text-gray-800"
              >
                Descripción larga opcional
              </label>

              <textarea
                id="longDescription"
                name="longDescription"
                rows={5}
                placeholder="Agrega más detalles del negocio, historia, servicios o ventajas."
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h2 className="font-black text-gray-950">
                Fechas para negocios temporales
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Úsalas para ventas de temporada, eventos o actividades con fecha
                de inicio y fin. Para negocios permanentes, déjalas vacías.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startsAt"
                    className="text-sm font-bold text-gray-800"
                  >
                    Inicia
                  </label>

                  <input
                    id="startsAt"
                    name="startsAt"
                    type="date"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endsAt"
                    className="text-sm font-bold text-gray-800"
                  >
                    Termina
                  </label>

                  <input
                    id="endsAt"
                    name="endsAt"
                    type="date"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>
            </div>

            <label className="flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
              <input
                name="ownerConfirmedAuthorization"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 shrink-0"
              />

              <span>
                Confirmo que tengo autorización para registrar y administrar la
                información pública de este negocio en Sabinapp.
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              El negocio se guardará como borrador y no aparecerá públicamente.
            </p>

            <button
              type="submit"
              className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
            >
              Crear negocio
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
