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
