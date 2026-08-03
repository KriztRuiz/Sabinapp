import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type BusinessRelation = {
  name: string;
  slug: string;
};

type ProductRow = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string | null;
  show_price: boolean;
  is_featured: boolean;
  image_url: string | null;
  image_alt: string | null;
  sort_order: number | null;
  businesses: BusinessRelation | BusinessRelation[] | null;
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

function getItemTypeLabel(type: string) {
  const labels: Record<string, string> = {
    menu_item: "Menú",
    product: "Producto",
    service: "Servicio",
    package: "Paquete",
    faq: "Pregunta frecuente",
    installation: "Instalación / amenidad",
    rule: "Regla",
    activity: "Actividad",
    other: "Otro",
  };

  return labels[type] ?? "Elemento";
}

function itemMatchesSearch(item: ProductRow, query: string) {
  if (!query) {
    return true;
  }

  const business = firstRelation(item.businesses);

  const searchableText = normalizeSearchText(
    [
      item.name,
      item.description ?? "",
      getItemTypeLabel(item.type),
      business?.name ?? "",
    ].join(" "),
  );

  return searchableText.includes(normalizeSearchText(query));
}

function formatPrice(
  price: ProductRow["price"],
  currency: string | null,
  showPrice: boolean,
) {
  if (!showPrice || price === null) {
    return null;
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return `${price} ${currency ?? "MXN"}`;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency ?? "MXN",
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

export default async function PublicProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_items")
    .select(
      `
      id,
      type,
      name,
      description,
      price,
      currency,
      show_price,
      is_featured,
      image_url,
      image_alt,
      sort_order,
      businesses!inner (
        name,
        slug
      )
    `,
    )
    .eq("is_active", true)
    .eq("businesses.status", "published")
    .eq("businesses.is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(80);

  const items = ((data ?? []) as unknown as ProductRow[]).filter((item) =>
    itemMatchesSearch(item, query),
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
            Vitrina local
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                Productos, servicios y destacados locales
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-gray-600">
                Explora opciones publicadas por negocios de Sabinas Hidalgo:
                productos, menús, servicios, paquetes, actividades y
                destacados.
              </p>
            </div>

            <Link
              href="/negocios"
              className="w-fit rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Ver negocios
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <form className="flex flex-col gap-3 md:flex-row">
            <label className="sr-only" htmlFor="product-search">
              Buscar productos o servicios
            </label>

            <input
              id="product-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Buscar tacos, combos, climas, servicios, paquetes..."
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
                href="/productos"
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
              No se pudieron cargar los productos
            </h2>

            <p className="mt-2 text-sm">
              Revisa la conexión con Supabase y las políticas de lectura pública
              de items activos en negocios publicados.
            </p>
          </section>
        ) : null}

        {!error ? (
          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <h2 className="text-2xl font-black">
                {query
                  ? `Resultados para “${query}”`
                  : "Opciones disponibles"}
              </h2>

              <p className="text-sm font-semibold text-gray-500">
                {items.length} resultado
                {items.length === 1 ? "" : "s"}
              </p>
            </div>

            {items.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const business = firstRelation(item.businesses);
                  const price = formatPrice(
                    item.price,
                    item.currency,
                    item.show_price,
                  );

                  return (
                    <Link
                      key={item.id}
                      href={business ? `/negocio/${business.slug}` : "#"}
                      className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                    >
                      <div className="relative h-52 bg-gradient-to-br from-orange-100 via-white to-sky-100">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.image_alt ?? item.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-center">
                            <div>
                              <p className="text-4xl">⭐</p>
                              <p className="mt-3 text-sm font-bold text-gray-500">
                                Sin imagen
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-gray-800 shadow-sm">
                            {getItemTypeLabel(item.type)}
                          </span>

                          {item.is_featured ? (
                            <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white shadow-sm">
                              Destacado
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-2xl font-black">{item.name}</h3>

                        {item.description ? (
                          <p className="mt-3 text-sm leading-6 text-gray-600">
                            {item.description}
                          </p>
                        ) : null}

                        {price ? (
                          <p className="mt-5 text-2xl font-black text-orange-700">
                            {price}
                          </p>
                        ) : null}

                        <p className="mt-4 text-sm font-bold text-gray-500">
                          {business?.name ?? "Negocio local"}
                        </p>

                        <p className="mt-5 text-sm font-black text-orange-700">
                          Ver negocio →
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <article className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-white p-8">
                <h3 className="text-2xl font-black">
                  No encontramos productos con esa búsqueda
                </h3>

                <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                  Intenta con otra palabra más general, por ejemplo “comida”,
                  “servicio”, “paquete”, “tacos”, “climas” o “combo”.
                </p>
              </article>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
