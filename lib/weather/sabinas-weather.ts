export type SabinasWeather = {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  time: string | null;
};

export type SabinasHourlyForecast = {
  time: string;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  weatherCode: number | null;
};

export type SabinasDailyForecast = {
  date: string;
  minTemperature: number | null;
  maxTemperature: number | null;
  weatherCode: number | null;
  sampleCount: number;
};

export type SabinasExtendedForecast = {
  hourly: SabinasHourlyForecast[];
  daily: SabinasDailyForecast[];
};

type MetInstantDetails = {
  air_temperature?: number;
  relative_humidity?: number;
  wind_speed?: number;
};

type MetPeriod = {
  details?: {
    precipitation_amount?: number;
    probability_of_precipitation?: number;
  };
  summary?: {
    symbol_code?: string;
  };
};

type MetTimeStep = {
  time: string;
  data: {
    instant?: {
      details?: MetInstantDetails;
    };
    next_1_hours?: MetPeriod;
    next_6_hours?: MetPeriod;
    next_12_hours?: MetPeriod;
  };
};

type MetResponse = {
  properties?: {
    timeseries?: MetTimeStep[];
  };
};

const SABINAS_LATITUDE = "26.50";
const SABINAS_LONGITUDE = "-100.18";

const MET_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact";

function validNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

/**
 * Calcula la temperatura aparente estimada (Steadman).
 *
 * Temperatura: Celsius.
 * Humedad: porcentaje de 0 a 100.
 * Viento: metros por segundo a 10 metros de altura.
 *
 * Fórmula sin radiación solar directa.
 */
function calculateApparentTemperature(
  temperature: number | null,
  humidity: number | null,
  windSpeed: number | null,
): number | null {
  if (
    temperature === null ||
    humidity === null ||
    windSpeed === null ||
    humidity < 0 ||
    humidity > 100 ||
    windSpeed < 0
  ) {
    return null;
  }

  const vaporPressure =
    (humidity / 100) *
    6.105 *
    Math.exp((17.27 * temperature) / (237.7 + temperature));

  const apparentTemperature =
    temperature + 0.33 * vaporPressure - 0.7 * windSpeed - 4;

  return Math.round(apparentTemperature * 10) / 10;
}

/**
 * Convierte símbolos de MET Norway a códigos WMO
 * compatibles con la interfaz actual de Sabinapp.
 */
function symbolToWeatherCode(
  symbol: string | null | undefined,
): number | null {
  if (!symbol) return null;

  const code = symbol.toLowerCase();

  if (code.includes("thunder")) return 95;

  if (code.includes("snow")) {
    return code.includes("heavy") ? 75 : 71;
  }

  if (code.includes("sleet")) return 66;

  if (code.includes("rain")) {
    if (code.includes("heavy")) return 65;
    if (code.includes("light")) return 61;
    return 63;
  }

  if (code.includes("drizzle")) return 51;
  if (code.includes("fog")) return 45;
  if (code.includes("partlycloudy")) return 2;
  if (code.includes("cloudy")) return 3;
  if (code.includes("fair")) return 1;
  if (code.includes("clearsky")) return 0;

  return null;
}

export function getWeatherCodeLabel(code: number | null) {
  if (code === null) {
    return "Clima no disponible";
  }

  if (code === 0) {
    return "Despejado";
  }

  if ([1, 2].includes(code)) {
    return "Parcialmente nublado";
  }

  if (code === 3) {
    return "Nublado";
  }

  if ([45, 48].includes(code)) {
    return "Neblina";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "Llovizna";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Lluvia";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "Nieve";
  }

  if ([95, 96, 99].includes(code)) {
    return "Tormenta";
  }

  return "Condición variable";
}

export function getWeatherAdvice(weather: SabinasWeather | null) {
  if (!weather) {
    return "Por ahora no pudimos cargar el clima. Vuelve a intentar más tarde.";
  }

  const temperature = weather.temperature ?? weather.apparentTemperature;
  const windSpeed = weather.windSpeed;
  const precipitation = weather.precipitation;

  if (precipitation !== null && precipitation > 0) {
    return "Se pronostica lluvia para la próxima hora. Lleva paraguas o revisa el pronóstico.";
  }

  if (temperature !== null && temperature >= 35) {
    return "Hace calor fuerte. Hidrátate y evita sol directo por mucho tiempo.";
  }

  if (temperature !== null && temperature <= 12) {
    return "El ambiente está fresco. Lleva algo para cubrirte.";
  }

  if (windSpeed !== null && windSpeed >= 30) {
    return "Hay viento notable. Ten cuidado si sales en moto o carretera.";
  }

  return "Consulta las condiciones antes de explorar negocios y actividades locales.";
}

function getWeatherTemperature(weather: SabinasWeather | null) {
  if (!weather) {
    return null;
  }

  return weather.apparentTemperature ?? weather.temperature ?? null;
}

export function getWeatherHeatRisk(weather: SabinasWeather | null) {
  const temperature = getWeatherTemperature(weather);
  const humidity = weather?.humidity ?? null;

  if (typeof temperature !== "number") {
    return {
      label: "Sin dato suficiente",
      description:
        "No hay lectura suficiente para estimar el riesgo por calor en este momento.",
    };
  }

  const humidHeat =
    typeof humidity === "number" && humidity >= 55 && temperature >= 32;

  if (temperature >= 40) {
    return {
      label: "Muy alto",
      description:
        "Evita sol directo, toma agua y procura hacer vueltas temprano o al atardecer.",
    };
  }

  if (temperature >= 36 || humidHeat) {
    return {
      label: "Alto",
      description:
        "El ambiente puede sentirse pesado. Conviene reducir caminatas largas y buscar sombra.",
    };
  }

  if (temperature >= 32) {
    return {
      label: "Moderado",
      description:
        "Buen momento para salir con agua a la mano y pausas si estarás en exterior.",
    };
  }

  if (temperature <= 12) {
    return {
      label: "Fresco",
      description:
        "Considera llevar chamarra ligera, sobre todo si sales temprano o tarde.",
    };
  }

  return {
    label: "Bajo",
    description:
      "Las condiciones térmicas previstas son manejables para actividades habituales.",
  };
}

export function getWeatherOutdoorPlan(weather: SabinasWeather | null) {
  if (!weather) {
    return "Por ahora no pudimos cargar datos suficientes. Intenta de nuevo más tarde.";
  }

  const temperature = getWeatherTemperature(weather);
  const precipitation = weather.precipitation;
  const windSpeed = weather.windSpeed;

  if (precipitation !== null && precipitation > 0) {
    return "Se pronostica lluvia próxima. Considera llevar paraguas y manejar con cuidado.";
  }

  if (typeof temperature === "number" && temperature >= 36) {
    return "Mejor hacer vueltas temprano o al atardecer. Evita caminar mucho bajo el sol.";
  }

  if (windSpeed !== null && windSpeed >= 35) {
    return "Hay viento fuerte previsto. Ten precaución al salir.";
  }

  return "Revisa las condiciones antes de visitar negocios locales o salir a caminar.";
}

export function getWeatherBusinessPlan(weather: SabinasWeather | null) {
  if (!weather) {
    return "Sin datos suficientes para anticipar condiciones. Mantén tus horarios normales y revisa más tarde.";
  }

  const temperature = getWeatherTemperature(weather);
  const precipitation = weather.precipitation;
  const windSpeed = weather.windSpeed;

  if (precipitation !== null && precipitation > 0) {
    return "La lluvia prevista podría reducir visitas presenciales. Destaca servicio a domicilio y pedidos por mensaje.";
  }

  if (typeof temperature === "number" && temperature >= 36) {
    return "Con calor intenso, considera promocionar entregas y productos frescos.";
  }

  if (windSpeed !== null && windSpeed >= 35) {
    return "El viento podría afectar mesas exteriores, anuncios ligeros o traslados. Revisa lo que tengas afuera del negocio.";
  }

  return "Mantén visibles tus horarios, productos y canales de contacto.";
}

/**
 * Consulta el pronóstico meteorológico para Sabinas Hidalgo.
 *
 * Importante:
 * MET Norway entrega pronósticos, no observaciones
 * meteorológicas locales en tiempo real.
 *
 * windSpeed se devuelve en km/h para conservar
 * el contrato utilizado por Sabinapp.
 *
 * precipitation representa milímetros pronosticados
 * para la próxima hora, no lluvia observada.
 */
type MetCacheEntry = {
  payload: MetResponse;
  expiresAt: number;
  lastModified: string | null;
  validatedAt: number;
};

const MET_MAX_STALE_MS = 12 * 60 * 60 * 1000;
const MET_ERROR_RETRY_MS = 5 * 60 * 1000;
const MET_RATE_LIMIT_RETRY_MS = 60 * 60 * 1000;
const MET_FALLBACK_EXPIRATION_MS = 3 * 60 * 60 * 1000;

let metCache: MetCacheEntry | null = null;
let pendingMetRequest: Promise<MetResponse | null> | null = null;
let nextMetRetryAt = 0;

function getMetExpiration(value: string | null): number {
  const parsed = value ? Date.parse(value) : NaN;

  return Number.isFinite(parsed) && parsed > Date.now()
    ? parsed
    : Date.now() + MET_FALLBACK_EXPIRATION_MS;
}

function getUsableCachedForecast(): MetResponse | null {
  if (!metCache) return null;

  if (Date.now() - metCache.validatedAt > MET_MAX_STALE_MS) {
    return null;
  }

  return metCache.payload;
}

function scheduleMetRetry(milliseconds: number) {
  nextMetRetryAt = Date.now() + milliseconds;
}

async function fetchMetForecast(
  userAgent: string,
  params: URLSearchParams,
): Promise<MetResponse | null> {
  if (metCache && Date.now() < metCache.expiresAt) {
    return getUsableCachedForecast();
  }

  if (pendingMetRequest) {
    return pendingMetRequest;
  }

  if (Date.now() < nextMetRetryAt) {
    return getUsableCachedForecast();
  }

  pendingMetRequest = (async () => {
    try {
      const headers: Record<string, string> = {
        "User-Agent": userAgent,
        Accept: "application/json",
      };

      if (metCache?.lastModified) {
        headers["If-Modified-Since"] = metCache.lastModified;
      }

      const response = await fetch(
        `${MET_URL}?${params.toString()}`,
        {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        },
      );

      if (response.status === 304) {
        if (!metCache) {
          scheduleMetRetry(MET_ERROR_RETRY_MS);
          return null;
        }

        metCache = {
          ...metCache,
          expiresAt: getMetExpiration(
            response.headers.get("Expires"),
          ),
          lastModified:
            response.headers.get("Last-Modified") ??
            metCache.lastModified,
          validatedAt: Date.now(),
        };

        nextMetRetryAt = 0;
        return metCache.payload;
      }

      if (!response.ok) {
        console.error(
          `[Sabinapp Weather] Error HTTP ${response.status}`,
        );

        scheduleMetRetry(
          response.status === 429 || response.status === 403
            ? MET_RATE_LIMIT_RETRY_MS
            : MET_ERROR_RETRY_MS,
        );

        return getUsableCachedForecast();
      }

      const payload = (await response.json()) as MetResponse;
      const timeseries = payload.properties?.timeseries;

      if (
        !Array.isArray(timeseries) ||
        timeseries.length === 0 ||
        !timeseries.some(
          (step) =>
            typeof step.time === "string" &&
            Number.isFinite(Date.parse(step.time)) &&
            step.data?.instant?.details &&
            typeof step.data.instant.details.air_temperature ===
              "number",
        )
      ) {
        console.error(
          "[Sabinapp Weather] Respuesta meteorológica inválida.",
        );

        scheduleMetRetry(MET_ERROR_RETRY_MS);
        return getUsableCachedForecast();
      }

      metCache = {
        payload,
        expiresAt: getMetExpiration(
          response.headers.get("Expires"),
        ),
        lastModified: response.headers.get("Last-Modified"),
        validatedAt: Date.now(),
      };

      nextMetRetryAt = 0;
      return payload;
    } catch (error) {
      console.error(
        "[Sabinapp Weather] Error de conexión:",
        error instanceof Error ? error.message : "Desconocido",
      );

      scheduleMetRetry(MET_ERROR_RETRY_MS);
      return getUsableCachedForecast();
    }
  })();

  try {
    return await pendingMetRequest;
  } finally {
    pendingMetRequest = null;
  }
}

export async function getSabinasWeather(): Promise<SabinasWeather | null> {
  const userAgent = process.env.SABINAPP_MET_USER_AGENT?.trim();

  if (!userAgent) {
    console.error(
      "[Sabinapp Weather] Falta SABINAPP_MET_USER_AGENT.",
    );
    return null;
  }

  const params = new URLSearchParams({
    lat: SABINAS_LATITUDE,
    lon: SABINAS_LONGITUDE,
  });

  try {
    const payload = await fetchMetForecast(userAgent, params);

    if (!payload) {
      return null;
    }

    const timeseries = payload.properties?.timeseries;

    if (!Array.isArray(timeseries) || timeseries.length === 0) {
      return null;
    }

    const now = Date.now();

    const current =
      timeseries.find(
        (step) =>
          Number.isFinite(Date.parse(step.time)) &&
          Date.parse(step.time) >= now,
      ) ?? timeseries[timeseries.length - 1];

    const instant = current.data.instant?.details;

    if (!instant) {
      return null;
    }

    const nextHour = current.data.next_1_hours;

    const symbol =
      nextHour?.summary?.symbol_code ??
      current.data.next_6_hours?.summary?.symbol_code ??
      current.data.next_12_hours?.summary?.symbol_code ??
      null;

    const windMetersPerSecond = validNumber(
      instant.wind_speed,
    );

    return {
      temperature: validNumber(instant.air_temperature),

      // MET Norway no proporciona este valor directamente
      // en la respuesta compacta.
      apparentTemperature: calculateApparentTemperature(
        validNumber(instant.air_temperature),
        validNumber(instant.relative_humidity),
        windMetersPerSecond,
      ),

      humidity: validNumber(instant.relative_humidity),

      precipitation: validNumber(
        nextHour?.details?.precipitation_amount,
      ),

      weatherCode: symbolToWeatherCode(symbol),

      windSpeed:
        windMetersPerSecond === null
          ? null
          : Math.round(windMetersPerSecond * 3.6 * 10) / 10,

      time: current.time ?? null,
    };
  } catch (error) {
    console.error(
      "[Sabinapp Weather] No se pudo obtener el pronóstico:",
      error instanceof Error ? error.message : "Error desconocido",
    );

    return null;
  }
}

const SABINAS_TIME_ZONE = "America/Monterrey";

function getLocalDateKey(time: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SABINAS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(time));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function getLocalHour(time: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SABINAS_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(time));

  return Number(
    parts.find((part) => part.type === "hour")?.value ?? 0,
  );
}

function getStepWeatherCode(step: MetTimeStep): number | null {
  const symbol =
    step.data.next_1_hours?.summary?.symbol_code ??
    step.data.next_6_hours?.summary?.symbol_code ??
    step.data.next_12_hours?.summary?.symbol_code;

  return symbolToWeatherCode(symbol);
}

export async function getSabinasExtendedForecast():
  Promise<SabinasExtendedForecast | null> {
  const userAgent = process.env.SABINAPP_MET_USER_AGENT?.trim();

  if (!userAgent) {
    return null;
  }

  const params = new URLSearchParams({
    lat: SABINAS_LATITUDE,
    lon: SABINAS_LONGITUDE,
  });

  const payload = await fetchMetForecast(userAgent, params);
  const timeseries = payload?.properties?.timeseries;

  if (!Array.isArray(timeseries) || timeseries.length === 0) {
    return null;
  }

  const now = Date.now();
  const tomorrow = now + 24 * 60 * 60 * 1000;
  const todayKey = getLocalDateKey(new Date(now).toISOString());

  const futureSteps = timeseries
    .filter((step) => {
      const time = Date.parse(step.time);
      return Number.isFinite(time) && time >= now;
    })
    .sort(
      (a, b) => Date.parse(a.time) - Date.parse(b.time),
    );

  const hourly: SabinasHourlyForecast[] = futureSteps
    .filter(
      (step) =>
        Date.parse(step.time) < tomorrow &&
        step.data.next_1_hours !== undefined &&
        validNumber(
          step.data.instant?.details?.air_temperature,
        ) !== null,
    )
    .slice(0, 24)
    .map((step) => {
      const instant = step.data.instant?.details;
      const wind = validNumber(instant?.wind_speed);

      return {
        time: step.time,
        temperature: validNumber(instant?.air_temperature),
        humidity: validNumber(instant?.relative_humidity),
        windSpeed:
          wind === null
            ? null
            : Math.round(wind * 36) / 10,
        precipitation: validNumber(
          step.data.next_1_hours?.details?.precipitation_amount,
        ),
        weatherCode: getStepWeatherCode(step),
      };
    });

  const grouped = new Map<string, MetTimeStep[]>();

  for (const step of futureSteps) {
    const key = getLocalDateKey(step.time);

    if (key < todayKey) continue;

    const group = grouped.get(key) ?? [];
    group.push(step);
    grouped.set(key, group);
  }

  const daily: SabinasDailyForecast[] = Array.from(
    grouped.entries(),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 7)
    .map(([date, steps]) => {
      const temperatures = steps
        .map((step) =>
          validNumber(
            step.data.instant?.details?.air_temperature,
          ),
        )
        .filter((value): value is number => value !== null);

      const representative = [...steps]
        .filter((step) => getStepWeatherCode(step) !== null)
        .sort(
          (a, b) =>
            Math.abs(getLocalHour(a.time) - 12) -
            Math.abs(getLocalHour(b.time) - 12),
        )[0];

      return {
        date,
        minTemperature:
          temperatures.length > 0
            ? Math.min(...temperatures)
            : null,
        maxTemperature:
          temperatures.length > 0
            ? Math.max(...temperatures)
            : null,
        weatherCode: representative
          ? getStepWeatherCode(representative)
          : null,
        sampleCount: temperatures.length,
      };
    });

  return { hourly, daily };
}
