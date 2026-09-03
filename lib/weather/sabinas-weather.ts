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
      "El clima se ve manejable para mandados, compras o visitas a negocios locales.",
  };
}

export function getWeatherOutdoorPlan(weather: SabinasWeather | null) {
  if (!weather) {
    return "Por ahora no pudimos cargar datos suficientes. Intenta de nuevo más tarde.";
  }

  const temperature = getWeatherTemperature(weather);
  const precipitation = weather.precipitation ?? 0;
  const windSpeed = weather.windSpeed ?? 0;

  if (precipitation > 0) {
    return "Sal con tiempo, maneja con cuidado y considera llevar paraguas o impermeable.";
  }

  if (typeof temperature === "number" && temperature >= 36) {
    return "Mejor hacer vueltas temprano o al atardecer. Evita caminar mucho bajo el sol.";
  }

  if (windSpeed >= 35) {
    return "Buen día para salir, pero con precaución por viento fuerte.";
  }

  return "Buen momento para visitar negocios locales, hacer mandados o salir a caminar.";
}

export function getWeatherBusinessPlan(weather: SabinasWeather | null) {
  if (!weather) {
    return "Sin datos suficientes para anticipar movimiento. Mantén tus horarios normales y revisa más tarde.";
  }

  const temperature = getWeatherTemperature(weather);
  const precipitation = weather.precipitation ?? 0;
  const windSpeed = weather.windSpeed ?? 0;

  if (precipitation > 0) {
    return "Puede bajar el flujo peatonal. Conviene publicar horarios, servicio a domicilio o pedidos por mensaje.";
  }

  if (typeof temperature === "number" && temperature >= 36) {
    return "El movimiento puede concentrarse temprano, al atardecer o por pedidos rápidos. Destaca opciones frescas o entrega.";
  }

  if (windSpeed >= 35) {
    return "Puede afectar mesas exteriores, anuncios ligeros o traslados. Revisa lo que tengas afuera del negocio.";
  }

  return "Buen clima para recibir visitas, promocionar productos del día y mantener visibles tus canales de contacto.";
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
