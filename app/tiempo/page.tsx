import type { Metadata } from "next";
import Link from "next/link";
import {
  getSabinasWeather,
  getWeatherAdvice,
  getWeatherCodeLabel,
} from "@/lib/weather/sabinas-weather";


export const metadata: Metadata = {
  title: "Clima de Sabinas Hidalgo | Sabinapp",
  description:
    "Consulta el clima actual de Sabinas Hidalgo, temperatura, sensación térmica, humedad, viento y recomendación rápida.",
  openGraph: {
    title: "Clima de Sabinas Hidalgo | Sabinapp",
    description:
      "Clima actual y recomendación rápida para Sabinas Hidalgo.",
    type: "website",
  },
};


export default async function WeatherPage() {
  const weather = await getSabinasWeather();

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-orange-50 px-6 py-10 text-gray-950">
      <div className="mx-auto max-w-4xl">
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
              Tiempo en Sabinas Hidalgo
            </h1>

            <p className="mt-4 max-w-2xl text-white/85">
              Resumen rápido para decidir si salir, visitar negocios o planear
              actividades en la ciudad.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <article className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <p className="text-sm font-semibold text-gray-500">
                Temperatura actual
              </p>

              <p className="mt-3 text-5xl font-black">
                {weather?.temperature !== null && weather?.temperature !== undefined
                  ? `${Math.round(weather.temperature)}°C`
                  : "No disponible"}
              </p>

              <p className="mt-3 text-sm font-semibold text-sky-700">
                {getWeatherCodeLabel(weather?.weatherCode ?? null)}
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <p className="text-sm font-semibold text-gray-500">
                Recomendación
              </p>

              <p className="mt-3 text-lg font-bold leading-7">
                {getWeatherAdvice(weather)}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                Actualización aproximada: {weather?.time ?? "sin dato"}
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-semibold text-gray-500">
                Sensación térmica
              </p>

              <p className="mt-3 text-3xl font-black">
                {weather?.apparentTemperature !== null &&
                weather?.apparentTemperature !== undefined
                  ? `${Math.round(weather.apparentTemperature)}°C`
                  : "No disponible"}
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-semibold text-gray-500">
                Viento y humedad
              </p>

              <p className="mt-3 text-3xl font-black">
                {weather?.windSpeed !== null && weather?.windSpeed !== undefined
                  ? `${Math.round(weather.windSpeed)} km/h`
                  : "Viento sin dato"}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Humedad:{" "}
                {weather?.humidity !== null && weather?.humidity !== undefined
                  ? `${weather.humidity}%`
                  : "sin dato"}
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
