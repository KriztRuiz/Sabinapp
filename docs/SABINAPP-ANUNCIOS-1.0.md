# Sabinapp 1.0 - Modelo local de anuncios

Fecha: 2026-09-03

Este documento define el modelo inicial de anuncios para Sabinapp 1.0.

La meta no es crear una red publicitaria compleja, sino permitir campañas locales moderadas, vendidas manualmente y controladas por administrador.

No preparar despliegue sin confirmación explícita.

## Principio general

Sabinapp es primero un directorio local útil.

Los anuncios deben generar ingresos, pero sin destruir la confianza de usuarios ni dueños de negocios.

Reglas base:

- Todo anuncio requiere aprobación manual.
- No hay publicación automática de anuncios.
- No hay cobro automático en Sabinapp 1.0.
- No se muestran anuncios en rutas de autenticación.
- No se muestran anuncios en dashboard.
- No se muestran anuncios en paneles admin.
- No se muestran anuncios de contenido adulto fuera de espacios permitidos.
- No se deben mostrar anuncios engañosos, fraudulentos o claramente invasivos.
- El administrador puede pausar o archivar cualquier campaña.

## Campaña A - Anuncio fijo local

### Descripción

Campaña económica para negocios locales que quieren aparecer dentro de Sabinapp sin interrumpir al usuario.

Precio inicial sugerido:

- $150 MXN

El precio debe quedar configurable, no hardcodeado.

### Formato

- Sección fija dentro de páginas públicas.
- Carrusel simple de imágenes.
- De 3 a 5 imágenes.
- Las imágenes se muestran en bucle.
- El anuncio debe estar claramente identificado como anuncio o promoción.
- Puede tener botón o enlace hacia:
  - Página pública del negocio en Sabinapp.
  - WhatsApp.
  - Facebook.
  - Sitio externo aprobado.
  - Teléfono.
  - Ubicación.

### Páginas elegibles

Campaña A puede aparecer en:

- /
- /negocios
- /productos
- /noticias
- /clima
- /negocio/[slug]

Motivo especial para /negocio/[slug]:

- Mostrar anuncios en páginas de negocio puede incentivar al dueño a contratar su propio plan.
- En Sabinapp 2.0 puede convertirse en beneficio de pago:
  - Plan de $100 MXN/mes: no recibir anuncios de negocios del mismo rubro en tu página de negocio.
  - Plan de $400 MXN/mes: no recibir publicidad de negocios ajenos en tu página de negocio, excepto Campaña B si se decide mantenerla global.

### Ubicación visual sugerida

Prioridad para Sabinapp 1.0:

- En home: sección intermedia o inferior.
- En /negocios: entre filtros y resultados, o después de algunos resultados.
- En /productos: entre filtros y productos, o después de algunos productos.
- En /noticias: después de noticias recientes o antes del archivo.
- En /clima: después de lectura práctica.
- En /negocio/[slug]: debajo del bloque principal o entre secciones secundarias.

### Reglas de carga

- No debe bloquear la navegación.
- No debe tapar contenido.
- No debe reproducir sonido.
- No debe abrir enlaces automáticamente.
- No debe cargar demasiadas imágenes.
- Debe tener límite de peso por imagen.

### Riesgo UX

Bajo.

Es el formato más seguro para iniciar monetización sin molestar demasiado.

## Campaña B - Anuncio emergente de alto impacto

### Descripción

Campaña más agresiva y más cara para anuncios de alto impacto.

Precio inicial sugerido:

- $400 MXN por semana

El precio debe quedar configurable, no hardcodeado.

### Formato

- Anuncio emergente al entrar a una página pública elegible.
- Probabilidad inicial: 1 de cada 8 oportunidades.
- Puede mostrar:
  - 1 a 6 imágenes.
  - O 1 video.
- El usuario debe esperar 10 segundos antes de poder cerrar.
- Después de 10 segundos aparece botón de cerrar.
- El anuncio debe estar claramente marcado como anuncio.

### Páginas elegibles

Campaña B puede aparecer en páginas públicas:

- /
- /negocios
- /productos
- /noticias
- /clima
- /negocio/[slug]

No debe aparecer en:

- /auth/login
- /auth/sign-up
- /auth/forgot-password
- /auth/update-password
- /dashboard
- /dashboard/*
- /api/*
- /dev/db-test

### Regla importante de frecuencia

Aunque la idea comercial sea 1 de cada 8, para no dañar la experiencia se recomienda que Sabinapp 1.0 aplique además:

- Máximo 1 anuncio emergente por sesión.
- Cooldown mínimo sugerido: 30 minutos.
- No mostrar inmediatamente después de cerrar otro anuncio.
- No mostrar si el usuario viene de una acción sensible como login, registro o edición.

Decisión brutalmente honesta:

- Un anuncio imposible de cerrar por 10 segundos puede generar ingresos.
- También puede hacer que usuarios abandonen la página si se usa demasiado.
- Para Sabinapp 1.0 conviene mantenerlo controlado, medible y fácil de apagar desde admin.

### Reglas de video

- Sin autoplay con sonido.
- Video corto.
- Peso limitado.
- Debe verse bien en móvil.
- Debe tener fallback si no carga.
- No debe bloquear la página indefinidamente.

### Riesgo UX

Alto.

Debe implementarse con interruptor global para poder apagarlo rápido.

## Estados de campaña

Estados sugeridos:

- draft
- pending_review
- approved
- active
- paused
- expired
- rejected
- archived

Significado:

- draft: creada pero incompleta.
- pending_review: lista para revisión admin.
- approved: aprobada pero todavía no activa.
- active: visible públicamente.
- paused: detenida temporalmente.
- expired: terminó por fecha.
- rejected: rechazada por admin.
- archived: conservada sólo para historial.

## Tipos de campaña

Valores sugeridos:

- fixed_banner
- interstitial

Equivalencias:

- fixed_banner = Campaña A
- interstitial = Campaña B

## Entidades futuras de base de datos

No ejecutar SQL todavía.

Tablas candidatas:

### ad_campaigns

Guardaría la información principal de la campaña.

Campos conceptuales:

- id
- advertiser_business_id
- title
- description
- campaign_type
- status
- price_mxn
- starts_at
- ends_at
- target_url
- placement_scope
- priority
- probability_weight
- max_impressions
- max_clicks
- created_by
- reviewed_by
- reviewed_at
- rejection_reason
- created_at
- updated_at

### ad_assets

Guardaría imágenes o videos de cada campaña.

Campos conceptuales:

- id
- campaign_id
- asset_type
- url
- alt_text
- sort_order
- duration_seconds
- is_active
- created_at
- updated_at

### ad_impressions

Guardaría vistas de anuncios.

Campos conceptuales:

- id
- campaign_id
- asset_id
- page_path
- business_id
- session_key
- shown_at

### ad_clicks

Guardaría clics en anuncios.

Campos conceptuales:

- id
- campaign_id
- asset_id
- page_path
- business_id
- session_key
- clicked_at

### ad_settings

Guardaría interruptores globales.

Campos conceptuales:

- id
- fixed_banner_enabled
- interstitial_enabled
- interstitial_probability
- interstitial_cooldown_minutes
- interstitial_required_seconds
- updated_at

## Métricas mínimas para Sabinapp 1.0

Mínimo necesario:

- Impresiones por campaña.
- Clics por campaña.
- CTR básico.
- Estado de campaña.
- Fecha de inicio.
- Fecha de fin.

No necesario para 1.0:

- Segmentación avanzada.
- Subasta de anuncios.
- Pago automático.
- Facturación automática.
- Reportes descargables.
- Panel avanzado para anunciantes.

## Moderación

El administrador debe poder:

- Aprobar campaña.
- Rechazar campaña.
- Pausar campaña.
- Activar campaña.
- Archivar campaña.
- Ver imágenes o video.
- Ver enlace destino.
- Ver negocio anunciante, si existe.
- Ver fechas.
- Ver métricas básicas.

## Seguridad

No permitir:

- Scripts externos del anunciante.
- HTML personalizado.
- iframes arbitrarios.
- URLs javascript.
- Redirecciones sospechosas.
- Contenido adulto en espacios generales.
- Contenido engañoso.
- Contenido de apuestas, drogas, armas o fraude.

## Decisión para Sabinapp 1.0

Implementación recomendada por fases:

### Fase Ads 1

Crear tablas y políticas RLS.

### Fase Ads 2

Crear panel admin básico para campañas.

### Fase Ads 3

Mostrar Campaña A en páginas públicas.

### Fase Ads 4

Medir impresiones y clics básicos.

### Fase Ads 5

Agregar Campaña B con interruptor global apagado por defecto.

### Fase Ads 6

Activar Campaña B sólo después de prueba local y decisión explícita.

## Decisión de estabilidad

Para Sabinapp 1.0, Campaña A es segura para implementar primero.

Campaña B debe tratarse como función de alto riesgo UX y debe tener:

- Interruptor global.
- Límite por sesión.
- Cooldown.
- Tiempo de cierre configurable.
- Registro de impresiones.
- Posibilidad de apagarse sin modificar código.

No preparar despliegue sin confirmación explícita.
