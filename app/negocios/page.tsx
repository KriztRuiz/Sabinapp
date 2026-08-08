import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Negocios locales | Sabinapp",
  description:
    "Explora negocios publicados de Sabinas Hidalgo por nombre, categoría, giro o descripción.",
  openGraph: {
    title: "Negocios locales | Sabinapp",
    description:
      "Directorio público de negocios de Sabinas Hidalgo, Nuevo León.",
    type: "website",
  },
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    tipo?: string;
    categoria?: string;
  }>;
};

type CategoryRelation = {
  name: string;
  slug: string;
};

type BusinessTypeRelation = {
  name: string;
  key: string;
};

type BusinessItemRelation = {
  name: string;
  description: string | null;
  is_active: boolean | null;
};

type TagRelation = {
  name: string;
};

type BusinessTagRelation = {
  tags: TagRelation | TagRelation[] | null;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  categories: CategoryRelation | CategoryRelation[] | null;
  business_types: BusinessTypeRelation | BusinessTypeRelation[] | null;
  business_items: BusinessItemRelation[] | null;
  business_tags: BusinessTagRelation[] | null;
};

type FilterOption = {
  label: string;
  value: string;
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

function getUniqueOptions(options: FilterOption[]) {
  const map = new Map<string, FilterOption>();

  for (const option of options) {
    if (!option.value || map.has(option.value)) {
      continue;
    }

    map.set(option.value, option);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "es-MX"),
  );
}

function buildBusinessesHref({
  query,
  selectedType,
  selectedCategory,
}: {
  query: string;
  selectedType: string;
  selectedCategory: string;
}) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (selectedType) {
    params.set("tipo", selectedType);
  }

  if (selectedCategory) {
    params.set("categoria", selectedCategory);
  }

  const queryString = params.toString();

  return queryString ? `/negocios?${queryString}` : "/negocios";
}

function getVisibleBusinessItems(business: BusinessRow) {
  return (business.business_items ?? [])
    .filter((item) => item.is_active !== false)
    .slice(0, 3);
}

function getVisibleBusinessTags(business: BusinessRow) {
  return (business.business_tags ?? [])
    .map((businessTag) => firstRelation(businessTag.tags)?.name ?? "")
    .filter(Boolean)
    .slice(0, 4);
}

function businessMatchesSearch(business: BusinessRow, query: string) {
  if (!query) {
    return true;
  }

  const category = firstRelation(business.categories);
  const businessType = firstRelation(business.business_types);

  const itemTexts = (business.business_items ?? [])
    .filter((item) => item.is_active !== false)
    .flatMap((item) => [item.name, item.description ?? ""]);

  const tagTexts = (business.business_tags ?? [])
    .map((businessTag) => firstRelation(businessTag.tags)?.name ?? "")
    .filter(Boolean);

  const searchableText = normalizeSearchText(
    [
      business.name,
      business.short_description ?? "",
      category?.name ?? "",
      businessType?.name ?? "",
      ...itemTexts,
      ...tagTexts,
    ].join(" "),
  );

  return searchableText.includes(normalizeSearchText(query));
}

function businessMatchesType(business: BusinessRow, selectedType: string) {
  if (!selectedType) {
    return true;
  }

  const businessType = firstRelation(business.business_types);

  return businessType?.key === selectedType;
}

function businessMatchesCategory(
  business: BusinessRow,
  selectedCategory: string,
) {
  if (!selectedCategory) {
    return true;
  }

  const category = firstRelation(business.categories);

  return category?.slug === selectedCategory;
}

export default async function PublicBusinessesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const selectedType = String(params.tipo ?? "").trim();
  const selectedCategory = String(params.categoria ?? "").trim();

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
        name,
        slug
      ),
      business_types (
        name,
        key
      ),
      business_items (
        name,
        description,
        is_active
      ),
      business_tags (
        tags (
          name
        )
      )
    `,
    )
    .eq("status", "published")
    .eq("is_published", true)
    .eq("is_adult_content", false)
    .eq("show_in_search", true)
    .eq("business_items.is_active", true)
    .or("expires_at.is.null,expires_at.gte.now()")
    .order("name", { ascending: true });

  const allBusinesses = (data ?? []) as unknown as BusinessRow[];

  const typeOptions = getUniqueOptions(
    allBusinesses
      .map((business) => firstRelation(business.business_types))
      .filter((businessType): businessType is BusinessTypeRelation =>
        Boolean(businessType),
      )
      .map((businessType) => ({
        label: businessType.name,
        value: businessType.key,
      })),
  );

  const categoryOptions = getUniqueOptions(
    allBusinesses
      .filter((business) => businessMatchesType(business, selectedType))
      .map((business) => firstRelation(business.categories))
      .filter((category): category is CategoryRelation => Boolean(category))
      .map((category) => ({
        label: category.name,
        value: category.slug,
      })),
  );

  const selectedCategoryIsAvailable =
    !selectedCategory ||
    categoryOptions.some((option) => option.value === selectedCategory);

  const effectiveSelectedCategory = selectedCategoryIsAvailable
    ? selectedCategory
    : "";

  const cleanFiltersHref = buildBusinessesHref({
    query,
    selectedType,
    selectedCategory: effectiveSelectedCategory,
  });

  const businesses = allBusinesses.filter(
    (business) =>
      businessMatchesSearch(business, query) &&
      businessMatchesType(business, selectedType) &&
      businessMatchesCategory(business, effectiveSelectedCategory),
  );

  const hasFilters = Boolean(query || selectedType || effectiveSelectedCategory);

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
          <form className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
            <label className="sr-only" htmlFor="business-search">
              Buscar negocios
            </label>

            <input
              id="business-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Buscar tacos, climas, contador, productos, servicios..."
              className="min-h-12 rounded-2xl border border-gray-300 px-4 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <label className="sr-only" htmlFor="business-type-filter">
              Filtrar por tipo
            </label>

            <select
              id="business-type-filter"
              name="tipo"
              defaultValue={selectedType}
              className="min-h-12 rounded-2xl border border-gray-300 bg-white px-4 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Todos los tipos</option>

              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="business-category-filter">
              Filtrar por categoría
            </label>

            <select
              id="business-category-filter"
              name="categoria"
              defaultValue={effectiveSelectedCategory}
              className="min-h-12 rounded-2xl border border-gray-300 bg-white px-4 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Todas las categorías</option>

              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-2xl bg-orange-600 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-700"
            >
              Buscar
            </button>

            {hasFilters ? (
              <Link
                href="/negocios"
                className="rounded-2xl border border-gray-300 px-6 py-3 text-center text-sm font-black text-gray-800 transition hover:bg-gray-50"
              >
                Limpiar
              </Link>
            ) : null}
          </form>

          {selectedCategory && !selectedCategoryIsAvailable ? (
            <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold text-yellow-900">
              La categoría seleccionada no corresponde al tipo elegido, así que
              se ignoró para evitar resultados incorrectos.

              <Link
                href={cleanFiltersHref}
                className="ml-2 underline underline-offset-4"
              >
                Actualizar URL limpia
              </Link>
            </div>
          ) : null}

          {hasFilters ? (
            <p className="mt-4 text-sm font-semibold text-gray-500">
              Filtros activos. Puedes combinarlos por texto, tipo y categoría.
            </p>
          ) : null}
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
                  const visibleItems = getVisibleBusinessItems(business);
                  const visibleTags = getVisibleBusinessTags(business);

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

                      {visibleTags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {visibleTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {visibleItems.length > 0 ? (
                        <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                            También encontrado por:
                          </p>

                          <ul className="mt-2 space-y-1">
                            {visibleItems.map((item) => (
                              <li
                                key={item.name}
                                className="line-clamp-1 text-sm font-semibold text-gray-700"
                              >
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

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

                {hasFilters ? (
                  <Link
                    href="/negocios"
                    className="mt-5 inline-flex rounded-2xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
                  >
                    Quitar filtros
                  </Link>
                ) : null}
              </article>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
