import { FieldGuide } from "../../_components/field-guide";
// app/dashboard/negocios/[businessId]/edit/business-media-section.tsx

import {
  addBusinessMedia,
  deleteBusinessMedia,
  setBusinessMediaAsCover,
  updateBusinessMediaDetails,
} from "./actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessMediaSectionProps = {
  business: BusinessEditBusiness;
};

export function BusinessMediaSection({ business }: BusinessMediaSectionProps) {
  const addBusinessMediaWithId = addBusinessMedia.bind(null, business.id);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-950">Imágenes actuales</h2>

      <p className="mt-2 text-sm text-gray-600">
        Sube imágenes del negocio, edita el texto alternativo y cuál imagen se
        usa como portada.
      </p>

      <FieldGuide
        title="Guía para imágenes actuales"
        description="Usa imágenes claras del negocio, productos, fachada, menú, instalaciones o trabajos realizados. La imagen de portada será una de las primeras cosas que verá el cliente."
        goodExample="Fachada del local, producto principal bien iluminado o foto real del servicio terminado."
        avoid="Evita fotos borrosas, capturas de pantalla, imágenes con demasiado texto o fotos que no representen al negocio."
      />

      <form
        action={addBusinessMediaWithId}
        className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5"
      >
        <h3 className="text-lg font-bold text-gray-950">
          Agregar nueva imagen
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          Selecciona una imagen desde tu dispositivo. Si el negocio no tiene
          imágenes, se usará como portada automáticamente.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="new-media-file"
              className="block text-sm font-semibold text-gray-800"
            >
              Imagen
            </label>

            <input
              id="new-media-file"
              name="image_file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 file:mr-4 file:rounded-md file:border-0 file:bg-gray-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />

            <p className="mt-1 text-xs text-gray-500">
              JPEG, PNG o WebP · máximo 5 MB.
            </p>
          </div>

          <div>
            <label
              htmlFor="new-media-alt"
              className="block text-sm font-semibold text-gray-800"
            >
              Texto alternativo
            </label>

            <input
              id="new-media-alt"
              name="alt_text"
              type="text"
              placeholder="Ej. Fachada del negocio"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <ConfirmSubmitButton
          message="¿Agregar esta imagen al negocio?"
          className="mt-4 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Agregar imagen
        </ConfirmSubmitButton>
      </form>

      {business.media.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {business.media.map((media) => {
            const updateMediaDetailsWithIds = updateBusinessMediaDetails.bind(
              null,
              business.id,
              media.id,
            );

            const setMediaAsCoverWithIds = setBusinessMediaAsCover.bind(
              null,
              business.id,
              media.id,
            );

            const deleteBusinessMediaWithIds = deleteBusinessMedia.bind(
              null,
              business.id,
              media.id,
            );

            return (
              <article
                key={media.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt={media.alt_text ?? business.name}
                  className="h-48 w-full object-cover"
                />

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      Tipo: {media.type}
                    </span>

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      Orden: {media.sort_order}
                    </span>

                    {media.is_cover ? (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                        Portada actual
                      </span>
                    ) : null}

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      {media.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <form
                    action={updateMediaDetailsWithIds}
                    className="space-y-3"
                  >
                    <div>
                      <label
                        htmlFor={`media-file-${media.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Reemplazar imagen
                      </label>

                      <input
                        id={`media-file-${media.id}`}
                        name="image_file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 file:mr-4 file:rounded-md file:border-0 file:bg-gray-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        Opcional. Déjalo vacío para conservar la imagen actual.
                        JPEG, PNG o WebP · máximo 5 MB.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`media-alt-${media.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Texto alternativo
                      </label>

                      <input
                        id={`media-alt-${media.id}`}
                        name="alt_text"
                        type="text"
                        defaultValue={media.alt_text ?? ""}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`media-sort-order-${media.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Orden de aparición
                      </label>

                      <input
                        id={`media-sort-order-${media.id}`}
                        name="sort_order"
                        type="text"
                        inputMode="numeric"
                        defaultValue={media.sort_order}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        Menor número aparece primero. Ejemplo: 1, 2, 3.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={media.is_active}
                      />
                      Imagen activa
                    </label>

                    <ConfirmSubmitButton
                      message="¿Guardar los cambios de esta imagen?"
                      className="w-full rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Guardar imagen
                    </ConfirmSubmitButton>
                  </form>

                  {!media.is_cover ? (
                    <form action={setMediaAsCoverWithIds}>
                      <ConfirmSubmitButton
                        message="¿Usar esta imagen como portada del negocio?"
                        className="w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
                      >
                        Usar como portada
                      </ConfirmSubmitButton>
                    </form>
                  ) : (
                    <p className="rounded-lg bg-orange-50 px-4 py-2 text-center text-sm font-semibold text-orange-800">
                      Esta imagen es la portada actual.
                    </p>
                  )}

                  <form action={deleteBusinessMediaWithIds}>
                    <ConfirmSubmitButton
                      message="¿Eliminar esta imagen? Esta acción no se puede deshacer."
                      className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Eliminar imagen
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
          Este negocio todavía no tiene imágenes registradas.
        </div>
      )}
    </section>
  );
}
