import test from "node:test";
import assert from "node:assert/strict";

test("G2-D.3-A: pronostico extendido", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const originalAgent = process.env.SABINAPP_MET_USER_AGENT;

  const start = Date.parse("2026-11-04T12:00:00Z");
  let requests = 0;

  const makeStep = (timestamp, index, hourly) => ({
    time: new Date(timestamp).toISOString(),
    data: {
      instant: {
        details: {
          air_temperature: 20 + (index % 12),
          relative_humidity: 70,
          wind_speed: 5,
        },
      },
      ...(hourly
        ? {
            next_1_hours: {
              summary: { symbol_code: "cloudy" },
              details: { precipitation_amount: 0.3 },
            },
          }
        : {
            next_6_hours: {
              summary: { symbol_code: "partlycloudy_day" },
              details: { precipitation_amount: 1 },
            },
          }),
    },
  });

  const timeseries = [];

  for (let hour = 0; hour < 24; hour++) {
    timeseries.push(
      makeStep(start + hour * 3600000, hour, true),
    );
  }

  for (let hour = 24; hour <= 216; hour += 6) {
    timeseries.push(
      makeStep(start + hour * 3600000, hour, false),
    );
  }

  Date.now = () => start;

  process.env.SABINAPP_MET_USER_AGENT =
    "Sabinapp-Test/1.0 (test@example.com)";

  globalThis.fetch = async () => {
    requests++;

    return new Response(
      JSON.stringify({
        properties: { timeseries },
      }),
      {
        status: 200,
        headers: {
          Expires: new Date(
            start + 3600000,
          ).toUTCString(),
          "Last-Modified":
            "Wed, 04 Nov 2026 11:00:00 GMT",
        },
      },
    );
  };

  try {
    const {
      getSabinasWeather,
      getSabinasExtendedForecast,
    } = await import(
      "../lib/weather/sabinas-weather.ts"
    );

    const [current, extended] = await Promise.all([
      getSabinasWeather(),
      getSabinasExtendedForecast(),
    ]);

    assert.ok(current);
    assert.ok(extended);

    assert.equal(requests, 1);
    console.log("OK: una solicitud compartida");

    assert.equal(extended.hourly.length, 24);
    console.log("OK: 24 registros horarios");

    assert.equal(extended.daily.length, 7);
    console.log("OK: 7 dias de pronostico");

    assert.equal(
      extended.daily[0].date,
      "2026-11-04",
    );
    console.log("OK: fecha local de Sabinas");

    assert.equal(
      extended.hourly[0].temperature,
      20,
    );

    assert.equal(
      extended.hourly[0].humidity,
      70,
    );

    assert.equal(
      extended.hourly[0].windSpeed,
      18,
    );

    assert.equal(
      extended.hourly[0].precipitation,
      0.3,
    );

    console.log("OK: temperatura, humedad, viento y lluvia");

    for (const day of extended.daily) {
      assert.ok(day.sampleCount > 0);

      assert.ok(
        day.minTemperature <= day.maxTemperature,
      );
    }

    console.log("OK: temperaturas minimas y maximas");

    assert.equal(
      extended.hourly[0].weatherCode,
      3,
    );

    console.log("OK: conversion de condicion meteorologica");

  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;

    if (originalAgent === undefined) {
      delete process.env.SABINAPP_MET_USER_AGENT;
    } else {
      process.env.SABINAPP_MET_USER_AGENT =
        originalAgent;
    }
  }
});
