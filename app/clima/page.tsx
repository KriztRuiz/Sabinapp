import type { Metadata } from "next";
import Link from "next/link";
import {
  getSabinasWeather,
  getWeatherAdvice,
  getWeatherBusinessPlan,
  getWeatherCodeLabel,
  getWeatherHeatRisk,
  getWeatherOutdoorPlan,
} from "@/lib/weather/sabinas-weather";

export const metadata: Metadata = {
  title: "Clima de Sabinas Hidalgo | Sabinapp",
  description:
    "Consulta el clima actual de Sabinas Hidalgo: temperatura, sensación térmica, humedad, viento, lluvia y recomendación rápida.",
  openGraph: {
    title: "Clima de Sabinas Hidalgo | Sabinapp",
    description:
      "Clima actual, datos principales y recomendación rápida para Sabinas Hidalgo.",
    type: "website",
  },
};

function formatWeatherTime(value: string | null | undefined) {
  if (!value) {
    return "sin dato";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Monterrey",
  }).format(date);
}

function formatTemperature(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "No disponible";
  }

  return `${Math.round(value)}°C`;
}

function formatWind(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Sin dato";
  }

  return `${Math.round(value)} km/h`;
}

function formatHumidity(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Sin dato";
  }

  return `${value}%`;
}

function formatPrecipitation(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Sin dato";
  }

  if (value <= 0) {
    return "Sin lluvia registrada";
  }

  return `${value.toFixed(1)} mm`;
}

function getHeatStatus(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Dato no disponible por ahora.";
  }

  if (value >= 38) {
    return "Calor muy fuerte. Conviene evitar sol directo por mucho tiempo.";
  }

  if (value >= 34) {
    return "Calor fuerte. Lleva agua y busca sombra.";
  }

  if (value >= 28) {
    return "Ambiente cálido. Buen clima para salir con precaución.";
  }

  if (value >= 18) {
    return "Temperatura cómoda para moverte por la ciudad.";
  }

  return "Ambiente fresco. Considera llevar chamarra ligera.";
}

function getWindStatus(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Sin lectura de viento.";
  }

  if (value >= 40) {
    return "Viento fuerte. Ten cuidado al manejar o andar en moto.";
  }

  if (value >= 25) {
    return "Viento moderado. Puede sentirse más fresco en exteriores.";
  }

  return "Viento tranquilo para actividades normales.";
}

function getRainStatus(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Sin lectura de lluvia.";
  }

  if (value > 0) {
    return "Hay registro de lluvia. Revisa antes de salir.";
  }

  return "No hay lluvia registrada en la lectura actual.";
}

export default async function WeatherPage() {
  const weather = await getSabinasWeather();

  const mainTemperature =
    weather?.temperature ?? weather?.apparentTemperature ?? null;

  const weatherCards = [
    {
      title: "Sensación térmica",
      value: formatTemperature(weather?.apparentTemperature),
      description: getHeatStatus(weather?.apparentTemperature ?? mainTemperature),
    },
    {
      title: "Viento",
      value: formatWind(weather?.windSpeed),
      description: getWindStatus(weather?.windSpeed),
    },
    {
      title: "Humedad",
      value: formatHumidity(weather?.humidity),
      description: "Ayuda a entender qué tan pesado se puede sentir el ambiente.",
    },
    {
      title: "Lluvia",
      value: formatPrecipitation(weather?.precipitation),
      description: getRainStatus(weather?.precipitation),
    },
  ];

  const heatRisk = getWeatherHeatRisk(weather);
  const outdoorPlan = getWeatherOutdoorPlan(weather);
  const businessPlan = getWeatherBusinessPlan(weather);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-orange-50 px-6 py-10 text-gray-950">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          ← Volver a Sabinapp
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl shadow-sky-900/5">
          <div className="bg-gradient-to-br from-sky-600 via-cyan-600 to-orange-500 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/80">
              Clima local
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Clima en Sabinas Hidalgo
            </h1>

            <p className="mt-4 max-w-2xl text-white/85">
              Revisa el clima actual antes de salir, visitar negocios, hacer
              mandados o planear actividades en la ciudad.
            </p>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <p className="text-sm font-semibold text-gray-500">
                Temperatura actual
              </p>

              <p className="mt-3 text-6xl font-black">
                {formatTemperature(mainTemperature)}
              </p>

              <p className="mt-3 text-base font-black text-sky-700">
                {getWeatherCodeLabel(weather?.weatherCode ?? null)}
              </p>

              <p className="mt-5 leading-7 text-gray-600">
                {getWeatherAdvice(weather)}
              </p>

              <p className="mt-5 text-sm text-gray-500">
                Actualización aproximada: {formatWeatherTime(weather?.time)}
              </p>
            </article>

            <article className="rounded-3xl border border-orange-100 bg-orange-50 p-6">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">
                Recomendación rápida
              </p>

              <h2 className="mt-3 text-2xl font-black">
                ¿Conviene salir ahora?
              </h2>

              <p className="mt-4 text-lg font-bold leading-8 text-gray-800">
                {outdoorPlan}
              </p>
            </article>
          </div>

          <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
            {weatherCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <p className="text-sm font-semibold text-gray-500">
                  {card.title}
                </p>

                <p className="mt-3 text-3xl font-black">{card.value}</p>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {card.description}
                </p>
              </article>
            ))}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <h2 className="text-xl font-black">Lectura práctica del clima</h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Una lectura rápida para decidir si conviene salir, comprar, vender
              o ajustar la atención del día.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="font-black">Para usuarios</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {outdoorPlan}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="font-black">Para negocios</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {businessPlan}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="font-black">Riesgo por calor</p>
                <p className="mt-2 text-lg font-black text-orange-700">
                  {heatRisk.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {heatRisk.description}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
