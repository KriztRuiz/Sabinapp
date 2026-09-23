# Sabinapp 1.0 - Árbol maestro de desarrollo

## 1. Propósito

Este documento es el checklist maestro de Sabinapp 1.0.

Se utiliza para:

- conocer qué partes del producto ya están terminadas;
- identificar qué áreas requieren cierre;
- evitar agregar funciones fuera del alcance de lanzamiento;
- mantener continuidad entre sesiones de desarrollo;
- decidir qué fase debe trabajarse después;
- registrar avances únicamente cuando exista evidencia real.

La definición funcional del producto vive en:

`docs/00-sabinapp-alcance-mvp-v1.md`

---

## 2. Estados

Cada área utiliza uno de estos estados:

- ✅ **100% / PASS** — implementado, probado y validado.
- 🟡 **En progreso** — existe parcialmente o necesita cierre.
- 🔵 **Pendiente para 1.0** — requerido para lanzamiento, pero todavía no terminado.
- ⚪ **Post-1.0** — no bloquea el lanzamiento.
- ⛔ **Bloqueado** — existe una dependencia o problema que impide avanzar.

Los porcentajes sólo deben actualizarse cuando exista evidencia real del proyecto.

No deben utilizarse porcentajes como estimación optimista.

---

# 3. Árbol maestro Sabinapp 1.0

## A. Base técnica y plataforma

### A1. Proyecto Next.js

Estado: ✅ 100%

Incluye:

- Next.js App Router;
- TypeScript;
- Tailwind CSS;
- estructura de rutas;
- Server Components;
- Server Actions;
- build de producción;
- variables de entorno;
- integración con Supabase.

Versión validada durante las fases recientes:

`Next.js 16.3.3`

---

### A2. Supabase y PostgreSQL

Estado: ✅ Base funcional

Incluye:

- proyecto Supabase;
- PostgreSQL;
- autenticación;
- tablas principales;
- RPC;
- políticas;
- relaciones;
- consultas desde servidor;
- SQL versionado en `docs/sql/`.

Pendiente global:

- auditoría final de RLS y permisos antes del lanzamiento.

---

### A3. Auth

Estado: ✅ 100%

Rutas principales:

- `/auth/login`
- `/auth/sign-up`
- `/auth/sign-up-success`
- `/auth/forgot-password`
- `/auth/update-password`
- `/auth/callback`

Validado:

- registro;
- login;
- recuperación de contraseña;
- actualización de contraseña;
- protección de rutas privadas.

---

## B. Perfil y usuarios

### B1. Perfil de usuario

Estado: 🟡 En progreso / funcional

Ruta:

`/dashboard/perfil`

Existe soporte para perfil de usuario y estado de perfil.

Pendiente antes de lanzamiento:

- auditoría final del flujo;
- revisar qué campos serán obligatorios;
- validar mensajes y experiencia móvil.

---

### B2. Autenticidad y control de abuso

Estado: 🔵 Pendiente de cierre 1.0

Objetivo:

Reducir:

- bots;
- spam;
- suplantación;
- abuso de comentarios;
- creación masiva de cuentas.

No se requiere un sistema avanzado de identidad digital para 1.0.

Sí se requieren controles razonables de autenticación y moderación.

---

## C. Negocios

### C1. Registro de negocio

Estado: ✅ 100%

Ruta:

`/dashboard/negocios/new`

Incluye:

- propietario;
- nombre;
- clasificación;
- información básica;
- reglas de negocio;
- envío para revisión.

---

### C2. Listado de negocios del dueño

Estado: ✅ 100%

Ruta:

`/dashboard/negocios`

Permite consultar y administrar los negocios asociados a la cuenta.

---

### C3. Edición de negocio

Estado: ✅ Funcional

Ruta:

`/dashboard/negocios/[businessId]/edit`

Incluye edición de:

- información general;
- descripciones;
- imágenes;
- contactos;
- horarios;
- productos;
- servicios;
- menú;
- destacados;
- configuración pública;
- modo visual.

---

### C4. Vista previa del dueño

Estado: ✅ Funcional

Ruta:

`/dashboard/negocios/[businessId]/preview`

Permite revisar el resultado antes o durante el flujo de publicación.

---

### C5. Negocios múltiples por usuario

Estado: ✅ Soportado

Un usuario puede administrar más de un negocio.

---

### C6. Negocios sin local físico

Estado: ✅ Soportado

La plataforma no obliga a todos los negocios a contar con establecimiento físico.

---

### C7. Negocios temporales

Estado: ✅ Soportado

Las fechas temporales deben utilizarse únicamente cuando corresponda al tipo de negocio.

Ejemplo:

`ocasiones_especiales`

---

### C8. Clasificación

Estado: ✅ Funcional

Clasificación principal:

- Restaurantes;
- Comercio;
- Servicios técnicos;
- Servicios profesionales;
- Otros.

---

### C9. Tags

Estado: 🟡 Funcional / pendiente de auditoría final

Objetivo:

- permitir tags existentes;
- permitir nuevos tags;
- facilitar búsqueda;
- utilizar autocompletado cuando corresponda.

---

## D. Moderación administrativa de negocios

### D1. Panel administrativo

Estado: ✅ Funcional

Ruta:

`/dashboard/admin/negocios`

---

### D2. Vista previa administrativa

Estado: ✅ Funcional

Ruta:

`/dashboard/admin/negocios/[businessId]/preview`

---

### D3. Aprobación administrativa

Estado: ✅ Funcional

La autorización relevante del negocio debe ser confirmada por administración.

El dueño no puede autoaprobar dicha autorización.

---

### D4. Auditoría de cambios públicos

Estado: 🟡 Implementado / requiere revisión final

Documento relacionado:

`docs/05-auditoria-cambios-publicos.md`

Objetivo:

Evitar que cambios sensibles publicados previamente aparezcan sin revisión cuando deban ser moderados.

---

### D5. Conservación de negocios

Estado: ✅ Decisión cerrada

No existe eliminación física directa como flujo normal de administración.

Se utilizan estados como:

- no publicado;
- archivado;
- suspendido;
- vencido.

Esto conserva:

- historial;
- métricas;
- auditoría.

---

## E. Página pública del negocio

### E1. Ruta pública

Estado: ✅ 100%

Ruta:

`/negocio/[slug]`

---

### E2. Datos públicos

Estado: ✅ Funcional

La página puede mostrar:

- nombre;
- descripción;
- imágenes;
- ubicación;
- horarios;
- contactos;
- productos;
- servicios;
- menú;
- destacados.

---

### E3. ContactHub

Estado: ✅ 100%

Los contactos públicos respetan:

- `is_active`;
- `is_approved`.

---

### E4. Menú

Estado: ✅ 100%

Regla:

El Menú lista todas las opciones que correspondan.

`show_price` determina si se muestra el precio.

---

### E5. Destacados

Estado: ✅ 100%

Regla:

Destacados muestra únicamente elementos marcados como destacados.

Puede utilizar imágenes.

---

### E6. Modos visuales

Estado: ✅ 100%

Modos actuales:

- classic;
- modern;
- warm;
- compact;
- elegant;
- impact.

Carpeta principal:

`lib/landing/styles/`

Cada modo debe permanecer en su propio archivo.

Los datos, permisos y estilos no deben mezclarse.

---

## F. Descubrimiento público

### F1. Home

Estado: ✅ Funcional

Ruta:

`/`

Funciona como portal local de Sabinapp.

Pendiente antes de lanzamiento:

- revisión final de contenido;
- publicidad;
- SEO;
- experiencia móvil.

---

### F2. Directorio público

Estado: ✅ Funcional

Ruta:

`/negocios`

Muestra negocios publicados y disponibles.

---

### F3. Productos y servicios

Estado: ✅ Funcional

Ruta:

`/productos`

Permite descubrir oferta local asociada con negocios.

---

### F4. Buscador local

Estado: 🟡 Implementado / requiere cierre

Debe contemplar, cuando sea aplicable:

- nombre;
- categoría;
- tags;
- descripción corta;
- descripción larga;
- productos;
- servicios.

Pruebas importantes:

- términos exactos;
- singular;
- plural;
- términos relacionados con descripción;
- resultados sin coincidencias.

---

## G. Clima

### G1. Módulo local

Estado: ✅ Funcional

Ruta pública principal:

`/clima`

---

### G2. Ruta `/tiempo`

Estado: 🟡 Revisión pendiente

Existe:

`/tiempo`

Debe decidirse antes de lanzamiento si:

- se conserva;
- redirige;
- se utiliza internamente;
- se elimina.

La navegación pública debe favorecer una sola ruta principal.

---

### G3. Experiencia meteorológica

Estado: 🟡 Funcional / mejora pendiente

Objetivo:

Ofrecer información útil para el municipio y no sólo un dato meteorológico aislado.

---

## H. Noticias

### H1. Página pública

Estado: ✅ Funcional

Ruta:

`/noticias`

---

### H2. Administración de noticias

Estado: ✅ Funcional

Ruta:

`/dashboard/admin/noticias`

---

### H3. Noticias automáticas

Estado: ✅ Base implementada

Documento:

`docs/SABINAPP-NOTICIAS-AUTOMATICAS-1.0.md`

Incluye:

- candidatos;
- fuentes;
- búsquedas;
- procesos de obtención;
- revisión;
- publicación;
- rechazo.

---

### H4. Moderación editorial

Estado: ✅ Base funcional

La automatización no publica contenido sin respetar las reglas editoriales definidas.

---

### H5. Automatización productiva

Estado: 🟡 Pendiente de cierre

Antes del lanzamiento debe revisarse:

- frecuencia;
- fuentes;
- costos;
- fallos;
- duplicados;
- contenido irrelevante;
- mantenimiento operativo.

---

## I. Comunidad

### I1. Reseñas / comentarios en negocios

Estado: 🟡 Implementado

Existen componentes y flujos relacionados con:

- reseñas;
- usuarios;
- reportes.

Pendiente:

- auditoría funcional;
- moderación;
- permisos;
- experiencia móvil;
- comportamiento ante abuso.

---

### I2. Comentarios en noticias

Estado: 🟡 Implementado

Existen componentes de:

- publicación;
- reportes;
- moderación.

Pendiente:

- auditoría funcional completa;
- controles antiabuso;
- prueba de permisos.

---

### I3. Reportes comunitarios

Estado: 🟡 Implementado / pendiente de auditoría

Los usuarios deben poder reportar contenido cuando corresponda.

Administración debe disponer de herramientas para actuar.

---

### I4. Foro

Estado: ⚪ Post-1.0

No bloquea el lanzamiento.

---

### I5. Feed social infinito

Estado: ⚪ Post-1.0

Una futura versión madura de Sabinapp puede incorporar contenido comunitario tipo red social.

No forma parte del requisito de lanzamiento de 1.0.

---

## J. Publicidad local

Documento principal:

`docs/SABINAPP-ANUNCIOS-1.0.md`

### J1. Base de datos de anuncios

Estado: ✅ Implementada

Incluye entidades y lógica para:

- campañas;
- assets;
- eventos;
- pagos;
- estados;
- vigencia.

---

### J2. Campaña A - publicidad fija

Estado: ✅ Implementada y probada localmente; QA de producción pendiente

Objetivo:

Mostrar publicidad integrada dentro de Sabinapp.

Debe contemplar:

- home;
- negocios;
- productos;
- noticias;
- clima;
- páginas públicas de negocios.

---

### J3. Solicitud de campaña por dueño

Estado: ✅ PASS

Ruta:

`/dashboard/anuncios/nuevo`

Permite:

- seleccionar negocio;
- configurar anuncio;
- duración;
- inicio;
- imagen;
- destino;
- enviar a revisión.

---

### J4. Edición / corrección de campaña

Estado: ✅ Funcional

Ruta:

`/dashboard/anuncios/[campaignId]/editar`

---

### J5. Panel de campañas del dueño

Estado: ✅ Funcional

Ruta:

`/dashboard/anuncios`

---

### J6. Moderación administrativa de campañas

Estado: ✅ Funcional

Ruta:

`/dashboard/admin/anuncios`

Permite:

- revisar;
- aprobar;
- solicitar correcciones;
- rechazar;
- pausar;
- activar según estado.

---

### J7. 118E-3 - verificación manual de pago

Estado: ✅ 100% PASS

Commit:

`45d1ded feat: complete ad payment verification flow`

Validado:

- campaña aprobada;
- referencia de pago;
- reporte por dueño;
- folio bancario;
- confirmación previa;
- cancelación del envío;
- verificación administrativa;
- rechazo administrativo;
- motivo de rechazo;
- campaña no activa cuando el pago es rechazado;
- `starts_at = null` en rechazo;
- `ends_at = null` en rechazo;
- `verified_at = null` en rechazo;
- activación correcta cuando el pago es verificado;
- SQL de reproducción documentado.

SQL relacionado:

`docs/sql/sabinapp-anuncios-fix-contact-enum-118e3.sql`

---

### J8. Error ENUM de contactos

Estado: ✅ Corregido

Funciones corregidas:

- `get_ad_contact_target_url`;
- `submit_ad_request`;
- `resubmit_ad_request`.

Corrección:

`lower(contact_row.type::text)`

---

### J9. 118E-4 - alineación de assets y límites publicitarios

Estado: ✅ Completada

Objetivo:

Alinear PostgreSQL, servidor, interfaces y render público con las reglas actuales de publicidad.

Reglas objetivo:

- Campaña A: exactamente 1 imagen y sin video;
- Campaña B: de 1 a 6 imágenes o, alternativamente, 1 video;
- Campaña B no mezcla imágenes y video en una misma campaña;
- imagen publicitaria: máximo 1000 KB;
- video publicitario: máximo 16000 KB;
- probabilidad de Campaña B: `0.125`, equivalente a 1/8;
- tiempo previo al cierre: 10 segundos;
- cooldown: 30 minutos;
- no existe máximo de interstitials por sesión como regla de producto;
- `interstitial_enabled` debe permanecer en `false`.

Debe revisarse y sincronizarse:

- `ad_settings`;
- `ad_assets`;
- `enforce_requested_ad_single_asset()`;
- RPC de creación y reenvío de campañas;
- validaciones de servidor;
- formulario del anunciante;
- panel administrativo;
- límites de archivos;
- render público de Campaña A;
- preparación de Campaña B.

118E-4 no incluye activar Campaña B públicamente.

Documento de referencia:

`docs/SABINAPP-ANUNCIOS-1.0.md`
---

### J10. Campaña B - anuncio emergente

Estado: ✅ Implementada y probada localmente; activación pública pendiente de decisión

Definición actual:

- tipo `interstitial`;
- de 1 a 6 imágenes o 1 video;
- sin mezcla de imágenes y video;
- máximo 1000 KB por imagen;
- máximo 16000 KB por video;
- probabilidad objetivo de 1/8;
- 10 segundos antes de permitir cerrar;
- cooldown de 30 minutos;
- sin máximo por sesión como regla de producto;
- métricas de apariciones, impresiones por archivo y clics;
- moderación administrativa;
- interruptor global.

Pruebas locales completadas:

- Campaña B con tres imágenes: PASS;
- Campaña B con video: 8/8 PASS;
- apariciones separadas de impresiones individuales: PASS;
- métricas visibles para el propietario: PASS;
- exclusión temporal del mismo anuncio tras pulsar «Ver negocio»: 5/5 PASS.

Commits relacionados:

- `f03e40a` - apariciones reales y estadísticas;
- `b698c09` - evitar repetición inmediata en el negocio anunciante.

`interstitial_enabled` permanece en `false`. La activación pública requiere una decisión explícita y validación en producción.

---

### J11. Métricas publicitarias

Estado: ✅ Implementadas y probadas localmente; QA de producción pendiente

Endpoint:

`/api/ads/events`

Implementado y validado localmente:

- aparición del anuncio completo;
- impresión individual de imagen o video;
- clic publicitario asociado al archivo;
- estadísticas por campaña y archivo;
- consulta restringida de métricas del propietario.

Pendiente antes del lanzamiento:

- comprobar comportamiento en producción;
- repetir prueba de regresión publicitaria.

---

## K. Monetización

### K1. Publicidad pagada

Estado: 🟡 En progreso

La publicidad es el único mecanismo de cobro aprobado para Sabinapp 1.0.

El módulo debe quedar funcional, moderado y verificable antes del lanzamiento.

---

### K2. Suscripciones en Sabinapp 1.0

Estado: ✅ Fuera del alcance comercial de 1.0

Sabinapp 1.0 no cobrará suscripciones a los negocios.

La existencia de tablas, planes o infraestructura de suscripción no implica que el producto esté comercialmente habilitado.

---

### K3. Plan Básico - $199 MXN / mes

Estado: ⚪ Planeado para etapas posteriores

No se ofrece como suscripción pagada en Sabinapp 1.0.

Forma parte de la evolución prevista para Sabinapp 2.0 / 3.0.

---

### K4. Plan Profesional - $499 MXN / mes

Estado: ⚪ Planeado para etapas posteriores

No se ofrece como suscripción pagada en Sabinapp 1.0.

Forma parte de la evolución prevista para Sabinapp 2.0 / 3.0.

---

### K5. Suscripciones automáticas

Estado: ⚪ Post-1.0

No son requisito de lanzamiento y no deben habilitarse comercialmente como parte de Sabinapp 1.0.

---

## L. Administración general

### L1. Dashboard

Estado: ✅ Funcional

Ruta:

`/dashboard`

---

### L2. Administración de negocios

Estado: ✅ Funcional

---

### L3. Administración de noticias

Estado: ✅ Funcional

---

### L4. Administración de anuncios

Estado: ✅ Funcional

---

### L5. Operación sin Supabase Dashboard

Estado: 🟡 Pendiente de evaluación final

Objetivo:

Que las operaciones cotidianas de Sabinapp puedan realizarse desde la propia aplicación.

Supabase SQL Editor debe quedar reservado principalmente para:

- mantenimiento;
- migraciones;
- diagnóstico;
- soporte técnico.

---

## M. Seguridad

### M1. Rutas privadas

Estado: ✅ Base funcional

---

### M2. Roles y ownership

Estado: ✅ Base funcional

Debe continuar auditándose antes de producción.

---

### M3. RLS

Estado: 🟡 Auditoría final pendiente

Antes del lanzamiento debe comprobarse tabla por tabla que:

- usuarios no lean datos privados ajenos;
- usuarios no modifiquen negocios ajenos;
- acciones admin estén protegidas;
- comentarios y reportes respeten permisos;
- anuncios respeten propietario y administrador.

---

### M4. Server Actions

Estado: ✅ Funcionales

Las acciones sensibles deben validar permisos también del lado servidor.

---

### M5. Rutas `/dev`

Estado: 🟡 Revisión final pendiente

Rutas existentes:

- `/dev/db-test`
- `/dev/ads-test`

Antes del lanzamiento deben:

- estar protegidas;
- deshabilitarse;
- o eliminarse de producción.

---

### M6. Datos sensibles

Estado: 🔵 Auditoría final requerida

Debe comprobarse que ningún secreto, token o dato administrativo sensible llegue al cliente o al repositorio.

---

## N. UX y móvil

### N1. Responsive general

Estado: 🟡 Funcional / auditoría pendiente

Sabinapp debe ser utilizable desde:

- computadora;
- tablet;
- celular.

---

### N2. Flujos críticos en móvil

Estado: 🔵 Prueba final requerida

Probar:

- login;
- registro;
- buscador;
- negocio público;
- comentarios;
- noticias;
- clima;
- dashboard;
- anuncios.

---

### N3. Confirmaciones de acciones sensibles

Estado: ✅ Mejorado

Las acciones sensibles deben solicitar confirmación cuando exista riesgo de error operativo.

Ejemplos ya implementados:

- acciones administrativas;
- reporte de pago;
- rechazo de pago.

---

### N4. Aplicación Android/iOS

Estado: ⚪ Post-1.0

No bloquea el lanzamiento web.

---

## O. SEO y presencia pública

### O1. Metadata básica

Estado: 🟡 Revisión pendiente

---

### O2. Página de negocio indexable

Estado: 🟡 Revisión pendiente

Debe revisarse:

- title;
- description;
- canonical;
- Open Graph;
- contenido útil para buscadores.

---

### O3. SEO local

Estado: 🔵 Pendiente antes de lanzamiento

Prioridad:

Sabinas Hidalgo y búsquedas locales relacionadas con negocios, servicios y productos.

---

### O4. Sitemap / robots

Estado: 🔵 Revisar antes de producción

---

## P. Performance

### P1. Build

Estado: ✅ PASS frecuente

---

### P2. Imágenes

Estado: 🟡 Revisión pendiente

Existe uso histórico de `<img>` en algunas áreas.

Debe evaluarse si los warnings o tamaño de imágenes afectan producción.

---

### P3. Consultas Supabase

Estado: 🟡 Auditoría pendiente

Revisar consultas públicas de mayor frecuencia.

---

### P4. Carga móvil

Estado: 🔵 Prueba final requerida

---

## Q. Datos para lanzamiento

### Q1. Datos demo

Estado: 🔵 Limpieza requerida

Existen registros utilizados durante desarrollo.

Ejemplo histórico:

`Prueba Flujo 58A`

Los datos útiles para demostración pueden conservarse hasta la preparación final.

Antes del lanzamiento debe decidirse qué:

- conservar;
- limpiar;
- archivar;
- reemplazar por datos reales.

---

### Q2. Negocios iniciales

Estado: 🔵 Preparación requerida

Sabinapp necesita suficiente contenido útil el día del lanzamiento.

No debe lanzarse como un directorio vacío.

---

### Q3. Noticias iniciales

Estado: 🟡 Sistema disponible

Debe existir contenido reciente suficiente al momento del lanzamiento.

---

### Q4. Publicidad inicial

Estado: 🟡 Modelo en construcción

No es obligatorio tener muchas campañas, pero cualquier producto publicitario ofrecido debe funcionar correctamente.

---

## R. Documentación

### R1. Limpieza de documentación antigua

Estado: ✅ Completada

Eliminados del repositorio:

- `README-SABINAPP-CONTEXTO.md`;
- `SABINAPP-RECURSOS-ACTUALES.md`;
- `SABINAPP-SOURCES-UPDATE.md`.

---

### R2. Alcance Sabinapp 1.0

Estado: ✅ Actualizado

Documento: `docs/00-sabinapp-alcance-mvp-v1.md`

---

### R3. Modelo de datos

Estado: ✅ Actualizado

Documento: `docs/01-modelo-base-datos.md`

---

### R4. Árbol maestro

Estado: ✅ Actualizado

Documento: `docs/02-fases-desarrollo.md`

---

### R5. Reglas técnicas

Estado: ✅ Actualizado

Documento: `docs/03-reglas-tecnicas.md`

---

### R6. Pruebas manuales

Estado: ✅ Actualizado

Documento: `docs/04-pruebas-manuales.md`

---

### R7. Auditoría de cambios públicos

Estado: ✅ Actualizado

Documento: `docs/05-auditoria-cambios-publicos.md`

---

### R8. Estado local

Estado: ✅ Actualizado y compactado

Documento: `docs/SABINAPP-1.0-ESTADO-LOCAL.md`

---

### R9. Límites operativos

Estado: ✅ Actualizado

Documento: `docs/SABINAPP-1.0-LIMITES-OPERATIVOS.md`

---

### R10. Publicidad

Estado: ✅ Documentación sincronizada

Documento: `docs/SABINAPP-ANUNCIOS-1.0.md`

La fase técnica 118E-4 quedó completada, validada y versionada.

La arquitectura actual utiliza Supabase Storage para nuevos assets de negocios y publicidad, conserva únicamente los assets URL antiguos como historial y mantiene Campaña B deshabilitada hasta completar J10.

---

### R11. Noticias

Estado: ✅ Documentación sincronizada

Documento: `docs/SABINAPP-NOTICIAS-AUTOMATICAS-1.0.md`

---

### R12. README / instrucciones de agentes

Estado: ✅ Revisados

Archivos:

- `README.md`: actualizado;
- `AGENTS.md`: revisado y conservado;
- `CLAUDE.md`: revisado y conservado.

---

## S. QA final

### S1. `git diff --check`

Estado: ✅ Obligatorio por fase

---

### S2. `npm run lint`

Estado: ✅ Obligatorio por fase

---

### S3. `npm run build`

Estado: ✅ Obligatorio por fase

---

### S4. Smoke test público

Estado: 🔵 Repetir antes del lanzamiento

Debe incluir como mínimo:

- `/`
- `/negocios`
- `/productos`
- `/noticias`
- `/clima`
- `/negocio/[slug]`

---

### S5. Smoke test de autenticación

Estado: 🔵 Repetir antes del lanzamiento

---

### S6. Smoke test dueño

Estado: 🔵 Repetir antes del lanzamiento

---

### S7. Smoke test admin

Estado: 🔵 Repetir antes del lanzamiento

---

### S8. Smoke test anuncios

Estado: 🔵 Repetir después de terminar el módulo publicitario

---

### S9. Pruebas móviles

Estado: 🔵 Pendiente

---

## T. Producción

### T1. Preparación del entorno

Estado: 🔵 Pendiente

---

### T2. Variables de producción

Estado: 🔵 Pendiente de auditoría

---

### T3. Dominio

Estado: 🔵 Pendiente de cierre

---

### T4. Supabase producción

Estado: 🔵 Preparación / auditoría pendiente

---

### T5. Despliegue

Estado: 🔵 Pendiente

---

### T6. Smoke test post-despliegue

Estado: 🔵 Pendiente

---

### T7. Monitoreo inicial

Estado: 🔵 Pendiente

---

# 4. Bloqueadores actuales para lanzar Sabinapp 1.0

Los principales bloques todavía abiertos son:

1. auditar comentarios, reseñas y reportes;
2. cerrar controles de autenticidad y abuso;
3. realizar auditoría final de permisos y RLS;
4. cerrar SEO local;
5. revisar experiencia móvil;
6. decidir situación final de `/tiempo`;
7. proteger o retirar rutas `/dev`;
8. limpiar datos de desarrollo;
9. preparar contenido inicial de lanzamiento;
10. repetir QA publicitario y decidir activación pública de Campaña B;
11. preparar y validar despliegue de producción.

Este listado debe reducirse conforme las áreas obtengan PASS.

---

# 5. Punto estable actual

Última fase técnica cerrada:

**J10-8 — Evitar repetición inmediata del anuncio al visitar el negocio anunciante**

Estado:

✅ PASS en entorno local

Commit:

`b698c09 fix: evitar repetir anuncio al visitar negocio anunciante`

La fase J10-7G registró apariciones reales y estadísticas:

`f03e40a feat: registrar apariciones reales de anuncios`

La siguiente área de cierre para Sabinapp 1.0 es:

**M — Seguridad y permisos**

El módulo publicitario permanece desactivado globalmente en la base de desarrollo después de las pruebas. La decisión de activación pública sigue pendiente.
---

# 6. Regla para futuras actualizaciones semanales

Al actualizar este árbol:

1. no eliminar áreas solamente porque estén terminadas;
2. marcar terminadas como ✅;
3. actualizar porcentajes únicamente con evidencia;
4. agregar nuevos pendientes dentro de su área correspondiente;
5. evitar crear nuevas fases para funciones post-1.0 salvo que se decida formalmente incorporarlas;
6. mantener Sabinapp 1.0 orientada al lanzamiento;
7. no reabrir decisiones cerradas sin una razón funcional, técnica o comercial concreta.

---

# 7. Definición de terminado

Sabinapp 1.0 no necesita contener todas las ideas futuras del proyecto.

Se considerará lista cuando:

- las funciones comprometidas estén cerradas;
- los flujos críticos sean estables;
- seguridad y permisos hayan sido auditados;
- la experiencia pública sea útil;
- administración pueda operar el sistema;
- exista contenido suficiente;
- las pruebas finales pasen;
- producción esté desplegada y estable.

La prioridad sigue siendo:

**lanzar una Sabinapp local, útil, moderada y sostenible antes de convertirla en una plataforma mucho más grande.**
