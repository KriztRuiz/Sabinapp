import test from "node:test";
import assert from "node:assert/strict";

test("G2-D.2: cache de MET Norway", async () => {
  const realFetch = globalThis.fetch;
  const realNow = Date.now;
  const realUserAgent = process.env.SABINAPP_MET_USER_AGENT;

  let now = Date.parse("2026-11-01T18:00:00Z");
  let requests = 0;
  let mode = "200";
  let conditionalHeader = null;

  Date.now = () => now;
  process.env.SABINAPP_MET_USER_AGENT =
    "Sabinapp-Test/1.0 (test@example.com)";

  const payload = {
    properties: {
      timeseries: [
        {
          time: "2026-11-01T19:00:00Z",
          data: {
            instant: {
              details: {
                air_temperature: 27,
                relative_humidity: 75,
                wind_speed: 4,
              },
            },
            next_1_hours: {
              summary: { symbol_code: "cloudy" },
              details: { precipitation_amount: 0 },
            },
          },
        },
      ],
    },
  };

  globalThis.fetch = async (_url, options) => {
    requests++;
    conditionalHeader =
      options.headers["If-Modified-Since"] ?? null;

    const headers = {
      Expires: new Date(now + 60000).toUTCString(),
      "Last-Modified": "Sun, 01 Nov 2026 17:00:00 GMT",
    };

    if (mode === "200") {
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers,
      });
    }

    if (mode === "304") {
      return new Response(null, {
        status: 304,
        headers,
      });
    }

    if (mode === "429") {
      return new Response(null, { status: 429 });
    }

    throw new Error("Fallo de red simulado");
  };

  try {
    const { getSabinasWeather } = await import(
      "../lib/weather/sabinas-weather.ts"
    );

    // 1. HTTP 200 y solicitudes simultaneas.
    const [first, simultaneous] = await Promise.all([
      getSabinasWeather(),
      getSabinasWeather(),
    ]);

    assert.equal(first?.temperature, 27);
    assert.equal(simultaneous?.temperature, 27);
    assert.equal(requests, 1);
    console.log("OK: HTTP 200 y solicitudes simultaneas");

    // 2. Cache vigente.
    await getSabinasWeather();
    assert.equal(requests, 1);
    console.log("OK: reutilizacion de cache vigente");

    // 3. HTTP 304 y If-Modified-Since.
    now += 61000;
    mode = "304";

    const notModified = await getSabinasWeather();

    assert.equal(notModified?.temperature, 27);
    assert.equal(requests, 2);
    assert.equal(
      conditionalHeader,
      "Sun, 01 Nov 2026 17:00:00 GMT",
    );
    console.log("OK: HTTP 304 e If-Modified-Since");

    // 4. HTTP 429.
    now += 61000;
    mode = "429";

    const limited = await getSabinasWeather();

    assert.equal(limited?.temperature, 27);
    assert.equal(requests, 3);

    await getSabinasWeather();
    assert.equal(requests, 3);
    console.log("OK: HTTP 429 y pausa de reintentos");

    // 5. Error de red despues de la pausa.
    now += 3600001;
    mode = "network-error";

    const fallback = await getSabinasWeather();

    assert.equal(fallback?.temperature, 27);
    assert.equal(requests, 4);

    await getSabinasWeather();
    assert.equal(requests, 4);
    console.log("OK: respaldo temporal y pausa por error");

    // 6. Recuperacion del proveedor.
    now += 300001;
    mode = "200";

    const recovered = await getSabinasWeather();

    assert.equal(recovered?.temperature, 27);
    assert.equal(requests, 5);
    console.log("OK: recuperacion HTTP 200");

    // 7. Limite de antiguedad: 12 horas.
    now += 12 * 60 * 60 * 1000 + 1;
    mode = "network-error";

    const stale = await getSabinasWeather();

    assert.equal(stale, null);
    assert.equal(requests, 6);
    console.log("OK: rechazo de cache demasiado antigua");

  } finally {
    globalThis.fetch = realFetch;
    Date.now = realNow;

    if (realUserAgent === undefined) {
      delete process.env.SABINAPP_MET_USER_AGENT;
    } else {
      process.env.SABINAPP_MET_USER_AGENT = realUserAgent;
    }
  }
});
