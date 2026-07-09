// app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

import { landingVisualModeOptions } from "@/lib/landing/styles";
import {
  addBusinessMedia,
  setBusinessMediaAsCover,
  updateBusinessLanding,
  updateBusinessMediaDetails,
} from "./actions";

type BusinessMedia = {
  id: string;
  type: string;
  url: string;
  alt_text: string | null;
  is_cover: boolean;
  is_active: boolean;
  sort_order: number;
};

type BusinessItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string;
  show_price: boolean;
  is_featured: boolean;
  image_url: string | null;
  image_alt: string | null;
  is_active: boolean;
  sort_order: number;
};

function formatItemPrice(item: BusinessItem) {
  if (!item.show_price || item.price === null) {
    return "Precio oculto";
  }

  const numericPrice = Number(item.price);

  if (Number.isNaN(numericPrice)) {
    return `${item.price} ${item.currency}`;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: item.currency || "MXN",
  }).format(numericPrice);
}

type BusinessEditFormProps = {
  business: {
    id: string;
    name: string;
    slug: string;
    short_description: string;
    long_description: string | null;
    status: string;
    is_published: boolean;
    visual_mode: string;
    media: BusinessMedia[];
    items: BusinessItem[];
  };
};

export function BusinessEditForm({ business }: BusinessEditFormProps) {
  const updateBusinessLandingWithId = updateBusinessLanding.bind(
    null,
    business.id,
  );

  const addBusinessMediaWithId = addBusinessMedia.bind(null, business.id);

  return (
    <div className="space-y-8">
      <form action={updateBusinessLandingWithId} className="space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-950">
            Contenido de la landing
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Esta información alimenta la página pública del negocio.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-800"
              >
                Nombre del negocio
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={business.name}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="short_description"
                className="block text-sm font-semibold text-gray-800"
              >
                Descripción corta
              </label>

              <textarea
                id="short_description"
                name="short_description"
                required
                rows={3}
                defaultValue={business.short_description}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="long_description"
                className="block text-sm font-semibold text-gray-800"
              >
                Descripción larga
              </label>

              <textarea
                id="long_description"
                name="long_description"
                rows={5}
                defaultValue={business.long_description ?? ""}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-950">Estilo visual</h2>

          <p className="mt-2 text-sm text-gray-600">
            Elige cómo se verá la landing pública. Esta sección va debajo del
            contenido porque primero se edita la información y después se decide
            cómo presentarla.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {landingVisualModeOptions.map((mode) => (
              <label
                key={mode.key}
                className="cursor-pointer rounded-2xl border border-gray-200 p-4 transition hover:border-orange-300 hover:bg-orange-50"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="visual_mode"
                    value={mode.key}
                    defaultChecked={business.visual_mode === mode.key}
                    className="mt-1"
                  />

                  <span>
                    <span className="block font-bold text-gray-950">
                      {mode.name}
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-gray-600">
                      {mode.description}
                    </span>
                  </span>
                </div>
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Guardar contenido y estilo
          </button>

          {business.is_published ? (
            <a
              href={`/negocio/${business.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Ver página pública
            </a>
          ) : null}
        </div>
      </form>

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
          <h3 className="text-lg font-bold text-gray-950">Agregar nueva imagen</h3>

          <p className="mt-1 text-sm text-gray-600">
            Pega una URL pública de imagen. Si el negocio no tiene imágenes, se usará
            como portada automáticamente.
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
                type="url"
                required
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
                          type="url"
                          required
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

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-950">Menú y destacados</h2>

        <p className="mt-2 text-sm text-gray-600">
          Por ahora solo mostramos los productos, servicios o elementos registrados.
          En la siguiente fase agregaremos edición.
        </p>

        {business.items.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {business.items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
              >
                {item.image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.image_alt ?? item.name}
                      className="h-44 w-full object-cover"
                    />
                  </>
                ) : null}

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      Tipo: {item.type}
                    </span>

                    {item.is_featured ? (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                        Destacado
                      </span>
                    ) : null}

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      {item.is_active ? "Activo" : "Inactivo"}
                    </span>

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      {item.show_price ? "Precio visible" : "Precio oculto"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-950">{item.name}</h3>

                    {item.description ? (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">
                        Sin descripción.
                      </p>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-gray-900">
                    {formatItemPrice(item)}
                  </p>

                  {item.image_url ? (
                    <p className="break-all text-xs text-gray-500">
                      {item.image_url}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Sin imagen.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
            Este negocio todavía no tiene items registrados.
          </div>
        )}
      </section>
    </div>
  );
}