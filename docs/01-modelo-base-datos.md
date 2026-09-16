# Sabinapp 1.0 - Modelo de base de datos

## 1. Base técnica

Sabinapp utiliza Supabase con PostgreSQL.

El esquema `public` contiene actualmente 44 tablas base.

El inventario validado muestra RLS habilitado en las 44 tablas públicas.

Que RLS esté activado no significa que todas las políticas sean correctas; antes del lanzamiento debe realizarse una auditoría final de permisos.

La presencia de una tabla tampoco significa automáticamente que su función esté habilitada en la interfaz de Sabinapp 1.0.

---

## 2. Identidad, roles y permisos

Tablas principales:

- `profiles`;
- `roles`;
- `permissions`;
- `user_roles`;
- `role_permissions`.

Estas tablas complementan Supabase Auth y permiten manejar perfil, estado, roles y permisos internos.

`profiles` incluye datos como nombre, usuario, teléfono, fecha de nacimiento, estado y finalización del perfil.

---

## 3. Núcleo de negocios

La entidad principal es `businesses`.

Tablas relacionadas:

- `business_types`;
- `categories`;
- `business_settings`;
- `business_media`;
- `business_hours`;
- `business_locations`;
- `contact_methods`;
- `business_items`;
- `tags`;
- `business_tags`;
- `business_members`;
- `business_member_permissions`;
- `business_review_logs`;
- `business_change_events`.

## 4. Estados de negocio

`businesses.status` utiliza el enum `business_status`:

- `draft`;
- `pending_review`;
- `approved`;
- `rejected`;
- `published`;
- `hidden`;
- `suspended`;
- `archived`;
- `expired`.

La publicación pública depende además de campos como `is_published`, vigencia y reglas de moderación.

Los negocios archivados o suspendidos no deben eliminarse físicamente como flujo administrativo normal.

`owner_confirmed_authorization` existe en `businesses` y su confirmación corresponde al flujo administrativo.

---

## 5. Clasificación y ubicación

`business_types` define tipos de negocio y puede indicar si requieren fechas temporales o si están relacionados con contenido adulto.

`categories` pertenece a un tipo de negocio y admite jerarquía mediante `parent_id`.

`business_locations` soporta el enum `business_location_type`:

- `physical_location`;
- `home_service`;
- `pickup_point`;
- `contact_only`;
- `temporary_event`;
- `service_area`.

Esto permite negocios con o sin establecimiento físico.

---

## 6. Contenido del negocio

`business_media` almacena logo, portada, galería o video.

`business_hours` almacena horarios y periodos por día.

`contact_methods` almacena contactos públicos y distingue actividad, aprobación, verificación y prioridad.

`business_items` almacena menú, productos, servicios, paquetes, instalaciones, actividades, reglas, preguntas frecuentes u otros elementos.

`show_price` determina si el precio de un elemento debe mostrarse.

`is_featured` permite distinguir los elementos destacados.

`business_settings` controla la configuración visual y visibilidad de secciones.

---

## 7. Comunidad y moderación

Tablas principales:

- `reviews`;
- `news_comments`;
- `reports`.

`reviews` relaciona usuarios con negocios e incluye estado de moderación.

`news_comments` relaciona usuarios con noticias y también incluye moderación.

`reports` puede apuntar a negocios, contactos, imágenes, items, usuarios, reseñas y comentarios de noticias.

Los reportes utilizan enums para tipo de objetivo, motivo y estado.

---

## 8. Auditoría de negocios

`business_review_logs` conserva acciones del ciclo de revisión.

`business_change_events` registra cambios públicos con snapshots, datos anteriores, datos posteriores y estado de revisión.

Estas tablas ayudan a conservar trazabilidad administrativa.

---

## 9. Búsqueda y métricas

Tablas relacionadas:

- `search_logs`;
- `page_views`;
- `contact_clicks`.

Permiten registrar búsquedas, visitas a negocios e interacciones con contactos.

Estas métricas no implican todavía un sistema avanzado de inteligencia comercial.

---

## 10. Home configurable

Tablas:

- `home_sections`;
- `home_section_items`.

Permiten estructurar secciones configurables de portada y relacionarlas con negocios, categorías o tags.

---

## 11. Noticias

Tablas principales:

- `local_news`;
- `news_candidates`;
- `news_candidate_sources`;
- `news_fetch_runs`;
- `news_search_queries`;
- `news_sources`;
- `news_comments`.

El modelo separa noticias publicadas, candidatos, fuentes, procesos de obtención, búsquedas configuradas y comentarios.

La existencia de candidatos no implica publicación automática.

---

## 12. Publicidad

Tablas:

- `ad_campaigns`;
- `ad_assets`;
- `ad_payments`;
- `ad_impressions`;
- `ad_clicks`;
- `ad_settings`.

`ad_campaigns` soporta los tipos `fixed_banner` e `interstitial`.

Estados de campaña:

- `draft`;
- `pending_review`;
- `approved`;
- `active`;
- `paused`;
- `expired`;
- `rejected`;
- `archived`.

`ad_assets` admite imagen y video.

`ad_payments` registra referencia esperada, referencia reportada, usuario que reportó, verificación administrativa y notas.

El campo `ad_payments.status` es actualmente `text`, no un enum PostgreSQL.

`ad_impressions` y `ad_clicks` conservan métricas de exposición e interacción.

`ad_settings` ya contiene configuración para banners e interstitial, aunque la presencia del esquema no significa que ambas campañas estén terminadas en producto.

---

## 13. Planes, suscripciones y cupones

Sabinapp 1.0 no comercializa suscripciones pagadas.

Las tablas y configuraciones de planes/suscripciones existentes se conservan como infraestructura preparada para etapas posteriores.

Los únicos pagos aprobados para Sabinapp 1.0 corresponden al sistema de publicidad.

Los precios configurados de $199 MXN y $499 MXN pertenecen a la planificación comercial futura de Sabinapp 2.0 / 3.0 y no a una oferta activa de Sabinapp 1.0.

El esquema contiene:

- `plans`;
- `business_subscriptions`;
- `coupons`;
- `coupon_redemptions`.

Estas tablas preparan capacidades comerciales futuras.

No deben documentarse como funciones disponibles para usuarios hasta que exista interfaz, permisos y flujo funcional validado.

---

## 14. Funciones y RPC

PostgreSQL contiene funciones para:

- roles y permisos;
- ownership;
- ciclo de revisión y publicación de negocios;
- expiración, suspensión y archivado;
- normalización de datos;
- reseñas;
- solicitud y revisión de anuncios;
- reporte, verificación y rechazo de pagos;
- obtención de anuncios públicos.

Muchas operaciones sensibles utilizan `SECURITY DEFINER` y deben mantenerse bajo auditoría de permisos y `search_path`.

---

## 15. Relaciones principales

Las relaciones clave siguen principalmente este patrón:

- `businesses` es el padre de medios, horarios, ubicaciones, contactos, items, tags, reseñas, métricas y campañas;
- `ad_campaigns` es el padre de assets, pagos, impresiones y clics;
- `local_news` es el padre de comentarios;
- `news_candidates` se relaciona con sus fuentes y puede enlazar una noticia publicada;
- `roles` se relaciona con permisos mediante `role_permissions`;
- los usuarios reciben roles mediante `user_roles`.

---

## 16. Regla documental

Este documento describe la arquitectura lógica y no sustituye el esquema real de PostgreSQL.

Cuando exista una duda sobre columnas, tipos, constraints, políticas o funciones debe consultarse directamente la base de datos.

RLS habilitado no equivale por sí solo a RLS correctamente configurado.
