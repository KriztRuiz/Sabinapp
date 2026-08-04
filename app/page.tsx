import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getSabinasWeather,
  getWeatherAdvice,
  getWeatherCodeLabel,
} from "@/lib/weather/sabinas-weather";


export const metadata: Metadata = {
  title: "Sabinapp | Directorio local de Sabinas Hidalgo",
  description:
    "Encuentra negocios, productos, servicios, noticias y clima de Sabinas Hidalgo, Nuevo León.",
  openGraph: {
    title: "Sabinapp | Directorio local de Sabinas Hidalgo",
    description:
      "Explora negocios, productos, servicios, noticias y clima de Sabinas Hidalgo.",
    type: "website",
  },
};


type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type LocalNewsRow = {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
};

type BusinessRelation = {
  name: string;
  slug: string;
};

type FeaturedProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string | null;
  show_price: boolean;
  businesses: BusinessRelation | BusinessRelation[] | null;
};

type CategoryRelation = {
  name: string;
};

type BusinessCardRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  categories: CategoryRelation | CategoryRelation[] | null;
};


type PortalStats = {
  businessesCount: number;
  productsCount: number;
  newsCount: number;
};

function firstRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function shuffleItems<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatPrice(
  price: FeaturedProductRow["price"],
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

async function getLatestNews(supabase: SupabaseServerClient) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("local_news")
    .select("id, title, summary, source_name, source_url, published_at")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    return [];
  }

  return (data ?? []) as LocalNewsRow[];
}

async function getFeaturedProducts(supabase: SupabaseServerClient) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("business_items")
    .select(
      `
      id,
      name,
      description,
      price,
      currency,
      show_price,
      businesses!inner (
        name,
        slug
      )
    `,
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .eq("businesses.status", "published")
    .eq("businesses.is_published", true)
    .eq("businesses.is_adult_content", false)
    .eq("businesses.show_in_search", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`, {
      foreignTable: "businesses",
    })
    .limit(30);

  if (error) {
    return [];
  }

  return shuffleItems((data ?? []) as unknown as FeaturedProductRow[]).slice(
    0,
    3,
  );
}

async function getPortalStats(
  supabase: SupabaseServerClient,
): Promise<PortalStats> {
  const now = new Date().toISOString();

  const [
    businessesResult,
    productsResult,
    newsResult,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("is_published", true)
      .eq("is_adult_content", false)
      .eq("show_in_search", true)
      .or(`expires_at.is.null,expires_at.gte.${now}`),

    supabase
      .from("business_items")
      .select("id, businesses!inner(id)", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("businesses.status", "published")
      .eq("businesses.is_published", true)
      .eq("businesses.is_adult_content", false)
      .eq("businesses.show_in_search", true)
      .or(`expires_at.is.null,expires_at.gte.${now}`, {
        foreignTable: "businesses",
      }),

    supabase
      .from("local_news")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${now}`),
  ]);

  return {
    businessesCount: businessesResult.count ?? 0,
    productsCount: productsResult.count ?? 0,
    newsCount: newsResult.count ?? 0,
  };
}

async function getRandomBusinesses(supabase: SupabaseServerClient) {
  const now = new Date().toISOString();

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
      )
    `,
    )
    .eq("status", "published")
    .eq("is_published", true)
    .eq("is_adult_content", false)
    .eq("show_in_search", true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .limit(30);

  if (error) {
    return [];
  }

  return shuffleItems((data ?? []) as unknown as BusinessCardRow[]).slice(0, 4);
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [weather, latestNews, featuredProducts, randomBusinesses, portalStats] =
    await Promise.all([
      getSabinasWeather(),
      getLatestNews(supabase),
      getFeaturedProducts(supabase),
      getRandomBusinesses(supabase),
      getPortalStats(supabase),
    ]);

  const weatherLabel = getWeatherCodeLabel(weather?.weatherCode ?? null);
  const weatherAdvice = getWeatherAdvice(weather);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff7ed] text-gray-950">
      <section className="relative border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-sky-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.20),transparent_35%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-600 text-xl text-white shadow-lg shadow-orange-900/20">
                S
              </span>

              <span>
                <span className="block text-lg font-black">Sabinapp</span>
                <span className="block text-xs font-semibold text-gray-500">
                  Sabinas Hidalgo en un solo lugar
                </span>
              </span>
            </Link>

            <nav className="flex flex-wrap gap-2 text-sm font-semibold">
              <a
                href="#clima"
                className="rounded-full bg-white px-4 py-2 text-gray-700 transition hover:bg-orange-100"
              >
                Clima
              </a>
              <a
                href="#noticias"
                className="rounded-full bg-white px-4 py-2 text-gray-700 transition hover:bg-orange-100"
              >
                Noticias
              </a>
              <a
                href="#productos"
                className="rounded-full bg-white px-4 py-2 text-gray-700 transition hover:bg-orange-100"
              >
                Productos
              </a>
              <a
                href="#negocios"
                className="rounded-full bg-white px-4 py-2 text-gray-700 transition hover:bg-orange-100"
              >
                Negocios
              </a>
              <Link
                href={user ? "/dashboard" : "/auth/login"}
                className="rounded-full bg-gray-950 px-4 py-2 text-white transition hover:bg-gray-800"
              >
                {user ? "Mi cuenta" : "Entrar"}
              </Link>
            </nav>
          </header>

          <div className="grid min-h-[68vh] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-bold text-orange-700 shadow-sm">
                Portal local para vecinos, clientes y negocios
              </p>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-gray-950 sm:text-6xl lg:text-7xl">
                Descubre qué hay hoy en Sabinas Hidalgo.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
                Clima, noticias, productos destacados y negocios locales en una
                portada pensada para el usuario común. Entra, explora y forma
                parte de la comunidad.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/negocios"
                  className="rounded-full bg-orange-600 px-7 py-4 text-center font-black text-white shadow-lg shadow-orange-900/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
                >
                  Explorar negocios
                </a>

                <Link
                  href={user ? "/dashboard" : "/auth/sign-up"}
                  className="rounded-full border border-gray-300 bg-white px-7 py-4 text-center font-black text-gray-950 transition hover:-translate-y-0.5 hover:bg-gray-50"
                >
                  {user ? "Ir a mi panel" : "Crear cuenta gratis"}
                </Link>
              </div>
            </div>

            <section
              id="clima"
              className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-2xl shadow-orange-900/10 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-700">
                    Ahora en Sabinas
                  </p>

                  <h2 className="mt-3 text-4xl font-black">
                    {weather?.temperature !== null &&
                    weather?.temperature !== undefined
                      ? `${Math.round(weather.temperature)}°C`
                      : "Clima disponible pronto"}
                  </h2>

                  <p className="mt-2 font-bold text-gray-700">
                    {weatherLabel}
                  </p>
                </div>

                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-sky-100 text-3xl">
                  🌤️
                </span>
              </div>

              <p className="mt-5 leading-7 text-gray-600">{weatherAdvice}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-bold uppercase text-orange-700">
                    Sensación
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {weather?.apparentTemperature !== null &&
                    weather?.apparentTemperature !== undefined
                      ? `${Math.round(weather.apparentTemperature)}°C`
                      : "Sin dato"}
                  </p>
                </div>

                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-xs font-bold uppercase text-sky-700">
                    Viento
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {weather?.windSpeed !== null &&
                    weather?.windSpeed !== undefined
                      ? `${Math.round(weather.windSpeed)} km/h`
                      : "Sin dato"}
                  </p>
                </div>
              </div>

              <Link
                href="/tiempo"
                className="mt-5 inline-flex rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                Ver página del tiempo
              </Link>
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pt-10">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-700">
              Sabinapp en números
            </p>

            <p className="mt-4 text-4xl font-black">
              {portalStats.businessesCount}
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-600">
              Negocios publicados
            </p>
          </article>

          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-700">
              Vitrina activa
            </p>

            <p className="mt-4 text-4xl font-black">
              {portalStats.productsCount}
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-600">
              Productos, servicios y destacados
            </p>
          </article>

          <article className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-700">
              Resumen local
            </p>

            <p className="mt-4 text-4xl font-black">
              {portalStats.newsCount}
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-600">
              Noticias activas disponibles
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-700">
                Menú rápido local
              </p>

              <h2 className="mt-3 text-3xl font-black">
                ¿Qué quieres revisar hoy?
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-gray-600">
              Accesos rápidos para explorar Sabinas Hidalgo sin perderte entre
              menús: clima, noticias, negocios, productos y tu cuenta.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              href="/negocios"
              className="rounded-3xl border border-gray-200 bg-orange-50 p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
            >
              <span className="text-3xl">🏪</span>
              <h3 className="mt-4 font-black">Negocios</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Directorio completo de negocios publicados.
              </p>
            </Link>

            <Link
              href="/productos"
              className="rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
            >
              <span className="text-3xl">⭐</span>
              <h3 className="mt-4 font-black">Productos</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Vitrina de productos, servicios y destacados.
              </p>
            </Link>

            <Link
              href="/noticias"
              className="rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
            >
              <span className="text-3xl">📰</span>
              <h3 className="mt-4 font-black">Noticias</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Resúmenes locales con enlace a la fuente.
              </p>
            </Link>

            <Link
              href="/tiempo"
              className="rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg"
            >
              <span className="text-3xl">🌤️</span>
              <h3 className="mt-4 font-black">Clima</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Temperatura actual y recomendación rápida.
              </p>
            </Link>

            <Link
              href={user ? "/dashboard" : "/auth/sign-up"}
              className="rounded-3xl border border-gray-950 bg-gray-950 p-5 text-white transition hover:-translate-y-1 hover:bg-gray-800 hover:shadow-lg"
            >
              <span className="text-3xl">👤</span>
              <h3 className="mt-4 font-black">
                {user ? "Mi cuenta" : "Crear cuenta"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {user
                  ? "Entra a tu panel y administra tu actividad."
                  : "Únete para usar funciones futuras de Sabinapp."}
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section
        id="noticias"
        className="mx-auto max-w-7xl px-6 py-12"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-700">
              Noticias locales
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Lo más reciente de Sabinas
            </h2>
          </div>

          <div className="max-w-xl">
            <p className="text-sm leading-6 text-gray-600">
              Esta sección queda preparada para mostrar 3 noticias resumidas por
              IA, cada una con enlace a su fuente original.
            </p>

            <Link
              href="/noticias"
              className="mt-4 inline-flex rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Ver más noticias
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {latestNews.length > 0 ? (
            latestNews.map((news) => (
              <article
                key={news.id}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase text-orange-700">
                  {news.source_name}
                </p>

                <h3 className="mt-3 text-xl font-black">{news.title}</h3>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {news.summary}
                </p>

                <a
                  href={news.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex text-sm font-bold text-orange-700 hover:text-orange-800"
                >
                  Leer fuente →
                </a>
              </article>
            ))
          ) : (
            <article className="rounded-3xl border border-dashed border-orange-200 bg-orange-50 p-6 md:col-span-3">
              <h3 className="text-xl font-black">
                Noticias inteligentes en preparación
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                La tabla ya está lista. En la siguiente fase conectaremos el
                proceso que buscará noticias locales, las resumirá con IA y las
                guardará para mostrarlas aquí.
              </p>
            </article>
          )}
        </div>
      </section>

      <section
        id="productos"
        className="mx-auto max-w-7xl px-6 py-12"
      >
        <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-700">
          Vitrina local
        </p>

        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="text-4xl font-black">Productos destacados</h2>

          <Link
            href="/productos"
            className="w-fit rounded-full bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
          >
            Ver vitrina completa
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => {
              const business = firstRelation(product.businesses);
              const price = formatPrice(
                product.price,
                product.currency,
                product.show_price,
              );

              return (
                <Link
                  key={product.id}
                  href={business ? `/negocio/${business.slug}` : "#"}
                  className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                    Destacado
                  </span>

                  <h3 className="mt-4 text-2xl font-black">{product.name}</h3>

                  {product.description ? (
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {product.description}
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
                </Link>
              );
            })
          ) : (
            <article className="rounded-3xl border border-dashed border-orange-200 bg-white p-6 md:col-span-3">
              <h3 className="text-xl font-black">
                Todavía no hay productos destacados
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Cuando los negocios marquen productos como destacados, aparecerán
                aquí de forma rotativa.
              </p>
            </article>
          )}
        </div>
      </section>

      <section
        id="negocios"
        className="mx-auto max-w-7xl px-6 py-12"
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-700">
              Directorio vivo
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Negocios para descubrir
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/negocios"
              className="rounded-full border border-gray-300 bg-white px-5 py-3 text-center text-sm font-bold text-gray-950 transition hover:bg-gray-50"
            >
              Ver directorio completo
            </Link>

            <Link
              href="/auth/sign-up"
              className="rounded-full bg-gray-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Quiero formar parte
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {randomBusinesses.length > 0 ? (
            randomBusinesses.map((business) => {
              const category = firstRelation(business.categories);

              return (
                <Link
                  key={business.id}
                  href={`/negocio/${business.slug}`}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="text-3xl">🏪</span>

                  <h3 className="mt-4 text-xl font-black">{business.name}</h3>

                  <p className="mt-2 text-xs font-bold uppercase text-orange-700">
                    {category?.name ?? "Negocio local"}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {business.short_description ??
                      "Conoce más sobre este negocio local."}
                  </p>
                </Link>
              );
            })
          ) : (
            <article className="rounded-3xl border border-dashed border-orange-200 bg-white p-6 md:col-span-2 lg:col-span-4">
              <h3 className="text-xl font-black">
                Todavía no hay negocios publicados
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Cuando haya negocios aprobados y publicados, aparecerán aquí de
                forma aleatoria.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
