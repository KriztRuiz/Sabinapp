# Sabinapp 1.0 - Pruebas manuales

## 1. Propósito

Este documento contiene el checklist manual de regresión de Sabinapp 1.0.

No sustituye las pruebas automáticas, RLS ni las validaciones de PostgreSQL.

Una función no se considera validada sólo porque compile.

---

## 2. Validación técnica base

Antes de cerrar una fase ejecutar:

```bash
git diff --check
npm run lint
npm run build
git status --short
```

También debe probarse manualmente el flujo modificado.

---

## 3. Autenticación

Probar:

- `/auth/login`;
- `/auth/sign-up`;
- `/auth/forgot-password`;
- `/auth/update-password`.

Validar:

- registro;
- inicio de sesión;
- cierre de sesión;
- recuperación de contraseña;
- actualización de contraseña;
- redirección de usuarios no autenticados desde rutas protegidas;
- sesión válida después de navegación normal.

---

## 4. Rutas públicas principales

Probar:

- `/`;
- `/negocios`;
- `/productos`;
- `/noticias`;
- `/clima`;
- `/negocio/taqueria-el-primo`;
- `/negocio/abarrotes-la-esquina`.

Validar:

- respuesta correcta;
- navegación sin errores;
- textos comprensibles;
- enlaces funcionales;
- comportamiento móvil;
- estados vacíos razonables.

`/clima` es la ruta pública canónica de clima.

`/tiempo` debe revisarse antes del lanzamiento para decidir su redirección, retirada o compatibilidad final.

## 5. Directorio y búsqueda

Validar en `/negocios` y búsquedas relacionadas:

- negocios publicados visibles;
- negocios no publicados no visibles;
- búsquedas por nombre;
- búsquedas por descripción;
- categorías y tags;
- singular y plural cuando corresponda;
- resultados sin duplicados evidentes;
- enlaces hacia `/negocio/[slug]`.

Los negocios adultos no deben aparecer indebidamente en espacios generales.

Los negocios vencidos, archivados u ocultos no deben mostrarse como negocios públicos activos.

---

## 6. Página pública del negocio

Validar `/negocio/[slug]`:

- nombre y descripciones;
- imágenes activas;
- horarios;
- ubicación;
- tags;
- menú, productos o servicios;
- destacados;
- `show_price`;
- modo visual;
- ContactHub.

ContactHub debe abrir y cerrar correctamente.

Sólo deben mostrarse contactos activos y aprobados.

---

## 7. Panel del dueño

Probar:

- `/dashboard`;
- `/dashboard/perfil`;
- `/dashboard/negocios`;
- `/dashboard/negocios/new`;
- `/dashboard/negocios/[businessId]/edit`;
- `/dashboard/negocios/[businessId]/preview`.

Validar:

- crear negocio como borrador;
- editar nombre y descripciones;
- clasificación;
- imágenes;
- contactos;
- horarios;
- ubicaciones;
- menú, productos o servicios;
- destacados;
- tags;
- selector visual;
- vista previa;
- envío a revisión.

El selector visual debe permanecer debajo del contenido editable.

Las fechas temporales sólo deben solicitarse cuando el tipo de negocio lo requiera.

El dueño no debe poder autoaprobar la autorización administrativa del negocio.

---

## 8. Administración de negocios

Probar:

- `/dashboard/admin/negocios`;
- `/dashboard/admin/negocios/[businessId]/preview`.

Validar según el flujo disponible:

- revisión;
- aprobación;
- rechazo;
- publicación;
- ocultamiento;
- suspensión;
- reactivación;
- archivado;
- historial o auditoría.

No debe existir eliminación física directa como acción administrativa normal.

Un usuario no administrador no debe poder ejecutar estas operaciones.

---

## 9. Comunidad

Validar cuando corresponda:

- reseñas de negocios;
- comentarios de noticias;
- reportes;
- estados de moderación;
- permisos del autor;
- ocultamiento o retirada administrativa.

Un usuario no debe poder modificar contenido perteneciente a otro usuario.

El contenido privado del perfil no debe exponerse públicamente.

---

## 10. Noticias

Probar:

- `/noticias`;
- `/dashboard/admin/noticias`.

Validar:

- noticias activas visibles;
- fuentes y enlaces correctos;
- candidatos separados de noticias publicadas;
- revisión administrativa;
- publicación de candidato;
- rechazo de candidato;
- comentarios cuando estén habilitados;
- moderación de comentarios.

Un candidato generado automáticamente no debe considerarse publicado sólo por existir en la base de datos.

Los errores de obtención automática no deben romper `/noticias`.

---

## 11. Publicidad del dueño

Probar:

- `/dashboard/anuncios`;
- `/dashboard/anuncios/nuevo`;
- `/dashboard/anuncios/[campaignId]/editar`.

Validar:

- creación de solicitud;
- edición permitida;
- envío a revisión;
- correcciones solicitadas;
- reenvío;
- reporte de pago;
- confirmación antes de reportar pago.

El dueño puede reportar un pago, pero no verificarlo.

---

## 12. Administración de publicidad

Probar `/dashboard/admin/anuncios`.

Validar:

- aprobar solicitud;
- rechazar solicitud;
- solicitar cambios;
- verificar pago;
- rechazar pago;
- confirmación antes de un rechazo sensible.

Caso positivo de pago:

- el pago queda verificado;
- la campaña puede activarse;
- se establecen fechas de vigencia cuando corresponda.

Caso negativo de pago:

- el pago queda rechazado;
- la campaña no se activa;
- no inicia vigencia;
- no consume días contratados;
- se conserva el motivo administrativo.

## 13. Publicidad pública y métricas

Validar según las campañas implementadas:

- anuncio correcto;
- ubicación permitida;
- asset activo;
- destino correcto;
- impresión registrada;
- clic registrado;
- campaña vencida no mostrada;
- campaña rechazada no mostrada;
- campaña pausada no mostrada.

La infraestructura de `interstitial` no debe considerarse terminada sólo porque exista en PostgreSQL.

---

## 14. Seguridad y permisos

Probar al menos con:

- visitante;
- usuario registrado;
- dueño;
- administrador.

Validar:

- visitante sin acceso a dashboard;
- dueño sin acceso administrativo;
- dueño sin capacidad para editar negocios ajenos;
- usuario sin capacidad para modificar contenido ajeno;
- identificadores manipulados manualmente rechazados;
- datos privados fuera de respuestas públicas;
- operaciones sensibles protegidas también en servidor o base de datos.

---

## 15. UX y móvil

Probar al menos en ancho móvil y escritorio.

Validar:

- navegación;
- formularios;
- botones;
- modales o confirmaciones;
- ContactHub;
- imágenes;
- textos largos;
- estados de carga;
- mensajes de éxito y error.

El warning `fdprocessedid` no debe bloquear QA salvo que exista impacto funcional comprobado.

---

## 16. Preparación para producción

Antes del lanzamiento validar:

- `/dev/db-test` protegido, deshabilitado o retirado;
- `/dev/ads-test` protegido, deshabilitado o retirado;
- datos demo revisados;
- negocios de prueba que no deban salir al público retirados o despublicados;
- variables de entorno correctas;
- URLs públicas correctas;
- permisos y RLS auditados;
- errores de consola relevantes corregidos;
- experiencia móvil aceptable.

---

## 17. Criterio de PASS

Una prueba es PASS cuando el comportamiento esperado fue observado directamente.

Un `200`, un build correcto o una fila existente en PostgreSQL no sustituyen por sí solos una validación funcional.

Antes de cerrar la fase completa ejecutar nuevamente:

```bash
git diff --check
npm run lint
npm run build
```

## Seguimiento de la beta pública · 22 de noviembre de 2026

Entorno: Render, rama beta. Registro de prueba: Prueba QA Sabinapp, slug `prueba-qa-sabinapp`. Usar exclusivamente este registro para moderación.

| Caso | Evidencia y estado |
| --- | --- |
| Alta, revisión, aprobación y publicación | Verificado en la sesión anterior. Landing anónima HTTP 200 con el nombre del negocio. El dueño vio el rol en su dashboard. |
| Punto de partida | Brave mostró «Negocio publicado», 10 publicados y 2 retirados en el panel de moderación. |
| Retiro y restauración | Pendiente. Verificar en cada paso landing anónima, directorio y Tus roles tras recargar. Comprobar si el dueño tiene otro negocio elegible. |
| Rechazo y corrección | Pendiente. Comprobar que el dueño ve el motivo, puede editar y reenviar, y que la ficha permanece fuera del directorio hasta su publicación. |
| Permisos | Pendiente contrastar administrador, subadministrador y dueño con sesiones separadas. |
| Correo | Cuenta de prueba confirmada previamente. Quedan entrega de reenvío a una cuenta pendiente y recuperación con llegada efectiva al dominio de Render. |
| Móvil | Pendiente comprobar navegación, lectura, formularios y ContactHub con ancho móvil. |

Observación de experiencia: el historial de reportes y los cambios detallados preceden a la lista de negocios. Considerar un enlace «Ir a negocios por estado» y medir si reduce los pasos para llegar a moderación.

Actualización del retiro: Supabase muestra `hidden` e `is_published=false`. El titular tiene un único negocio. La landing respondió HTTP 404 al visitante y /negocios respondió 200 sin el nombre de la ficha. Sin sesión, /dashboard/admin/negocios respondió 307 a /auth/login. La página de recuperación respondió 200. Las pruebas de entrega de correo siguen abiertas. Lint y build terminaron con código 0.

En Brave privado, después de actualizar el dashboard, «Tus roles» mostró únicamente «Usuario registrado». El resumen mostró 1 negocio, 0 publicados y 1 no publicado. El panel explicó que solicitar publicidad requiere al menos un negocio publicado.

Cambio local de navegación en app/dashboard/admin/negocios/page.tsx: el encabezado enlaza directamente a la sección de negocios por estado. El enlace se muestra cuando la sección está disponible. Verificación estructural: un único destino con el título previsto. Pendiente comprobar el desplazamiento en el navegador con esta versión desplegada.

### 23 de noviembre de 2026 · Republicación en Render

El panel administrativo mostró «Negocio visible nuevamente». Desde Cristian-Asus se consultó el negocio con el cliente público sin sesión. Supabase devolvió `published` e `is_published=true`. La ficha respondió HTTP 200 con el nombre «Prueba QA Sabinapp». El directorio respondió HTTP 200 e incluyó un enlace a la ficha. Queda comprobar el rol tras recargar el panel autenticado.
Verificado después de la republicación en Brave privado: el titular vio «Usuario registrado» y «Dueño de negocio» en Tus roles, con 1 negocio publicado y 0 no publicados. Ciclo de retiro y restauración completo.
Retiro voluntario confirmado en la beta desde la cuenta del titular. Supabase devolvió hidden e is_published=false para prueba-qa-sabinapp. La ficha pública respondió HTTP 404 sin el nombre del negocio.
Reenvío tras el retiro voluntario verificado el 23 de noviembre: Prueba QA Sabinapp pasó a pending_review, con is_published=false y sin motivo de rechazo. La ficha anónima respondió HTTP 404 durante la revisión.

Rechazo administrativo confirmado en Supabase para prueba-qa-sabinapp. Estado rejected, is_published=false. Motivo guardado: Prueba QA: indica en la descripción corta qué tipo de comida ofrece el restaurante ficticio y vuelve a enviar la ficha. Ficha sin sesión: HTTP 404.
El editor del titular mostró Rechazado y el motivo exacto registrado por administración al recargar. Se introdujo la corrección solicitada en la descripción corta.

Corrección persistida para la ficha QA. Descripción: Restaurante ficticio de prueba que ofrece tacos de guisado y comida casera. Estado: rejected. is_published=false.

### Reenvío de la ficha corregida

La cuenta titular corrigió la descripción y reenvió Prueba QA Sabinapp. Supabase conservó el texto corregido y devolvió pending_review e is_published=false. La ficha anónima respondió HTTP 404. El directorio respondió HTTP 200 sin el nombre del negocio. Se deja el registro ficticio en revisión para evitar exponerlo al público.

El reenvío del titular conservó el motivo administrativo anterior y la fecha de envío registrada. En el editor y el panel de moderación se distingue ahora el motivo actual del anterior. Una nota explica la fecha durante la revisión. Se verificó localmente el contenido HTML para rechazado, pendiente y borrador en ambas pantallas.
Prueba móvil en Render con ventana de 390 × 844. El directorio y la ficha Taquería El Primo presentaron 375 px útiles y 375 px de contenido, sin desplazamiento horizontal. Contactar ahora desplegó WhatsApp, teléfono y correo; Cerrar contacto volvió a contraer el menú. Se observaron otras dos fichas públicas identificadas como pruebas: Prueba Idempotencia UI 17B12 y Sabinapp Prueba Beta 2211. Pendiente revisar su retiro antes de difusión.

### 25 de noviembre de 2026 — Recuperación de contraseña en Render

Se envió el formulario desde /auth/forgot-password con la cuenta de pruebas autorizada. La beta mostró el mensaje genérico previsto. La entrega en el buzón y el dominio final del enlace quedan pendientes de verificación.

Validación local de los cambios de moderación: npm run lint y npm run build finalizaron correctamente. En la revisión del código de gestión de subadministradores se verificó que la acción exige sesión y rol admin, y rechaza cambios al propio usuario. Queda probar la interfaz con una sesión de subadministrador.

### 25 de noviembre de 2026 — Navegación de moderación y recuperación

La portada de revisión enlaza a cuatro páginas independientes. La compilación de producción generó por-estado, cambios, resenas y comentarios. Lint y build finalizaron con código 0. Ocho comprobaciones de HTML renderizado verificaron los destinos, el indicador de página activa y la cantidad de enlaces con y sin permiso de reportes. Falta el recorrido con una sesión administrativa en Render.

El titular confirmó recepción del correo de recuperación. Al abrirlo terminó en localhost:3000 con otp_expired. Queda revisar Site URL y Redirect URLs en el proyecto alojado y repetir con una liga nueva.
