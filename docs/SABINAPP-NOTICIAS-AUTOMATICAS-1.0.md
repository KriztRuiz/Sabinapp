# Sabinapp 1.0 — Módulo de noticias automáticas

Estado: funcional en entorno local.

Este documento describe el módulo de noticias automáticas de Sabinapp 1.0.

## Objetivo

El módulo permite buscar noticias relacionadas con Sabinas Hidalgo, Nuevo León, guardarlas como candidatos y publicarlas manualmente después de revisión administrativa.

La IA no decide qué se publica. La IA sólo propone candidatos.

## Flujo actual

1. Un administrador entra a `/dashboard/admin/noticias`.
2. Presiona el botón `Buscar noticias`.
3. El sistema llama al endpoint `/api/admin/news/generate`.
4. El endpoint usa OpenAI para buscar noticias recientes.
5. Las noticias encontradas se guardan en `news_candidates`.
6. El administrador revisa cada candidato.
7. El administrador puede publicar o rechazar.
8. Si publica, el candidato se convierte en noticia pública en `local_news`.
9. La noticia aparece en `/noticias`.

## Reglas actuales de generación

La búsqueda automática está pensada para revisión diaria.

Reglas principales:

- Sólo se buscan noticias recientes.
- La fuente debe tener fecha clara de publicación.
- La fecha de publicación debe venir en `source_published_at`.
- Se filtran candidatos con más de 24 horas de antigüedad durante la generación.
- Se evita confundir Sabinas Hidalgo, Nuevo León, con Sabinas, Coahuila.
- Se descartan temas de Región Carbonífera, Monclova, Múzquiz, Nueva Rosita o San Juan de Sabinas si no mencionan claramente Sabinas Hidalgo.
- El resumen no debe repetir la fecha ni el nombre de la fuente, porque esos datos ya aparecen en la tarjeta.

## Reglas actuales de publicación

La publicación es manual.

Un administrador puede:

- Publicar candidatos.
- Rechazar candidatos.
- Revisar fuentes.
- Revisar puntajes de relevancia y confianza.
- Revisar el historial reciente de búsquedas.

Actualmente, una noticia publicada no se oculta automáticamente sólo por antigüedad.

## Noticias recientes y archivo

La página pública `/noticias` clasifica las noticias así:

- `Reciente`: noticia publicada dentro de las últimas 24 horas.
- `Archivo`: noticia con más de 24 horas.

Las noticias públicas se muestran de la más reciente a la más antigua.

La sección pública muestra:

- Noticias recientes completas arriba.
- Archivo debajo.
- El archivo muestra una noticia antigua a la vez.
- El usuario puede navegar con botones de más reciente o más antigua.

## Rutas públicas

### `/noticias`

Página pública de noticias locales.

Muestra:

- Noticias recientes.
- Archivo de noticias.
- Fuente principal.
- Fecha de publicación.
- Comentarios.
- Reporte de comentarios.

## Rutas admin

### `/dashboard/admin/noticias`

Panel administrativo para revisar noticias candidatas.

Muestra:

- Candidatos pendientes.
- Candidatos publicados.
- Candidatos rechazados o duplicados.
- Historial reciente de búsquedas.
- Noticias públicas recientes.
- Botón `Buscar noticias`.
- Botón `Publicar`.
- Botón `Rechazar`.

## Endpoints

### `/api/admin/news/generate`

Genera candidatos de noticias.

Características:

- Requiere sesión.
- Requiere permiso admin.
- Llama a OpenAI.
- Puede consumir crédito de API.
- Guarda candidatos en `news_candidates`.
- Guarda fuentes en `news_candidate_sources`.
- Guarda ejecución en `news_fetch_runs`.
- No publica noticias automáticamente.
- Soporta `dryRun` para prueba sin llamar a OpenAI.

### `/api/admin/news/candidates/publish`

Publica manualmente un candidato.

Características:

- Requiere sesión.
- Requiere permiso admin.
- Convierte un candidato en noticia pública.
- Inserta en `local_news`.
- Marca el candidato como `published`.
- Vincula `published_news_id`.

### `/api/admin/news/candidates/reject`

Rechaza manualmente un candidato.

Características:

- Requiere sesión.
- Requiere permiso admin.
- Cambia el estado del candidato a `rejected`.
- Guarda motivo de rechazo en `rejection_reason`.

## Tablas principales

### `local_news`

Noticias públicas visibles en `/noticias`.

Campos principales usados:

- `id`
- `title`
- `summary`
- `source_name`
- `source_url`
- `published_at`
- `is_active`
- `expires_at`
- `created_at`
- `updated_at`

### `news_candidates`

Candidatos generados por IA.

Campos principales usados:

- `id`
- `title`
- `summary`
- `source_name`
- `source_url`
- `source_published_at`
- `local_relevance`
- `relevance_score`
- `confidence_score`
- `status`
- `rejection_reason`
- `published_news_id`
- `dedupe_key`
- `ai_notes`
- `created_at`
- `updated_at`

Estados usados:

- `candidate`
- `needs_review`
- `approved`
- `published`
- `rejected`
- `duplicate`

### `news_candidate_sources`

Fuentes usadas por cada candidato.

Campos principales usados:

- `candidate_id`
- `source_name`
- `source_url`
- `source_title`
- `excerpt`
- `is_primary`

### `news_fetch_runs`

Historial de ejecuciones de búsqueda.

Campos principales usados:

- `id`
- `started_at`
- `finished_at`
- `status`
- `trigger_source`
- `model_name`
- `search_query_count`
- `source_count`
- `candidates_found`
- `candidates_published`
- `error_message`

### `news_search_queries`

Consultas base usadas para buscar noticias.

Ejemplos:

- `Sabinas Hidalgo`
- `Sabinas Hidalgo Nuevo León`
- Noticias de comunidad, comercio, servicios y eventos.

### `news_sources`

Base para fuentes permitidas o configurables en una fase posterior.

## Seguridad

El módulo usa RLS y permisos administrativos.

Reglas actuales:

- La lectura pública de `local_news` sólo muestra noticias activas.
- La administración de `local_news` requiere rol admin.
- Las tablas de candidatos y ejecuciones son para administración.
- Los endpoints verifican sesión con Supabase Auth.
- Los endpoints verifican permisos con `has_permission`.

Permiso usado actualmente:

- `admin.review_businesses`

Nota técnica: para Sabinapp 1.0 se reutiliza este permiso administrativo. En una fase futura puede crearse un permiso específico como `admin.review_news`.

## Variables de entorno

Variables documentadas en `.env.example`:

- `OPENAI_API_KEY`
- `SABINAPP_NEWS_CRON_SECRET`
- `SABINAPP_NEWS_AUTO_PUBLISH`
- `SABINAPP_NEWS_MAX_PUBLISHED_PER_RUN`
- `SABINAPP_NEWS_MODEL`

Estado actual:

- `SABINAPP_NEWS_AUTO_PUBLISH=false`
- La publicación automática está desactivada.
- La publicación real es manual.

## Limitaciones actuales

El módulo todavía no tiene:

- Cron automático activo.
- Filtro por tema.
- Filtro por fuente.
- Búsqueda pública dentro del archivo.
- Vista por mes.
- Edición manual de título/resumen antes de publicar.
- Permiso específico `admin.review_news`.
- Sistema de fuentes oficiales priorizadas.
- Publicación automática segura.

## Decisión para Sabinapp 1.0

Para Sabinapp 1.0, el módulo queda así:

- Búsqueda automática asistida por IA.
- Revisión humana obligatoria.
- Publicación manual.
- Archivo público conservado.
- Noticias recientes arriba.
- Archivo navegable una noticia a la vez.

Esta decisión prioriza estabilidad, control editorial y reducción de errores antes que automatización total.

## Reglas editoriales recomendadas

Antes de publicar un candidato, el administrador debe revisar:

1. Que la noticia mencione claramente Sabinas Hidalgo, Nuevo León.
2. Que no sea Sabinas, Coahuila.
3. Que la fuente sea accesible.
4. Que la fecha de publicación sea clara.
5. Que el resumen no invente información.
6. Que no exista ya una noticia pública con la misma fuente.
7. Que el tema tenga valor local para la comunidad.

## Estado final local

Módulo funcional localmente:

- `/noticias` operativo.
- `/dashboard/admin/noticias` operativo.
- Búsqueda manual operativa.
- Publicación manual operativa.
- Rechazo manual operativo.
- Archivo público operativo.
- `npm run lint` pasa.
- `npm run build` pasa.

Todavía no preparar despliegue sin confirmación explícita.
