# Sabinapp 1.0 - Noticias locales asistidas por IA

Última sincronización documental: 2026-09-15

Estado: funcional en entorno local.

## 1. Propósito

El módulo permite encontrar noticias relacionadas con Sabinas Hidalgo, Nuevo León, convertirlas en candidatos y someterlas a revisión administrativa antes de publicarlas.

La IA ayuda a encontrar, resumir y clasificar candidatos.

La IA no decide qué noticias se publican.

La publicación en Sabinapp 1.0 es administrativa y manual.

---

## 2. Principio de funcionamiento

El proceso actual no funciona como un cron autónomo.

Un administrador inicia la búsqueda desde `/dashboard/admin/noticias`.

A partir de esa acción, el sistema utiliza OpenAI para generar candidatos y guarda los resultados para revisión.

---

## 3. Flujo actual

1. El administrador entra a `/dashboard/admin/noticias`.
2. Presiona `Buscar noticias`.
3. El sistema llama a `/api/admin/news/generate`.
4. El endpoint utiliza OpenAI para buscar y procesar noticias recientes.
5. Los resultados válidos se guardan en `news_candidates`.
6. Las fuentes relacionadas se guardan en `news_candidate_sources`.
7. La ejecución se registra en `news_fetch_runs`.
8. El administrador revisa los candidatos.
9. El administrador publica o rechaza cada candidato.
10. Al publicar, se crea la noticia pública en `local_news`.
11. La noticia aparece en `/noticias`.

---

## 4. Reglas actuales de generación

La generación debe priorizar noticias recientes y con relevancia clara para Sabinas Hidalgo.

Reglas actuales:

- la fuente debe tener una fecha de publicación identificable;
- la fecha se conserva en `source_published_at`;
- durante la generación se filtran candidatos con más de 24 horas de antigüedad;
- se debe distinguir Sabinas Hidalgo, Nuevo León, de Sabinas, Coahuila;
- noticias de la Región Carbonífera, Monclova, Múzquiz, Nueva Rosita o San Juan de Sabinas no deben aceptarse sólo por similitud geográfica o de nombre;
- el candidato debe tener relación clara con Sabinas Hidalgo o impacto local verificable;
- el resumen no debe inventar información;
- el resumen no necesita repetir la fecha ni el nombre de la fuente cuando esos datos ya aparecen por separado;
- deben evitarse duplicados.

---

## 5. Publicación

La publicación es manual.

El administrador puede revisar el candidato, sus fuentes, relevancia, confianza y posible duplicidad antes de decidir.

Una noticia publicada no se oculta automáticamente sólo por antigüedad.

---

## 6. Noticias recientes y archivo

La ruta pública `/noticias` separa el contenido por antigüedad.

- `Reciente`: noticia publicada dentro de las últimas 24 horas;
- `Archivo`: noticia con más de 24 horas.

Las noticias se ordenan de la más reciente a la más antigua.

El archivo conserva noticias antiguas y permite navegar entre ellas.

---

## 7. Rutas

### Pública

`/noticias`

Muestra noticias recientes, archivo, fuente, fecha, comentarios y herramientas de reporte disponibles.

### Administración

`/dashboard/admin/noticias`

Permite revisar candidatos, resultados de búsquedas, noticias públicas y ejecutar acciones administrativas.

---

## 8. Endpoints administrativos

### `/api/admin/news/generate`

- requiere sesión;
- requiere permiso administrativo;
- genera candidatos;
- guarda fuentes;
- registra la ejecución;
- no publica automáticamente;
- soporta `dryRun` para pruebas sin consumir una llamada real de OpenAI cuando el código lo utiliza de esa forma.

### `/api/admin/news/candidates/publish`

- requiere sesión;
- requiere permiso administrativo;
- publica manualmente un candidato;
- inserta la noticia en `local_news`;
- marca el candidato como `published`;
- vincula `published_news_id`.

### `/api/admin/news/candidates/reject`

- requiere sesión;
- requiere permiso administrativo;
- marca el candidato como `rejected`;
- conserva el motivo en `rejection_reason`.

---

## 9. Tablas principales

El módulo utiliza principalmente:

- `local_news`: noticias públicas;
- `news_candidates`: candidatos pendientes o procesados;
- `news_candidate_sources`: fuentes asociadas a candidatos;
- `news_fetch_runs`: historial de ejecuciones;
- `news_search_queries`: consultas base;
- `news_sources`: infraestructura para administrar fuentes.

Los estados documentados actualmente para candidatos incluyen:

- `candidate`;
- `needs_review`;
- `approved`;
- `published`;
- `rejected`;
- `duplicate`.

---

## 10. Seguridad y permisos

El módulo utiliza Supabase Auth, RLS y comprobaciones administrativas.

Las noticias públicas deben limitarse a contenido activo.

Las tablas de candidatos, fuentes de candidatos y ejecuciones son información administrativa.

Los endpoints administrativos deben comprobar sesión y permiso en servidor.

El permiso reutilizado actualmente es:

`admin.review_businesses`

La creación futura de un permiso específico como `admin.review_news` es una mejora pendiente y no un requisito funcional ya implementado.

---

## 11. Configuración

Variables documentadas para el módulo:

- `OPENAI_API_KEY`;
- `SABINAPP_NEWS_CRON_SECRET`;
- `SABINAPP_NEWS_AUTO_PUBLISH`;
- `SABINAPP_NEWS_MAX_PUBLISHED_PER_RUN`;
- `SABINAPP_NEWS_MODEL`.

La configuración actual documentada utiliza:

`SABINAPP_NEWS_AUTO_PUBLISH=false`

Por lo tanto, la publicación automática está deshabilitada.

---

## 12. Automatización pendiente

Actualmente no existe un cron automático activo validado como parte del flujo local.

La existencia de `SABINAPP_NEWS_CRON_SECRET` no demuestra por sí sola que exista una tarea programada en producción.

Una futura automatización puede ejecutar búsquedas periódicas, pero los candidatos deben seguir pasando por revisión administrativa para Sabinapp 1.0.

---

## 13. Alcance de Sabinapp 1.0

Para Sabinapp 1.0 se mantiene:

- generación de candidatos asistida por IA;
- inicio manual de la búsqueda desde administración;
- revisión humana obligatoria;
- publicación manual;
- rechazo manual;
- noticias recientes;
- archivo público;
- fuentes rastreables;
- comentarios y reporte donde ya estén implementados.

La publicación automática de noticias no forma parte de la decisión actual de Sabinapp 1.0.

---

## 14. Mejoras pendientes o posteriores

Pueden evaluarse después del cierre funcional actual:

- cron de generación periódica;
- filtro por tema;
- filtro administrativo por fuente;
- priorización de fuentes oficiales;
- búsqueda dentro del archivo;
- navegación por mes;
- edición manual de título o resumen antes de publicar;
- permiso `admin.review_news` específico.

---

## 15. Reglas editoriales

Antes de publicar, administración debe comprobar:

1. que la noticia realmente corresponda a Sabinas Hidalgo o tenga impacto local claro;
2. que no se trate de Sabinas, Coahuila, por error;
3. que la fuente sea accesible y rastreable;
4. que la fecha sea clara;
5. que el resumen no invente información;
6. que no exista una noticia pública equivalente o duplicada;
7. que el contenido tenga valor local suficiente.

Los puntajes de relevancia y confianza ayudan a la revisión, pero no sustituyen el criterio administrativo.

---

## 16. Estado actual

Funcional localmente:

- `/noticias`;
- `/dashboard/admin/noticias`;
- generación manual de candidatos;
- revisión administrativa;
- publicación manual;
- rechazo manual;
- archivo público.

Antes del lanzamiento debe volver a validarse el módulo junto con el resto de Sabinapp mediante pruebas manuales, `npm run lint` y `npm run build`.
