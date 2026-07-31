// app/dashboard/negocios/[businessId]/edit/business-locations-section.tsx

import { updateBusinessLocationDetails } from "./actions";
import type { BusinessEditBusiness } from "./business-edit-types";
import { ConfirmSubmitButton } from "./confirm-submit-button";

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
          {business.locations.map((location) => {
            const updateLocationWithIds = updateBusinessLocationDetails.bind(
              null,
              business.id,
              location.id,
            );

            return (
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

                <form action={updateLocationWithIds} className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`location-address-${location.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Dirección
                      </label>

                      <input
                        id={`location-address-${location.id}`}
                        name="address_text"
                        type="text"
                        defaultValue={location.address_text ?? ""}
                        placeholder="Ej. Calle, número o zona"
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`location-neighborhood-${location.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Colonia
                      </label>

                      <input
                        id={`location-neighborhood-${location.id}`}
                        name="neighborhood"
                        type="text"
                        defaultValue={location.neighborhood ?? ""}
                        placeholder="Ej. Centro"
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`location-reference-${location.id}`}
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Referencia visible
                    </label>

                    <textarea
                      id={`location-reference-${location.id}`}
                      name="reference_notes"
                      rows={2}
                      defaultValue={location.reference_notes ?? ""}
                      placeholder="Ej. Frente a la plaza, enseguida de..."
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`location-service-area-${location.id}`}
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Área de servicio
                    </label>

                    <textarea
                      id={`location-service-area-${location.id}`}
                      name="service_area_text"
                      rows={2}
                      defaultValue={location.service_area_text ?? ""}
                      placeholder="Ej. Servicio en Sabinas Hidalgo y alrededores"
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`location-map-url-${location.id}`}
                      className="block text-sm font-semibold text-gray-800"
                    >
                      URL de mapa
                    </label>

                    <input
                      id={`location-map-url-${location.id}`}
                      name="map_url"
                      type="text"
                      defaultValue={location.map_url ?? ""}
                      placeholder="https://maps.google.com/..."
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    {location.map_url ? (
                      <a
                        href={location.map_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-sm font-semibold text-orange-700 hover:text-orange-800"
                      >
                        Abrir mapa actual
                      </a>
                    ) : null}
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="is_primary"
                        defaultChecked={location.is_primary}
                      />
                      Ubicación principal
                    </label>

                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="is_public"
                        defaultChecked={location.is_public}
                      />
                      Mostrar públicamente
                    </label>
                  </div>

                  <ConfirmSubmitButton
                    message="¿Guardar los cambios de esta ubicación?"
                    className="w-full rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Guardar ubicación
                  </ConfirmSubmitButton>
                </form>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
          Este negocio todavía no tiene ubicaciones registradas.
        </div>
      )}
    </section>
  );
}
