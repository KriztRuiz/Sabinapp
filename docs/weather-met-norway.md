# Sabinapp 1.0 — Módulo meteorológico G2

## Proveedor

- Servicio: MET Norway
- API: Locationforecast 2.0, formato compact
- Ubicación: Sabinas Hidalgo, Nuevo León
- Coordenadas: 26.50, -100.18
- Zona horaria de presentación: America/Monterrey
- Licencia de los datos: CC BY 4.0

API:
https://api.met.no/weatherapi/locationforecast/2.0/compact

## Configuración

La variable SABINAPP_MET_USER_AGENT se configura
en el entorno del servidor, por ejemplo en .env.local.

No debe exponerse mediante variables NEXT_PUBLIC_.

El User-Agent debe identificar a Sabinapp e incluir
un contacto válido, conforme a las condiciones del proveedor.

## Arquitectura

Archivo de datos:
lib/weather/sabinas-weather.ts

Consumidores principales:
- app/page.tsx
- app/clima/page.tsx

Funciones:
- getSabinasWeather()
- getSabinasExtendedForecast()

Las dos funciones comparten el mismo mecanismo
de consulta y caché dentro del proceso Node.js.

## Caché

- Almacena la respuesta meteorológica en memoria.
- Respeta el encabezado HTTP Expires.
- Usa If-Modified-Since cuando existe Last-Modified.
- Reutiliza los datos ante HTTP 304.
- Comparte solicitudes simultáneas dentro del proceso.
- Aplica una pausa de 5 minutos ante errores ordinarios.
- Aplica una pausa de 1 hora ante HTTP 429 o 403.
- Limita a 12 horas la antigüedad de datos de respaldo.
- Si no hay un Expires válido, utiliza un vencimiento
  de respaldo de 3 horas.

Limitación:
La caché no es persistente ni compartida entre
múltiples instancias del servidor.

## Datos meteorológicos

Pronóstico principal:
- Temperatura
- Sensación térmica estimada
- Humedad
- Viento
- Precipitación prevista
- Condición meteorológica
- Fecha y hora de validez

La sensación térmica se calcula localmente mediante
una fórmula de temperatura aparente. No es una
medición directa del proveedor.

Pronóstico extendido:
- Hasta 24 registros horarios disponibles.
- Hasta 7 fechas locales de pronóstico.
- Temperaturas mínimas y máximas calculadas
  a partir de muestras disponibles.

Limitaciones:
- Puede haber menos de 24 registros horarios.
- El primer y último día pueden estar incompletos.
- Las mínimas y máximas no son necesariamente
  los extremos meteorológicos oficiales del día.
- No se inventan probabilidades de lluvia ni datos faltantes.
- Los intervalos futuros pueden tener distinta resolución.

## Presentación y atribución

La portada y la página /clima identifican a MET Norway
como proveedor y muestran la licencia CC BY 4.0.

Sabinapp transforma símbolos, convierte unidades
y calcula la sensación térmica estimada.

## Pruebas

Ejecutar:

node --test tests/weather-cache.test.mjs tests/weather-extended.test.mjs

npm run lint
npm run build

Las pruebas utilizan respuestas simuladas y no deben
consultar el proveedor real.

El warning MODULE_TYPELESS_PACKAGE_JSON de Node.js
no bloquea las pruebas actuales.

## Pendientes para producción

- Evaluar caché distribuida si se despliegan
  múltiples instancias.
- Revisar comportamiento ante reinicios del servidor.
- Supervisar disponibilidad del proveedor.
- Verificar periódicamente condiciones de uso y atribución.
- Ampliar las pruebas de datos incompletos y casos límite.
