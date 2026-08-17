import {
  getLandingVisualModeOption,
  landingVisualModeOptions,
} from "@/lib/landing/styles";
import { FieldGuide } from "../../_components/field-guide";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessCustomizationSectionProps = {
  business: BusinessEditBusiness;
};

export function BusinessCustomizationSection({
  business,
}: BusinessCustomizationSectionProps) {
  const currentVisualModeOption = getLandingVisualModeOption(
    business.visual_mode,
  );

  return (
    <section
      id="personalizacion"
      className="business-edit-panel scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Apariencia pública
          </p>

          <h2 className="mt-1 text-xl font-bold text-gray-950">
            Personalización
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Elige cómo se presentará la página pública del negocio. Cada modo no
            solo cambia colores: cambia la forma de ordenar, destacar y resumir
            la información.
          </p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
          <p className="font-bold">Modo actual</p>
          <p className="mt-1">{currentVisualModeOption.name}</p>
        </div>
      </div>

      <FieldGuide
        title="Consejo para elegir el modo visual"
        description="Piensa primero en lo que el cliente debe sentir al entrar: confianza, cercanía, rapidez, elegancia o urgencia."
        goodExample="Un contador puede usar Elegant; una taquería familiar puede usar Warm; una promoción fuerte puede usar Impact."
        avoid="Evita elegir solo por gusto personal. Elige el modo que ayude mejor al cliente a tomar acción."
      />

      <div className="mt-6 grid gap-4">
        {landingVisualModeOptions.map((mode) => (
          <label key={mode.key} className="block cursor-pointer">
            <input
              type="radio"
              name="visual_mode"
              value={mode.key}
              defaultChecked={business.visual_mode === mode.key}
              className="peer sr-only"
            />

            <span className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-orange-300 hover:bg-orange-50 peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:ring-2 peer-checked:ring-orange-200">
              <span className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-black text-gray-950">
                      {mode.name}
                    </span>

                    {business.visual_mode === mode.key ? (
                      <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
                        Seleccionado
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-2 block text-sm leading-6 text-gray-700">
                    {mode.description}
                  </span>
                </span>

                <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                  {mode.key}
                </span>
              </span>

              <span className="mt-4 grid gap-3 md:grid-cols-3">
                <span className="rounded-xl border border-gray-200 bg-white/70 p-3">
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Ideal para
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-gray-700">
                    {mode.bestFor}
                  </span>
                </span>

                <span className="rounded-xl border border-gray-200 bg-white/70 p-3">
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Experiencia
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-gray-700">
                    {mode.experience}
                  </span>
                </span>

                <span className="rounded-xl border border-gray-200 bg-white/70 p-3">
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Nota
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-gray-700">
                    {mode.warning}
                  </span>
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
