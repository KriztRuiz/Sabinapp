import { landingVisualModeOptions } from "@/lib/landing/styles";
import { FieldGuide } from "../../_components/field-guide";
import type { BusinessEditBusiness } from "./business-edit-types";

type BusinessCustomizationSectionProps = {
  business: BusinessEditBusiness;
};

export function BusinessCustomizationSection({
  business,
}: BusinessCustomizationSectionProps) {
  return (
    <section id="personalizacion"
      className="business-edit-panel scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-gray-950">Personalización</h2>

      <p className="mt-2 text-sm text-gray-600">
        Elige cómo se verá la página pública del negocio. Por ahora puedes
        escoger el modo visual; más adelante esta sección podrá incluir más
        opciones de apariencia y experiencia.
      </p>

      <FieldGuide
        title="Consejo para personalizar la página"
        description="Elige una presentación que combine con el tipo de negocio y con la confianza que quieres transmitir al cliente."
        goodExample="Un restaurante puede usar un estilo cálido o impactante; un contador puede usar uno elegante o clásico."
        avoid="Evita elegir un estilo solo por color. Primero piensa si comunica bien la personalidad del negocio."
      />

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
  );
}
