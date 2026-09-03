# Sabinapp 1.0 - Estado local antes de despliegue

Última revisión local: 2026-09-03

## Estado general

Sabinapp 1.0 está estable en entorno local.

El proyecto funciona como directorio local moderado de negocios de Sabinas Hidalgo, Nuevo León, México.

Todavía no se ha preparado despliegue.

## Stack actual

- Next.js 16.3.3 App Router
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- @supabase/supabase-js
- @supabase/ssr
- Git Bash en Windows

## Rutas públicas validadas

Respondieron correctamente con HTTP 200:

- /
- /negocios
- /productos
- /noticias
- /clima
- /tiempo
- /negocio/taqueria-el-primo

## Rutas protegidas validadas

Sin sesión, redirigen a login:

- /dashboard
- /dashboard/negocios
- /dashboard/negocios/new
- /dashboard/admin/negocios
- /dashboard/admin/noticias
- /dashboard/perfil

## Negocios públicos visibles

Hay 6 negocios públicos visibles:

- Climas del Norte
- Contador Ruiz
- La Esquina Abarrotes
- Panadería San José
- Taquería El Primo
- Veterinaria Chihuahua

## Negocios no públicos validados

No aparecen públicamente y sus rutas directas responden 404:

- /negocio/prueba-flujo-58a
- /negocio/venta-garage-solidaria
- /negocio/quinta-las-palmas
- /negocio/famenor

## Seguridad y permisos

Validado:

- RLS activo en tablas sensibles.
- Crear negocios requiere perfil completo.
- Editar negocios requiere perfil completo.
- Comentar noticias requiere perfil completo.
- Publicar reseñas requiere perfil completo.
- Reportar reseñas requiere perfil completo.
- Reportar comentarios de noticias requiere perfil completo.
- has_permission() sólo concede permisos a perfiles activos.
- has_role() sólo concede roles a perfiles activos.
- is_profile_complete() centraliza la validación de perfil completo.
- is_adult_verified se sincroniza automáticamente desde birthdate.

## Comentarios, reseñas y reportes

Validado:

- Reseñas públicas en negocios.
- Comentarios públicos en noticias.
- Reportes de reseñas.
- Reportes de comentarios de noticias.
- Moderación admin de reportes.
- Los reportes no ocultan automáticamente contenido.
- Los nombres públicos son mínimos.

Ejemplos:

- Cristian Ruiz Cobos -> Cristian R.
- Sin nombre -> Usuario local.

## Limpieza de datos pre-1.0

Validado:

- 0 perfiles incompletos.
- 0 perfiles con mayoría de edad interna desincronizada.
- 0 reportes pendientes.
- Negocios hidden/archived no aparecen en home ni búsqueda.
- Drafts demo no aparecen en home ni búsqueda.
- Taquería El Prima fue corregido a Taquería El Primo.

## Validación técnica final

Últimos comandos ejecutados correctamente:

- npm run lint
- npm run build

Resultado:

- Compilación exitosa.
- TypeScript sin errores.
- Build completo con 21 rutas de App Router; /dev/db-test quedó como ruta dinámica bloqueada en modo producción local.
- Proxy activo.
- Estado Git limpio.

## Pendiente antes de despliegue

Antes de preparar despliegue, confirmar explícitamente:

- Dominio o subdominio a usar.
- Proyecto destino en Vercel u otro hosting.
- Variables de entorno productivas.
- Configuración final de Supabase Auth URLs.
- Revisión de datos demo que se quieran conservar o eliminar.
- Prueba final en navegador después del build productivo.

No preparar despliegue sin confirmación explícita.

## Actualización final de endurecimiento local

Fecha de actualización: 2026-08-31

Después de la revisión inicial del estado local, se aplicaron ajustes finales antes de considerar Sabinapp 1.0 congelado localmente.

### Dependencias y entorno

- Next.js actualizado a 16.3.3.
- eslint-config-next actualizado a 16.3.3.
- npm audit quedó en 0 vulnerabilidades.
- package.json declara engines:
  - node >=20.9.0
  - npm >=10

### Seguridad local y rutas de desarrollo

- /dev/db-test quedó forzada como ruta dinámica.
- /dev/db-test responde 404 en modo producción local usando npm run start.
- Las rutas públicas principales siguen respondiendo 200.
- Las rutas protegidas redirigen a login cuando no hay sesión.

### Datos públicos

Auditoría final de datos públicos:

- Negocios públicos visibles: 6
- No publicados con banderas públicas: 0
- Adultos visibles por error: 0
- Expirados visibles por error: 0
- Items activos de negocios no públicos: 0
- Items públicamente elegibles: 32
- Reseñas públicas de negocios no públicos: 0
- Comentarios públicos de noticias no activas: 0
- Noticias públicas activas: 3
- Reportes pendientes: 0

### Limpieza documentada

Se documentó la limpieza final en:

- docs/sql/sabinapp-limpieza-datos-publicos-final.sql

### Estado técnico

Últimas validaciones correctas:

- npm run lint
- npm run build
- npm run start en modo producción local
- Smoke test de rutas públicas/protegidas en modo producción local

Sabinapp 1.0 queda estable localmente antes de cualquier preparación de despliegue.

No preparar despliegue sin confirmación explícita.

## Actualización del módulo de noticias automáticas

Fecha de actualización: 2026-09-03

Se completó el módulo local de noticias automáticas asistidas por IA para Sabinapp 1.0.

### Estado funcional

Validado:

- /noticias funciona como página pública de noticias locales.
- /dashboard/admin/noticias funciona como panel administrativo de noticias.
- El administrador puede buscar noticias desde el panel.
- La búsqueda llama a OpenAI y guarda candidatos.
- La IA no publica automáticamente.
- El administrador publica manualmente.
- El administrador rechaza manualmente.
- Las noticias publicadas aparecen en /noticias.
- Las noticias recientes aparecen arriba.
- Las noticias antiguas se conservan como archivo.
- El archivo muestra una noticia antigua a la vez.
- Los comentarios en noticias siguen funcionando.
- Los reportes de comentarios en noticias siguen funcionando.

### Rutas nuevas o fortalecidas

Rutas públicas:

- /noticias
- /clima
- /tiempo redirige a /clima

Rutas admin:

- /dashboard/admin/noticias

Endpoints admin:

- /api/admin/news/generate
- /api/admin/news/candidates/publish
- /api/admin/news/candidates/reject

### Tablas usadas por noticias automáticas

- local_news
- news_candidates
- news_candidate_sources
- news_fetch_runs
- news_search_queries
- news_sources

### Reglas editoriales actuales

- La IA sólo propone candidatos.
- La publicación final requiere revisión humana.
- La búsqueda automática prioriza noticias publicadas en las últimas 24 horas.
- Las noticias viejas no se eliminan ni se ocultan sólo por antigüedad.
- Las noticias viejas se clasifican visualmente como Archivo.
- Se evita confundir Sabinas Hidalgo, Nuevo León, con Sabinas, Coahuila.
- Los resúmenes no deben repetir fecha ni fuente, porque esos datos ya aparecen en la tarjeta.

### Documentación relacionada

Se agregó documentación específica en:

- docs/SABINAPP-NOTICIAS-AUTOMATICAS-1.0.md
- docs/sql/sabinapp-noticias-automaticas-base.sql
- docs/sql/sabinapp-local-news-admin-policy.sql

### Estado técnico

Últimas validaciones correctas:

- npm run lint
- npm run build

Build actual:

- /noticias dinámica.
- /dashboard/admin/noticias dinámica.
- /api/admin/news/generate dinámica.
- /api/admin/news/candidates/publish dinámica.
- /api/admin/news/candidates/reject dinámica.
- /clima estática con revalidación de 10 minutos.
- /tiempo estática y redirige permanentemente a /clima.

El módulo de noticias queda funcional en entorno local para Sabinapp 1.0.

No preparar despliegue sin confirmación explícita.

## Auditoría global post-noticias

Fecha de auditoría: 2026-09-03

Después de completar el módulo de noticias automáticas, se ejecutó una auditoría global rápida en modo producción local.

### Validación técnica

Comandos ejecutados correctamente:

- git status --short
- npm run lint
- npm run build
- npm run start

Resultado:

- Git limpio antes de la validación.
- ESLint sin errores.
- TypeScript sin errores.
- Build productivo exitoso.
- 21 rutas generadas por App Router.
- Servidor local productivo levantado correctamente con npm run start.

### Smoke test de rutas públicas

Validado con HTTP 200:

- /
- /negocios
- /productos
- /noticias
- /clima
- /negocio/taqueria-el-primo

Validado con redirección permanente:

- /tiempo -> /clima

### Smoke test de rutas no públicas

Validado con HTTP 404:

- /negocio/prueba-flujo-58a
- /negocio/venta-garage-solidaria
- /negocio/quinta-las-palmas
- /negocio/famenor
- /dev/db-test

### Smoke test de rutas protegidas

Sin sesión, redirigen correctamente a login:

- /dashboard
- /dashboard/negocios
- /dashboard/admin/negocios
- /dashboard/admin/noticias
- /dashboard/perfil

### Smoke test de endpoints admin

Sin sesión, responden correctamente 401:

- POST /api/admin/news/generate
- POST /api/admin/news/candidates/publish
- POST /api/admin/news/candidates/reject

### Conteo actual de datos públicos

Resultado validado en Supabase:

- Negocios públicos visibles: 6
- Noticias públicas activas: 11
- Candidatos de noticias pendientes: 0
- Candidatos de noticias publicados: 8
- Candidatos de noticias descartados: 2
- Reportes pendientes: 0

### Conclusión

Sabinapp 1.0 sigue estable después de integrar noticias automáticas asistidas por IA.

El módulo de noticias no rompió:

- Página principal.
- Búsqueda/listado de negocios.
- Productos.
- Página pública de negocios.
- Dashboard.
- Rutas protegidas.
- Seguridad básica de endpoints admin.
- Bloqueo de rutas de desarrollo en producción local.

No preparar despliegue sin confirmación explícita.

## Actualización del buscador local

Fecha de actualización: 2026-09-03

Se mejoró la búsqueda pública local de Sabinapp 1.0 sin agregar complejidad de base de datos ni búsqueda full-text.

### Archivos modificados

- lib/search/local-search.ts
- app/negocios/page.tsx
- app/productos/page.tsx

### Estado funcional

Validado:

- /negocios usa búsqueda local compartida.
- /productos usa búsqueda local compartida.
- La búsqueda ignora mayúsculas y minúsculas.
- La búsqueda ignora acentos.
- La búsqueda limpia signos y espacios extra.
- La búsqueda soporta plurales simples.
- La búsqueda acepta varias palabras.
- La búsqueda de negocios también considera la descripción larga.

### Pruebas reales validadas

En modo producción local:

- /negocios?q=clima encontró Climas del Norte.
- /negocios?q=climas encontró Climas del Norte.
- /negocios?q=contador encontró Contador Ruiz.
- /negocios?q=contadores encontró Contador Ruiz.
- /negocios?q=taco encontró Taquería El Primo.
- /negocios?q=tacos encontró Taquería El Primo.
- /negocios?q=mecanico respondió 200 sin romper.
- /negocios?q=mecánico respondió 200 sin romper.
- /productos?q=taco respondió 200.
- /productos?q=tacos respondió 200.
- /productos?q=clima respondió 200.
- /productos?q=climas respondió 200.

### Decisión técnica

Para Sabinapp 1.0 se mantiene una búsqueda local simple y estable.

No se implementa todavía:

- PostgreSQL full-text search.
- Ranking avanzado.
- Sinónimos administrables.
- Corrección automática de errores de escritura.
- Historial de búsquedas.
- Métricas de búsqueda.

Esas mejoras quedan como candidatas para Sabinapp 2.0 o para una fase posterior al lanzamiento.

No preparar despliegue sin confirmación explícita.

## Actualización de clima local

Fecha de actualización: 2026-09-03

Se mejoró la página pública de clima para hacerla más útil para usuarios, negocios y comunidad local.

### Archivos modificados

- lib/weather/sabinas-weather.ts
- app/clima/page.tsx

### Estado funcional

Validado:

- /clima muestra el clima actual de Sabinas Hidalgo.
- /clima conserva temperatura, sensación térmica, viento, humedad y lluvia.
- /clima conserva la recomendación rápida.
- /clima agrega una lectura práctica para usuarios.
- /clima agrega una recomendación para negocios.
- /clima agrega riesgo por calor.
- /tiempo sigue redirigiendo permanentemente a /clima.
- Home puede seguir usando la lógica compartida de clima.

### Funciones reutilizables agregadas

- getWeatherHeatRisk()
- getWeatherOutdoorPlan()
- getWeatherBusinessPlan()

### Prueba real validada

En modo producción local:

- GET /clima respondió 200.
- GET /tiempo respondió 308 y redirigió a /clima.
- /clima mostró:
  - Clima en Sabinas Hidalgo.
  - Lectura práctica del clima.
  - Para usuarios.
  - Para negocios.
  - Riesgo por calor.

### Decisión técnica

Para Sabinapp 1.0 se mantiene una página de clima sencilla, útil y estable.

No se implementa todavía:

- Pronóstico por horas.
- Pronóstico por varios días.
- Alertas automáticas.
- Historial climático.
- Personalización por zona.
- Notificaciones.

Esas mejoras quedan como candidatas para Sabinapp 2.0 o para una fase posterior al lanzamiento.

No preparar despliegue sin confirmación explícita.
