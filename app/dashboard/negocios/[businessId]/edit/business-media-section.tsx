// app/dashboard/negocios/[businessId]/edit/business-media-section.tsx

import {
  addBusinessMedia,
  setBusinessMediaAsCover,
  updateBusinessMediaDetails,
} from "./actions";
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
        Edita las URLs de imágenes, el texto alternativo y cuál imagen se usa
        como portada.
      </p>

      <form
        action={addBusinessMediaWithId}
        className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5"
      >
        <h3 className="text-lg font-bold text-gray-950">
          Agregar nueva imagen
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          Pega una URL pública de imagen. Si el negocio no tiene imágenes, se
          usará como portada automáticamente.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="new-media-url"
              className="block text-sm font-semibold text-gray-800"
            >
              URL de imagen
            </label>

            <input
              id="new-media-url"
              name="url"
              type="text"
              placeholder="https://..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
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

        <button
          type="submit"
          className="mt-4 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Agregar imagen
        </button>
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
                        htmlFor={`media-url-${media.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        URL de imagen
                      </label>

                      <input
                        id={`media-url-${media.id}`}
                        name="url"
                        type="text"
                        defaultValue={media.url}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
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

                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={media.is_active}
                      />
                      Imagen activa
                    </label>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Guardar imagen
                    </button>
                  </form>

                  {!media.is_cover ? (
                    <form action={setMediaAsCoverWithIds}>
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
                      >
                        Usar como portada
                      </button>
                    </form>
                  ) : (
                    <p className="rounded-lg bg-orange-50 px-4 py-2 text-center text-sm font-semibold text-orange-800">
                      Esta imagen es la portada actual.
                    </p>
                  )}
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
