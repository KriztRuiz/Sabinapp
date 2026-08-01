import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type CategoryRelation = {
  name: string;
};

type BusinessTypeRelation = {
  name: string;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  categories: CategoryRelation | CategoryRelation[] | null;
  business_types: BusinessTypeRelation | BusinessTypeRelation[] | null;
};

function firstRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function businessMatchesSearch(business: BusinessRow, query: string) {
  if (!query) {
    return true;
  }

  const category = firstRelation(business.categories);
  const businessType = firstRelation(business.business_types);

  const searchableText = normalizeSearchText(
    [
      business.name,
      business.short_description ?? "",
      category?.name ?? "",
      businessType?.name ?? "",
    ].join(" "),
  );

  return searchableText.includes(normalizeSearchText(query));
}

export default async function PublicBusinessesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      categories (
        name
      ),
      business_types (
        name
      )
    `,
    )
    .eq("status", "published")
    .eq("is_published", true)
    .order("name", { ascending: true });

  const businesses = ((data ?? []) as unknown as BusinessRow[]).filter(
    (business) => businessMatchesSearch(business, query),
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-sky-50 px-6 py-10 text-gray-950">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-orange-100 pb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            ← Volver a Sabinapp
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-orange-700">
            Directorio local
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                Negocios de Sabinas Hidalgo
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-gray-600">
                Explora negocios locales publicados en Sabinapp. Busca por
                nombre, giro, categoría o descripción.
              </p>
            </div>

            <Link
              href="/auth/sign-up"
              className="w-fit rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Crear cuenta
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <form className="flex flex-col gap-3 md:flex-row">
            <label className="sr-only" htmlFor="business-search">
              Buscar negocios
            </label>

            <input
              id="business-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Buscar tacos, climas, contador, abarrotes..."
              className="min-h-12 flex-1 rounded-2xl border border-gray-300 px-4 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <button
              type="submit"
              className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-700"
            >
              Buscar
            </button>

            {query ? (
              <Link
                href="/negocios"
                className="rounded-2xl border border-gray-300 px-6 py-3 text-center text-sm font-black text-gray-800 transition hover:bg-gray-50"
              >
                Limpiar
              </Link>
            ) : null}
          </form>
        </section>

        {error ? (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h2 className="text-xl font-black">
              No se pudieron cargar los negocios
            </h2>

            <p className="mt-2 text-sm">
              Revisa la conexión con Supabase y las políticas de lectura pública
              de negocios publicados.
            </p>
          </section>
        ) : null}

        {!error ? (
          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <h2 className="text-2xl font-black">
                {query
                  ? `Resultados para “${query}”`
                  : "Negocios disponibles"}
              </h2>

              <p className="text-sm font-semibold text-gray-500">
                {businesses.length} resultado
                {businesses.length === 1 ? "" : "s"}
              </p>
            </div>

            {businesses.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => {
                  const category = firstRelation(business.categories);
                  const businessType = firstRelation(business.business_types);

                  return (
                    <Link
                      key={business.id}
                      href={`/negocio/${business.slug}`}
                      className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-100 text-2xl transition group-hover:bg-orange-600 group-hover:text-white">
                          🏪
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                          {category?.name ?? "Negocio local"}
                        </span>
                      </div>

                      <h3 className="mt-5 text-2xl font-black">
                        {business.name}
                      </h3>

                      <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                        {businessType?.name ?? "Comercio local"}
                      </p>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                        {business.short_description ??
                          "Conoce más sobre este negocio local."}
                      </p>

                      <p className="mt-5 text-sm font-black text-orange-700">
                        Ver negocio →
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <article className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-white p-8">
                <h3 className="text-2xl font-black">
                  No encontramos negocios con esa búsqueda
                </h3>

                <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                  Intenta con otra palabra más general, por ejemplo “comida”,
                  “servicio”, “tacos”, “climas” o “abarrotes”.
                </p>
              </article>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
