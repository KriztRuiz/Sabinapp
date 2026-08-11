// app/dashboard/negocios/[businessId]/edit/business-content-style-form.tsx

import { updateBusinessLanding } from "./actions";
import { BusinessCustomizationSection } from "./business-customization-section";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { FieldGuide } from "../../_components/field-guide";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessContentStyleFormProps = {
  business: BusinessEditBusiness;
};

export function BusinessContentStyleForm({
  business,
}: BusinessContentStyleFormProps) {
  const updateBusinessLandingWithId = updateBusinessLanding.bind(
    null,
    business.id,
  );

  return (
    <form action={updateBusinessLandingWithId} className="space-y-8">
      <section
        id="contenido"
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
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
              defaultValue={business.name}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <FieldGuide
              title="Consejo para el nombre del negocio"
              description="Escribe el nombre como lo conocen tus clientes. Debe ser claro, fácil de recordar y no demasiado largo."
              goodExample="Taquería El Primo"
              avoid="Evita nombres genéricos como “Mi negocio”, “Local 1” o textos con demasiados emojis."
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
              rows={3}
              defaultValue={business.short_description}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            <FieldGuide
              title="Consejo para la descripción corta"
              description="Resume en una frase qué ofrece tu negocio. Esta descripción aparece en listados y ayuda a que la gente entienda rápido si le interesa."
              goodExample="Tacos de trompo, bistec y gringas para cenar o llevar en Sabinas Hidalgo."
              avoid="Evita frases vacías como “somos los mejores” sin explicar qué vendes o qué servicio das."
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

            <FieldGuide
              title="Consejo para la descripción larga"
              description="Aquí puedes explicar con más calma qué haces, qué vendes, qué te distingue, cómo atiendes y qué debería saber un cliente antes de contactarte."
              goodExample="Somos una taquería familiar con servicio para cenar y llevar. Preparamos tacos de trompo, bistec, gringas y aguas frescas. Atendemos por la tarde y noche."
              avoid="Evita copiar solo la descripción corta. Usa este espacio para dar más contexto."
            />
          </div>
        </div>
      </section>

      <BusinessCustomizationSection business={business} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <ConfirmSubmitButton
          message="¿Guardar los cambios de contenido y personalización de este negocio?"
          className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Guardar contenido y personalización
        </ConfirmSubmitButton>

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
