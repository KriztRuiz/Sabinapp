// app/dashboard/negocios/[businessId]/edit/business-edit-form.tsx

import { landingVisualModeOptions } from "@/lib/landing/styles";
import { updateBusinessLanding } from "./actions";

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
    media: {
      id: string;
      type: string;
      url: string;
      alt_text: string | null;
      is_cover: boolean;
      is_active: boolean;
      sort_order: number;
    }[];
  };
};

export function BusinessEditForm({ business }: BusinessEditFormProps) {
  const updateBusinessLandingWithId = updateBusinessLanding.bind(
    null,
    business.id,
  );

  return (
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
        <h2 className="text-xl font-bold text-gray-950">Imágenes actuales</h2>

        <p className="mt-2 text-sm text-gray-600">
          Por ahora solo mostramos las imágenes registradas. En la siguiente fase
          agregaremos edición de URL, texto alternativo y activación.
        </p>

        {business.media.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {business.media.map((media) => (
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

                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      Tipo: {media.type}
                    </span>

                    {media.is_cover ? (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                        Portada
                      </span>
                    ) : null}

                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                      {media.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <p className="break-all text-xs text-gray-500">{media.url}</p>

                  <p className="text-sm text-gray-600">
                    {media.alt_text ?? "Sin texto alternativo."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
            Este negocio todavía no tiene imágenes registradas.
          </div>
        )}
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
          Guardar cambios
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
  );
}