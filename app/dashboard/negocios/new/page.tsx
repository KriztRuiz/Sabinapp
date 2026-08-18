import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { NewBusinessForm } from "./new-business-form";

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

type CategoryRow = {
  id: string;
  business_type_id: string;
  name: string;
  slug: string;
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

  const { data: categoriesRaw, error: categoriesError } = await supabase
    .from("categories")
    .select("id, business_type_id, name, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const categories = (categoriesRaw ?? []) as CategoryRow[];

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

      {businessTypesError || categoriesError ? (
        <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h2 className="text-xl font-black">
            No se pudieron cargar los tipos de negocio
          </h2>

          <p className="mt-2 text-sm">
            Intenta de nuevo más tarde. Si el problema continúa, revisaremos las opciones de registro.
          </p>
        </section>
      ) : null}

      {canCreateBusiness && !businessTypesError && !categoriesError ? (
        <NewBusinessForm businessTypes={businessTypes} categories={categories} />
      ) : null}
    </main>
  );
}
