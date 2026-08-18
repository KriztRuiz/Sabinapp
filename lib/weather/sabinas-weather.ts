export type SabinasWeather = {
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  time: string | null;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    time?: string;
  };
};

const SABINAS_LATITUDE = "26.50";
const SABINAS_LONGITUDE = "-100.18";

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
  const windSpeed = weather.windSpeed ?? 0;
  const precipitation = weather.precipitation ?? 0;

  if (precipitation > 0) {
    return "Puede haber lluvia. Lleva paraguas o revisa el pronóstico.";
  }

  if (temperature !== null && temperature >= 35) {
    return "Hace calor fuerte. Hidrátate y evita sol directo por mucho tiempo.";
  }

  if (temperature !== null && temperature <= 12) {
    return "El ambiente está fresco. Lleva algo para cubrirte.";
  }

  if (windSpeed >= 30) {
    return "Hay viento notable. Ten cuidado si sales en moto o carretera.";
  }

  return "Buen momento para explorar negocios y actividades locales.";
}

export async function getSabinasWeather(): Promise<SabinasWeather | null> {
  const params = new URLSearchParams({
    latitude: SABINAS_LATITUDE,
    longitude: SABINAS_LONGITUDE,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    timezone: "America/Monterrey",
  });

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      {
        next: {
          revalidate: 600,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    const current = payload.current;

    if (!current) {
      return null;
    }

    return {
      temperature: current.temperature_2m ?? null,
      apparentTemperature: current.apparent_temperature ?? null,
      humidity: current.relative_humidity_2m ?? null,
      precipitation: current.precipitation ?? null,
      weatherCode: current.weather_code ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      time: current.time ?? null,
    };
  } catch {
    return null;
  }
}
