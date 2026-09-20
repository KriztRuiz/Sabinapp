import type { Metadata } from "next";
import { FixedAdBanner } from "@/components/ads/fixed-ad-banner";
import { PublicInterstitial } from "@/components/ads/public-interstitial";
import { createClient } from "@/lib/supabase/server";
import { getPublicStorageUrl } from "@/lib/storage/public-storage-url";
import { getPublicAds } from "@/lib/ads/public-ads";
import { textMatchesSearch } from "@/lib/search/local-search";
import Link from "next/link";


export const metadata: Metadata = {
  title: "Productos y servicios locales | Sabinapp",
  description:
    "Consulta productos, servicios, menús, paquetes y destacados de negocios publicados en Sabinas Hidalgo.",
  openGraph: {
    title: "Productos y servicios locales | Sabinapp",
    description:
      "Vitrina pública de productos, servicios y destacados locales.",
    type: "website",
  },
};


type PageProps = {
  searchParams: Promise<{
    q?: string;
    tipo?: string;
  }>;
};

type BusinessRelation = {
  name: string;
  slug: string;
};

type FilterOption = {
  label: string;
  value: string;
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
  image_storage_bucket: string | null;
  image_storage_path: string | null;
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

  const searchableText = [
    item.name,
    item.description ?? "",
    getItemTypeLabel(item.type),
    business?.name ?? "",
  ].join(" ");

  return textMatchesSearch(searchableText, query);
}

function itemMatchesType(item: ProductRow, selectedType: string) {
  if (!selectedType) {
    return true;
  }

  return item.type === selectedType;
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
  const selectedType = String(params.tipo ?? "").trim();

  const publicInterstitialEnabled =
    process.env.SABINAPP_INTERSTITIAL_PUBLIC_ENABLED === "true";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();

  const adsResult = await getPublicAds({
    placement: "productos",
    includeInterstitial: publicInterstitialEnabled,
  });

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
      image_storage_bucket,
      image_storage_path,
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
    .eq("businesses.is_adult_content", false)
    .eq("businesses.show_in_search", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`, {
      foreignTable: "businesses",
    })
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(80);

  const allItems = ((data ?? []) as unknown as ProductRow[]).map(
    (item) => ({
      ...item,
      image_url: getPublicStorageUrl({
        bucket: item.image_storage_bucket,
        path: item.image_storage_path,
        legacyUrl: item.image_url,
      }),
    }),
  );

  const itemTypeOptions = getUniqueOptions(
    allItems.map((item) => ({
      label: getItemTypeLabel(item.type),
      value: item.type,
    })),
  );

  const items = allItems.filter(
    (item) => itemMatchesSearch(item, query) && itemMatchesType(item, selectedType),
  );

  const hasFilters = Boolean(query || selectedType);

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-sky-50 px-6 py-10 text-gray-950">
      <PublicInterstitial
        ads={adsResult.ads}
        enabled={publicInterstitialEnabled}
        viewerId={user?.id ?? null}
      />
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
          <form className="grid gap-3 lg:grid-cols-[1.5fr_1fr_auto_auto]">
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

            <label className="sr-only" htmlFor="product-type-filter">
              Filtrar por tipo
            </label>

            <select
              id="product-type-filter"
              name="tipo"
              defaultValue={selectedType}
              className="min-h-12 rounded-2xl border border-gray-300 bg-white px-4 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Todos los tipos</option>

              {itemTypeOptions.map((option) => (
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
                href="/productos"
                className="rounded-2xl border border-gray-300 px-6 py-3 text-center text-sm font-black text-gray-800 transition hover:bg-gray-50"
              >
                Limpiar
              </Link>
            ) : null}
          </form>

          {hasFilters ? (
            <p className="mt-4 text-sm font-semibold text-gray-500">
              Filtros activos. Puedes combinar texto y tipo de producto o
              servicio.
            </p>
          ) : null}
        </section>

        <section className="mt-8">
          <FixedAdBanner ads={adsResult.ads} heading="Promoción local" />
        </section>

        {error ? (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h2 className="text-xl font-black">
              No se pudieron cargar los productos
            </h2>

            <p className="mt-2 text-sm">
              Intenta de nuevo más tarde. Si el problema continúa, revisaremos
              la vitrina de productos y servicios.
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

                {hasFilters ? (
                  <Link
                    href="/productos"
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
