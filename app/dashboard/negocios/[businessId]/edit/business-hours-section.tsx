import type { BusinessEditBusiness } from "./business-edit-types";

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

function formatTime(value: string | null) {
  if (!value) {
    return "Sin horario";
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
        <div className="mt-6 grid gap-3">
          {business.hours.map((hour) => (
            <article
              key={hour.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
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

              <p className="mt-4 text-sm font-semibold text-gray-800">
                {hour.is_closed
                  ? "Cerrado todo el día"
                  : `${formatTime(hour.opens_at)} - ${formatTime(
                      hour.closes_at,
                    )}`}
              </p>

              {hour.notes ? (
                <p className="mt-2 text-sm text-gray-600">{hour.notes}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
          Este negocio todavía no tiene horarios registrados.
        </div>
      )}
    </section>
  );
}
