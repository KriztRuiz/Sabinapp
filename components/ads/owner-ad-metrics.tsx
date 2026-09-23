export type OwnerAdMetricAsset = {
  assetId: string;
  assetType: string;
  sortOrder: number;
  impressions: number | string;
  clicks: number | string;
};

export type OwnerAdMetric = {
  campaign_id: string;
  total_appearances: number | string;
  total_impressions: number | string;
  total_clicks: number | string;
  assets: OwnerAdMetricAsset[];
};

type Props = {
  metrics: OwnerAdMetric | null;
};

function formatCount(
  value: number | string,
) {
  return new Intl.NumberFormat(
    "es-MX",
  ).format(Number(value));
}

export function OwnerAdMetrics({
  metrics,
}: Props) {
  if (!metrics) {
    return (
      <section className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <h4 className="font-black text-gray-950">
          Estadísticas
        </h4>

        <p className="mt-2 text-sm text-gray-600">
          Todavía no hay estadísticas disponibles
          para esta campaña.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5">
      <h4 className="text-lg font-black text-gray-950">
        Estadísticas de la publicidad
      </h4>

      <p className="mt-1 text-sm text-gray-600">
        Resultados registrados para esta campaña.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4">
          <p className="text-sm font-semibold text-gray-600">
            Clics totales
          </p>

          <p className="mt-2 text-3xl font-black text-green-700">
            {formatCount(metrics.total_clicks)}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4">
          <p className="text-sm font-semibold text-gray-600">
            Apariciones del anuncio
          </p>

          <p className="mt-2 text-3xl font-black text-violet-700">
            {formatCount(metrics.total_appearances)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-gray-600">
        Cada aparición cuenta una vez que se muestra
        el anuncio completo. Las apariciones anteriores
        a esta actualización no se reconstruyen.
        Las impresiones individuales se conservan
        debajo, por imagen o video.
      </p>

      {metrics.assets.length > 0 ? (
        <div className="mt-5">
          <h5 className="font-black text-gray-950">
            Rendimiento por archivo
          </h5>

          <div className="mt-3 grid gap-3">
            {metrics.assets.map(
              (asset) => (
                <div
                  key={asset.assetId}
                  className="rounded-xl border border-violet-100 bg-white p-4"
                >
                  <p className="font-bold text-gray-950">
                    {asset.assetType === "video"
                      ? "Video"
                      : `Imagen ${asset.sortOrder + 1}`}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">
                        Clics
                      </p>

                      <p className="text-xl font-black text-green-700">
                        {formatCount(asset.clicks)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">
                        Impresiones
                      </p>

                      <p className="text-xl font-black text-violet-700">
                        {formatCount(asset.impressions)}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
