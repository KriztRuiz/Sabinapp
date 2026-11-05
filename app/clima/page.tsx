import type { Metadata } from "next";
import { FixedAdBanner } from "@/components/ads/fixed-ad-banner";
import { PublicInterstitial } from "@/components/ads/public-interstitial";
import Link from "next/link";
import { getPublicAds } from "@/lib/ads/public-ads";
import { createClient } from "@/lib/supabase/server";
import {
  getSabinasExtendedForecast,
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
    "Consulta el pronóstico del tiempo en Sabinas Hidalgo: temperatura prevista, sensación térmica estimada, humedad, viento y lluvia.",
  openGraph: {
    title: "Clima de Sabinas Hidalgo | Sabinapp",
    description:
      "Pronóstico meteorológico, condiciones previstas y recomendaciones para Sabinas Hidalgo.",
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
    return "Sin pronóstico disponible";
  }

  if (value <= 0) {
    return "Sin lluvia prevista";
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
    return "No hay pronóstico de precipitación disponible para la próxima hora.";
  }

  if (value > 0) {
    return "Se pronostica lluvia para la próxima hora. Revisa las condiciones antes de salir.";
  }

  return "No se pronostica lluvia durante la próxima hora.";
}


const forecastHourFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Monterrey",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const forecastDayFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Monterrey",
  weekday: "long",
  day: "numeric",
  month: "short",
});

function formatForecastDay(date: string): string {
  return forecastDayFormatter.format(
    new Date(`${date}T12:00:00Z`),
  );
}

export default async function WeatherPage() {
  const publicInterstitialEnabled =
    process.env.SABINAPP_INTERSTITIAL_PUBLIC_ENABLED === "true";

  const supabase = await createClient();

  const [weather, extendedForecast, adsResult, authResult] = await Promise.all([
    getSabinasWeather(),
    getSabinasExtendedForecast(),
    getPublicAds({
      placement: "clima",
      includeInterstitial: publicInterstitialEnabled,
    }),
    supabase.auth.getUser(),
  ]);

  const {
    data: { user },
  } = authResult;

  const mainTemperature =
    weather?.temperature ?? weather?.apparentTemperature ?? null;

  const weatherCards = [
    {
      title: "Sensación térmica estimada",
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
      title: "Lluvia próxima hora",
      value: formatPrecipitation(weather?.precipitation),
      description: getRainStatus(weather?.precipitation),
    },
  ];

  const heatRisk = getWeatherHeatRisk(weather);
  const outdoorPlan = getWeatherOutdoorPlan(weather);
  const businessPlan = getWeatherBusinessPlan(weather);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-orange-50 px-6 py-10 text-gray-950">
      <PublicInterstitial
        ads={adsResult.ads}
        enabled={publicInterstitialEnabled}
        viewerId={user?.id ?? null}
      />
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
              Consulta el pronóstico del tiempo antes de salir, visitar negocios,
              hacer mandados o planear actividades en la ciudad.
            </p>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
              <p className="text-sm font-semibold text-gray-500">
                Temperatura prevista
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
                Pronóstico válido para: {formatWeatherTime(weather?.time)}
              </p>
              <p className="mt-3 text-xs leading-5 text-gray-500">
                Datos meteorológicos de{" "}
                <a
                  href="https://www.met.no/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-sky-700"
                >
                  MET Norway
                </a>
                {" · "}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-sky-700"
                >
                  CC BY 4.0
                </a>
                . Sabinapp adapta símbolos, convierte unidades y
                calcula una sensación térmica estimada.
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

        <section className="mt-8 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
              Pronóstico horario
            </p>
            <h2 className="mt-2 text-2xl font-black text-gray-950">
              Próximas 24 horas
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Horarios disponibles del pronóstico para Sabinas Hidalgo.
              Las horas se muestran en horario local.
            </p>
          </div>

          {extendedForecast?.hourly.length ? (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-4">
              {extendedForecast.hourly.map((hour) => (
                <article
                  key={hour.time}
                  className="min-w-40 flex-shrink-0 rounded-2xl border border-sky-100 bg-sky-50 p-4"
                >
                  <p className="text-sm font-bold text-sky-800">
                    {forecastHourFormatter.format(new Date(hour.time))}
                  </p>
                  <p className="mt-3 text-3xl font-black text-gray-950">
                    {formatTemperature(hour.temperature)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    {getWeatherCodeLabel(hour.weatherCode)}
                  </p>
                  <p className="mt-3 text-xs text-gray-600">
                    Viento: {formatWind(hour.windSpeed)}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Humedad: {formatHumidity(hour.humidity)}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Lluvia:{" "}
                    {hour.precipitation === null
                      ? "Sin dato"
                      : `${hour.precipitation} mm`}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-600">
              No hay pronóstico horario disponible en este momento.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
              Pronóstico diario
            </p>
            <h2 className="mt-2 text-2xl font-black text-gray-950">
              Próximos 7 días
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Temperaturas mínimas y máximas de las muestras
              disponibles del pronóstico. El primer día puede
              incluir solamente las horas restantes.
            </p>
          </div>

          {extendedForecast?.daily.length ? (
            <div className="mt-5 space-y-3">
              {extendedForecast.daily.map((day) => (
                <article
                  key={day.date}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold capitalize text-gray-950">
                      {formatForecastDay(day.date)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {getWeatherCodeLabel(day.weatherCode)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-950">
                      {formatTemperature(day.maxTemperature)}
                      <span className="mx-2 text-gray-400">/</span>
                      <span className="text-sky-700">
                        {formatTemperature(day.minTemperature)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Máxima / mínima estimadas
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-600">
              No hay pronóstico diario disponible en este momento.
            </p>
          )}
        </section>

        <section className="mt-8">
          <FixedAdBanner ads={adsResult.ads} heading="Promoción local" />
        </section>
      </div>
    </main>
  );
}
