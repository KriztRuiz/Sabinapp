// app/dashboard/negocios/[businessId]/edit/business-locations-section.tsx

import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessLocationsSectionProps = {
  business: BusinessEditBusiness;
};

function getLocationTypeLabel(locationType: string) {
  const labels: Record<string, string> = {
    physical_location: "Local físico",
    service_area: "Área de servicio",
    online: "En línea",
    temporary_location: "Ubicación temporal",
    other: "Otra ubicación",
  };

  return labels[locationType] ?? locationType;
}

function getMainLocationText(
  location: BusinessEditBusiness["locations"][number],
) {
  return (
    location.address_text ||
    location.service_area_text ||
    location.reference_notes ||
    "Sin descripción de ubicación."
  );
}

export function BusinessLocationsSection({
  business,
}: BusinessLocationsSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-950">Ubicaciones públicas</h2>

      <p className="mt-2 text-sm text-gray-600">
        Estas ubicaciones aparecen en la landing pública del negocio cuando
        están marcadas como públicas.
      </p>

      {business.locations.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {business.locations.map((location) => (
            <article
              key={location.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-950">
                    {getLocationTypeLabel(location.location_type)}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {getMainLocationText(location)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {location.is_primary ? (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                      Principal
                    </span>
                  ) : null}

                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    {location.is_public ? "Pública" : "No pública"}
                  </span>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="font-semibold text-gray-800">Dirección</dt>
                  <dd className="mt-1 text-gray-600">
                    {location.address_text || "Sin dirección registrada"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-800">Colonia</dt>
                  <dd className="mt-1 text-gray-600">
                    {location.neighborhood || "Sin colonia registrada"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-800">Referencia</dt>
                  <dd className="mt-1 text-gray-600">
                    {location.reference_notes || "Sin referencia registrada"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-800">
                    Área de servicio
                  </dt>
                  <dd className="mt-1 text-gray-600">
                    {location.service_area_text ||
                      "Sin área de servicio registrada"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-800">Latitud</dt>
                  <dd className="mt-1 text-gray-600">
                    {location.latitude ?? "Sin latitud"}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-gray-800">Longitud</dt>
                  <dd className="mt-1 text-gray-600">
                    {location.longitude ?? "Sin longitud"}
                  </dd>
                </div>
              </dl>

              {location.map_url ? (
                <a
                  href={location.map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
                >
                  Abrir mapa
                </a>
              ) : (
                <p className="mt-5 rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-600">
                  Esta ubicación no tiene enlace de mapa.
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
          Este negocio todavía no tiene ubicaciones registradas.
        </div>
      )}
    </section>
  );
}
