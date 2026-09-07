import { FixedAdBanner } from "@/components/ads/fixed-ad-banner";
import {
  getPublicAds,
  type PublicAdPlacement,
} from "@/lib/ads/public-ads";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const placements: PublicAdPlacement[] = [
  "home",
  "negocios",
  "productos",
  "noticias",
  "clima",
];

const taqueriaElPrimoBusinessId = "10cb0988-14da-425c-a1d3-6356389d56ad";
const climasDelNorteBusinessId = "7bb36f6e-99f8-4e0c-b818-1ed76b2092ac";

export default async function AdsTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const placementResults = await Promise.all(
    placements.map(async (placement) => {
      const result = await getPublicAds({
        placement,
        includeInterstitial: false,
      });

      return {
        placement,
        ...result,
      };
    }),
  );

  const sameBusinessResult = await getPublicAds({
    placement: "business_profile",
    currentBusinessId: taqueriaElPrimoBusinessId,
    includeInterstitial: false,
  });

  const otherBusinessResult = await getPublicAds({
    placement: "business_profile",
    currentBusinessId: climasDelNorteBusinessId,
    includeInterstitial: false,
  });

  const sameBusinessAssets = sameBusinessResult.ads.reduce(
    (total, campaign) => total + campaign.assets.length,
    0,
  );

  const otherBusinessAssets = otherBusinessResult.ads.reduce(
    (total, campaign) => total + campaign.assets.length,
    0,
  );

  const totalAds = placementResults.reduce(
    (total, result) => total + result.ads.length,
    0,
  );

  const totalAssets = placementResults.reduce(
    (total, result) =>
      total +
      result.ads.reduce(
        (campaignTotal, campaign) => campaignTotal + campaign.assets.length,
        0,
      ),
    0,
  );

  const homeAdsForPreview =
    placementResults.find((result) => result.placement === "home")?.ads ?? [];

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
          Prueba local
        </p>

        <h1 className="mt-2 text-3xl font-black text-gray-950">
          Lectura de anuncios desde Supabase
        </h1>

        <p className="mt-3 max-w-3xl text-gray-600">
          Esta ruta verifica que la app pueda leer anuncios activos mediante
          get_public_ads(). También confirma la regla actual de páginas de negocio.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-950">
          Vista previa visual de Campana A
        </h2>

        <FixedAdBanner ads={homeAdsForPreview} heading="Anuncio fijo local" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Campanas leidas</p>
          <p className="mt-2 text-3xl font-black text-gray-950">{totalAds}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Assets leidos</p>
          <p className="mt-2 text-3xl font-black text-gray-950">
            {totalAssets}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Campana B</p>
          <p className="mt-2 text-3xl font-black text-gray-950">Apagada</p>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-950">
          Lectura por ubicacion
        </h2>

        <div className="grid gap-4">
          {placementResults.map((result) => (
            <article
              key={result.placement}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-950">
                  {result.placement}
                </h3>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                  {result.ads.length} campana(s)
                </span>
              </div>

              {result.error ? (
                <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {result.error}
                </pre>
              ) : (
                <div className="mt-4 space-y-3">
                  {result.ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <p className="font-semibold text-gray-950">{ad.title}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Tipo: {ad.type} | Assets: {ad.assets.length}
                      </p>
                      <p className="mt-1 break-all text-sm text-gray-600">
                        Destino: {ad.targetUrl ?? "Sin destino"}
                      </p>
                    </div>
                  ))}

                  {result.ads.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay anuncios activos para esta ubicacion.
                    </p>
                  ) : null}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-950">
          Página pública del negocio
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-950">
              Mismo negocio anunciante permitido
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Resultado esperado: 1 campaña / 3 assets con la campaña demo activa.
            </p>
            <p className="mt-3 text-2xl font-black text-gray-950">
              {sameBusinessResult.ads.length} campaña(s)
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-500">
              {sameBusinessAssets} asset(s)
            </p>
          </article>

          <article className="rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-950">Otro negocio</p>
            <p className="mt-2 text-sm text-gray-600">
              Resultado esperado: 1 campaña / 3 assets con la campaña demo activa.
            </p>
            <p className="mt-3 text-2xl font-black text-gray-950">
              {otherBusinessResult.ads.length} campaña(s)
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-500">
              {otherBusinessAssets} asset(s)
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
