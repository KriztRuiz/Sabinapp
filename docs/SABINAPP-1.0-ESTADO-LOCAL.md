# Sabinapp 1.0 - Estado local actual

Última sincronización documental: 2026-09-23

## 1. Propósito

Este documento resume el estado técnico y funcional actual de Sabinapp 1.0 en entorno local.

No funciona como historial de desarrollo.

El detalle de avance y pendientes vive en `docs/02-fases-desarrollo.md`.

---

## 2. Estado general

Sabinapp 1.0 funciona en entorno local y ya cuenta con una base funcional amplia.

Actualmente integra:

- autenticación;
- perfiles;
- negocios moderados;
- directorio y búsqueda;
- páginas públicas de negocio;
- productos y servicios;
- clima local;
- noticias locales;
- reseñas y comentarios;
- reportes y moderación;
- auditoría de cambios;
- publicidad local;
- flujo manual de revisión de pagos.

El producto todavía no debe considerarse listo para despliegue público hasta cerrar los bloqueadores definidos en `docs/02-fases-desarrollo.md`.

---

## 3. Stack actual

- Next.js 16.3.3 App Router;
- TypeScript;
- Tailwind CSS;
- Supabase;
- PostgreSQL;
- `@supabase/supabase-js`;
- `@supabase/ssr`;
- Git Bash en Windows.

---

## 4. Rutas públicas principales

Rutas relevantes:

- `/`;
- `/negocios`;
- `/productos`;
- `/noticias`;
- `/clima`;
- `/negocio/[slug]`.

`/clima` es la ruta canónica de clima.

`/tiempo` existe como compatibilidad y redirige permanentemente hacia `/clima`.

Las rutas públicas deben mostrar únicamente contenido permitido por estado, moderación y vigencia.

---

## 5. Panel y negocios

El flujo de negocio permite:

- crear borradores;
- editar información;
- configurar clasificación;
- administrar imágenes;
- administrar contactos;
- administrar horarios;
- administrar ubicaciones;
- administrar productos o servicios;
- administrar destacados;
- elegir modo visual;
- enviar a revisión;
- revisar y moderar desde administración;
- publicar, ocultar, suspender o archivar según permisos.

La eliminación física directa no forma parte del flujo administrativo normal.

La autorización administrativa del negocio no debe ser autoaprobada por el dueño.

Los negocios temporales utilizan fechas únicamente cuando su tipo lo requiere.

---

## 6. Página pública del negocio

`/negocio/[slug]` integra datos del negocio desde Supabase.

Actualmente contempla:

- contenido general;
- imágenes;
- horarios;
- ubicación;
- contactos;
- ContactHub;
- menú, productos o servicios;
- destacados;
- estilos visuales.

Los modos actuales son `classic`, `modern`, `warm`, `compact`, `elegant` e `impact`.

---

## 7. Búsqueda local

La búsqueda actual prioriza estabilidad y utilidad local.

Soporta normalización básica de texto, acentos, mayúsculas, varias palabras y plurales simples.

La búsqueda de negocios puede considerar nombre y descripciones.

PostgreSQL ya dispone de `search_logs` para registrar actividad de búsqueda.

Ranking avanzado, sinónimos administrables y corrección inteligente permanecen fuera del alcance inmediato.

---

## 8. Clima

`/clima` ofrece información práctica para Sabinas Hidalgo.

Incluye condiciones actuales y lecturas útiles para usuarios y negocios.

Pronósticos avanzados, alertas y personalización por zona quedan para evolución posterior.

---

## 9. Noticias

El módulo de noticias locales cuenta con:

- página pública `/noticias`;
- panel `/dashboard/admin/noticias`;
- fuentes configurables;
- búsquedas configurables;
- ejecuciones de obtención;
- candidatos;
- múltiples fuentes por candidato;
- publicación y rechazo administrativo;
- comentarios moderables.

Los candidatos automáticos no se consideran noticias publicadas hasta pasar por el flujo correspondiente.

---

## 10. Comunidad y moderación

La base actual contempla:

- reseñas de negocios;
- comentarios de noticias;
- reportes;
- estados de moderación;
- permisos de autor;
- protección de información privada.

El alcance final y cierre de QA de estas funciones continúa registrado en `docs/02-fases-desarrollo.md`.

---

## 11. Publicidad

La infraestructura de publicidad ya está integrada en Sabinapp.

Incluye:

- campañas;
- assets;
- configuración;
- apariciones del anuncio;
- impresiones por archivo;
- clics;
- pagos;
- revisión administrativa.

El flujo de solicitud y pago permite al dueño:

- crear una campaña;
- enviarla a revisión;
- corregirla cuando sea solicitado;
- reportar un pago.

Administración puede:

- aprobar o rechazar solicitudes;
- pedir cambios;
- verificar pagos;
- rechazar pagos.

La fase 118E-3 de verificación de pagos quedó validada funcionalmente.

Un pago rechazado no activa la campaña, no inicia vigencia y no consume días contratados.

Campaña A y Campaña B están implementadas localmente.

Campaña B superó pruebas reales con imágenes y video. Las estadísticas distinguen apariciones, impresiones por archivo y clics. Se comprobó que «Ver negocio» no repite inmediatamente la misma campaña en la página del anunciante.

Commits de cierre:

- `f03e40a` - apariciones y estadísticas;
- `b698c09` - navegación publicitaria sin repetición inmediata.

Campaña B permanece desactivada globalmente después de las pruebas. La activación pública y QA de producción siguen pendientes.

El detalle se mantiene en `docs/02-fases-desarrollo.md` y `docs/SABINAPP-ANUNCIOS-1.0.md`.

---

## 12. Seguridad y permisos

El esquema público actual utiliza RLS en sus tablas.

También existen funciones para roles, permisos, ownership y operaciones administrativas.

RLS habilitado no equivale automáticamente a políticas correctas.

Antes del lanzamiento debe completarse una auditoría final de permisos y exposición de datos.

---

## 13. Auditoría y conservación

`business_change_events` conserva trazabilidad de cambios públicos relevantes.

Los estados del negocio y los eventos históricos deben conservarse cuando sean útiles para moderación, soporte, métricas o auditoría.

---

## 14. Rutas técnicas

Existen rutas de desarrollo como:

- `/dev/db-test`;
- `/dev/ads-test`.

Antes de producción deben quedar protegidas, deshabilitadas o retiradas según corresponda.

---

## 15. Pendientes de lanzamiento

Los pendientes exactos se mantienen en el árbol maestro `docs/02-fases-desarrollo.md`.

Las áreas que todavía requieren cierre incluyen, según corresponda:

- decisión de activación pública y QA de publicidad en producción;
- revisión final de comunidad;
- seguridad y prevención de abuso;
- auditoría final de RLS;
- SEO;
- experiencia móvil;
- consolidación de `/tiempo`;
- tratamiento final de rutas `/dev`;
- limpieza de datos demo;
- contenido inicial suficiente;
- QA de regresión;
- preparación del entorno de producción.

No debe inferirse que una función está terminada sólo porque exista una tabla, enum, RPC o ruta.

---

## 16. Criterio de estabilidad

Una función se considera cerrada cuando su comportamiento está implementado, probado y documentado.

Antes del lanzamiento completo deben pasar:

```bash
git diff --check
npm run lint
npm run build
```

además del checklist funcional de `docs/04-pruebas-manuales.md`.

No preparar despliegue público sin una decisión explícita de cierre de Sabinapp 1.0.
