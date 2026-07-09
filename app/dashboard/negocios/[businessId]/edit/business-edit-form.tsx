// app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

import { landingVisualModeOptions } from "@/lib/landing/styles";
import {
  addBusinessItem,
  addBusinessMedia,
  setBusinessMediaAsCover,
  updateBusinessItemDetails,
  updateBusinessLanding,
  updateBusinessMediaDetails,
} from "./actions";
import {
  businessItemTypeOptions,
  formatItemPrice,
  type BusinessEditBusiness,
} from "./business-edit-types";

type BusinessEditFormProps = {
  business: BusinessEditBusiness;
};

export function BusinessEditForm({ business }: BusinessEditFormProps) {
  const updateBusinessLandingWithId = updateBusinessLanding.bind(
    null,
    business.id,
  );

  const addBusinessMediaWithId = addBusinessMedia.bind(null, business.id);

  const addBusinessItemWithId = addBusinessItem.bind(null, business.id);

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

      <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50/70 to-white shadow-sm">
        <div className="border-b border-orange-100 bg-white/80 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">
            Oferta del negocio
          </p>

          <h2 className="mt-2 text-2xl font-black text-gray-950">
            Menú y destacados
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Aquí se controla lo que el cliente verá como productos, servicios,
            paquetes, reglas, amenidades o elementos destacados en la landing pública.
          </p>
        </div>

        <form
          action={addBusinessItemWithId}
          className="border-b border-orange-100 bg-orange-50/60 p-6"
        >
          <div className="rounded-[1.5rem] border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
                  Nuevo elemento
                </p>

                <h3 className="mt-1 text-xl font-black text-gray-950">
                  Agregar al menú o destacados
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  Puedes agregar productos, servicios, paquetes, actividades,
                  amenidades o reglas del negocio.
                </p>
              </div>

              <span className="w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                Activo por defecto
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="new-item-type"
                  className="block text-sm font-bold text-gray-800"
                >
                  Tipo
                </label>

                <select
                  id="new-item-type"
                  name="type"
                  defaultValue="product"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  {businessItemTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-item-name"
                  className="block text-sm font-bold text-gray-800"
                >
                  Nombre
                </label>

                <input
                  id="new-item-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Combo familiar"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="new-item-description"
                className="block text-sm font-bold text-gray-800"
              >
                Descripción
              </label>

              <textarea
                id="new-item-description"
                name="description"
                rows={3}
                placeholder="Describe brevemente este producto o servicio."
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="new-item-price"
                  className="block text-sm font-bold text-gray-800"
                >
                  Precio
                </label>

                <input
                  id="new-item-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-currency"
                  className="block text-sm font-bold text-gray-800"
                >
                  Moneda
                </label>

                <input
                  id="new-item-currency"
                  name="currency"
                  type="text"
                  defaultValue="MXN"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm uppercase text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="new-item-image-url"
                  className="block text-sm font-bold text-gray-800"
                >
                  URL de imagen
                </label>

                <input
                  id="new-item-image-url"
                  name="image_url"
                  type="url"
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-image-alt"
                  className="block text-sm font-bold text-gray-800"
                >
                  Texto alternativo de imagen
                </label>

                <input
                  id="new-item-image-alt"
                  name="image_alt"
                  type="text"
                  placeholder="Ej. Producto en mostrador"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" name="show_price" defaultChecked />
                Mostrar precio
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" name="is_featured" />
                Destacado
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-600 to-gray-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Agregar item
            </button>
          </div>
        </form>

        {business.items.length > 0 ? (
          <div className="grid gap-5 p-6 lg:grid-cols-2">
            {business.items.map((item) => {
              const updateBusinessItemWithIds = updateBusinessItemDetails.bind(
                null,
                business.id,
                item.id,
              );

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-950 via-gray-800 to-orange-900">
                    {item.image_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.image_alt ?? item.name}
                          className="h-full w-full object-cover opacity-90 transition duration-500 hover:scale-105"
                        />
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center">
                        <div>
                          <p className="text-4xl">⭐</p>

                          <p className="mt-3 text-sm font-semibold text-white/80">
                            Sin imagen registrada
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow">
                        Orden {item.sort_order}
                      </span>
                      {item.is_featured ? (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow">
                          Destacado
                        </span>
                      ) : null}

                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-950 shadow">
                        {item.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/55 p-4 text-white backdrop-blur">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                        {item.type}
                      </p>

                      <h3 className="mt-1 text-xl font-black">{item.name}</h3>

                      <p className="mt-1 text-sm font-semibold text-white/90">
                        {formatItemPrice(item)}
                      </p>
                    </div>
                  </div>

                  <form action={updateBusinessItemWithIds} className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`item-type-${item.id}`}
                          className="block text-sm font-bold text-gray-800"
                        >
                          Tipo
                        </label>

                        <select
                          id={`item-type-${item.id}`}
                          name="type"
                          defaultValue={item.type}
                          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        >
                          {businessItemTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`item-name-${item.id}`}
                          className="block text-sm font-bold text-gray-800"
                        >
                          Nombre
                        </label>

                        <input
                          id={`item-name-${item.id}`}
                          name="name"
                          type="text"
                          required
                          defaultValue={item.name}
                          className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`item-description-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        Descripción
                      </label>

                      <textarea
                        id={`item-description-${item.id}`}
                        name="description"
                        rows={3}
                        defaultValue={item.description ?? ""}
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`item-price-${item.id}`}
                          className="block text-sm font-bold text-gray-800"
                        >
                          Precio
                        </label>

                        <input
                          id={`item-price-${item.id}`}
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={item.price ?? ""}
                          className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`item-currency-${item.id}`}
                          className="block text-sm font-bold text-gray-800"
                        >
                          Moneda
                        </label>

                        <input
                          id={`item-currency-${item.id}`}
                          name="currency"
                          type="text"
                          defaultValue={item.currency || "MXN"}
                          className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm uppercase text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`item-sort-order-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        Orden de aparición
                      </label>

                      <input
                        id={`item-sort-order-${item.id}`}
                        name="sort_order"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={item.sort_order}
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        Menor número aparece primero. Ejemplo: 1, 2, 3.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor={`item-image-url-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        URL de imagen
                      </label>

                      <input
                        id={`item-image-url-${item.id}`}
                        name="image_url"
                        type="url"
                        defaultValue={item.image_url ?? ""}
                        placeholder="https://..."
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`item-image-alt-${item.id}`}
                        className="block text-sm font-bold text-gray-800"
                      >
                        Texto alternativo de imagen
                      </label>

                      <input
                        id={`item-image-alt-${item.id}`}
                        name="image_alt"
                        type="text"
                        defaultValue={item.image_alt ?? ""}
                        className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          name="show_price"
                          defaultChecked={item.show_price}
                        />
                        Mostrar precio
                      </label>

                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          name="is_featured"
                          defaultChecked={item.is_featured}
                        />
                        Destacado
                      </label>

                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          name="is_active"
                          defaultChecked={item.is_active}
                        />
                        Activo
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-gray-950 to-orange-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Guardar item
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-6 text-sm text-gray-600">
              Este negocio todavía no tiene items registrados.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}