import {
  addBusinessHour,
  deleteBusinessHour,
  updateBusinessHourDetails,
} from "./actions";
import type { BusinessEditBusiness } from "./business-edit-types";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { TimeInput } from "./time-input";
import { FieldGuide } from "./field-guide";

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
  const addHourWithBusinessId = addBusinessHour.bind(null, business.id);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-950">Horarios públicos</h2>

      <p className="mt-2 text-sm text-gray-600">
        Estos horarios aparecen en la landing pública del negocio.
      </p>

      <FieldGuide
        title="Guía para horarios públicos"
        description="Agrega los horarios en que normalmente atiende el negocio. Si hay descansos, turnos partidos o días especiales, usa las notas para aclararlo."
        goodExample="Lunes a sábado 08:00 - 21:00. Nota: Cerrado de 14:00 a 16:00."
        avoid="Evita poner horarios que no puedas respetar. Si el horario cambia seguido, acláralo en notas."
      />

      <form
        action={addHourWithBusinessId}
        className="mt-6 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 p-5"
      >
        <h3 className="text-base font-black text-gray-950">
          Agregar nuevo horario
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <label
              htmlFor="new-hour-day-of-week"
              className="block text-sm font-semibold text-gray-800"
            >
              Día
            </label>

            <select
              id="new-hour-day-of-week"
              name="day_of_week"
              defaultValue="1"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {dayNames.map((dayName, dayIndex) => (
                <option key={dayName} value={dayIndex}>
                  {dayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="new-hour-period-order"
              className="block text-sm font-semibold text-gray-800"
            >
              Periodo
            </label>

            <input
              id="new-hour-period-order"
              name="period_order"
              type="text"
              inputMode="numeric"
              defaultValue="1"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="new-hour-opens-at"
              className="block text-sm font-semibold text-gray-800"
            >
              Abre
            </label>

            <TimeInput
              id="new-hour-opens-at"
              name="opens_at"
              defaultValue=""
              placeholder="08:00"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label
              htmlFor="new-hour-closes-at"
              className="block text-sm font-semibold text-gray-800"
            >
              Cierra
            </label>

            <TimeInput
              id="new-hour-closes-at"
              name="closes_at"
              defaultValue=""
              placeholder="21:00"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="new-hour-notes"
            className="block text-sm font-semibold text-gray-800"
          >
            Nota visible
          </label>

          <textarea
            id="new-hour-notes"
            name="notes"
            rows={2}
            placeholder="Ej. Horario especial de temporada."
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-orange-200 bg-white p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" name="is_closed" />
            Cerrado este día
          </label>

          <p className="mt-2 text-xs text-gray-500">
            Si marcas el día como cerrado, se ignorarán las horas de apertura y
            cierre.
          </p>
        </div>

        <ConfirmSubmitButton
          message="¿Agregar este horario al negocio?"
          className="mt-5 w-full rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Agregar horario
        </ConfirmSubmitButton>
      </form>

      {business.hours.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {business.hours.map((hour) => {
            const updateHourWithIds = updateBusinessHourDetails.bind(
              null,
              business.id,
              hour.id,
            );

            const deleteHourWithIds = deleteBusinessHour.bind(
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

                      <TimeInput
                        id={`hour-opens-at-${hour.id}`}
                        name="opens_at"
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

                      <TimeInput
                        id={`hour-closes-at-${hour.id}`}
                        name="closes_at"
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

                <form action={deleteHourWithIds} className="mt-4">
                  <ConfirmSubmitButton
                    message="¿Eliminar este horario? Esta acción no se puede deshacer."
                    className="w-full rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Eliminar horario
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
