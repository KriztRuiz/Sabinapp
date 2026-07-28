import { updateBusinessHourDetails } from "./actions";
import type { BusinessEditBusiness } from "./business-edit-types";
import { ConfirmSubmitButton } from "./confirm-submit-button";

type BusinessHoursSectionProps = {
  business: BusinessEditBusiness;
};

const dayNames = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function formatTimeForInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export function BusinessHoursSection({ business }: BusinessHoursSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-950">Horarios públicos</h2>

      <p className="mt-2 text-sm text-gray-600">
        Estos horarios aparecen en la landing pública del negocio.
      </p>

      {business.hours.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {business.hours.map((hour) => {
            const updateHourWithIds = updateBusinessHourDetails.bind(
              null,
              business.id,
              hour.id,
            );

            return (
              <article
                key={hour.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-gray-950">
                      {dayNames[hour.day_of_week] ?? `Día ${hour.day_of_week}`}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      Periodo {hour.period_order}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    {hour.is_closed ? "Cerrado" : "Abierto"}
                  </span>
                </div>

                <form action={updateHourWithIds} className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label
                        htmlFor={`hour-period-order-${hour.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Periodo
                      </label>

                      <input
                        id={`hour-period-order-${hour.id}`}
                        name="period_order"
                        type="text"
                        inputMode="numeric"
                        defaultValue={hour.period_order}
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`hour-opens-at-${hour.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Abre
                      </label>

                      <input
                        id={`hour-opens-at-${hour.id}`}
                        name="opens_at"
                        type="text"
                        defaultValue={formatTimeForInput(hour.opens_at)}
                        placeholder="08:00"
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`hour-closes-at-${hour.id}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        Cierra
                      </label>

                      <input
                        id={`hour-closes-at-${hour.id}`}
                        name="closes_at"
                        type="text"
                        defaultValue={formatTimeForInput(hour.closes_at)}
                        placeholder="21:00"
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`hour-notes-${hour.id}`}
                      className="block text-sm font-semibold text-gray-800"
                    >
                      Nota visible
                    </label>

                    <textarea
                      id={`hour-notes-${hour.id}`}
                      name="notes"
                      defaultValue={hour.notes ?? ""}
                      rows={2}
                      placeholder="Ej. Horario especial de temporada."
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        name="is_closed"
                        defaultChecked={hour.is_closed}
                      />
                      Cerrado este día
                    </label>

                    <p className="mt-2 text-xs text-gray-500">
                      Si marcas el día como cerrado, se ignorarán las horas de
                      apertura y cierre.
                    </p>
                  </div>

                  <ConfirmSubmitButton
                    message="¿Guardar los cambios de este horario?"
                    className="w-full rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Guardar horario
                  </ConfirmSubmitButton>
                </form>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
          Este negocio todavía no tiene horarios registrados.
        </div>
      )}
    </section>
  );
}
