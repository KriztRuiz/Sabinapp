# Sabinapp 1.0 - Límites operativos

Última sincronización documental: 2026-09-15

## 1. Propósito

Este documento registra límites y reglas operativas relevantes para mantener Sabinapp 1.0 estable, controlable y económicamente sostenible.

Se distinguen cuatro conceptos:

- límite técnico: impuesto realmente por código, PostgreSQL o infraestructura;
- límite de producto: regla decidida para una función o plan;
- límite operativo: medida para controlar costos, abuso o ruido;
- objetivo futuro: capacidad prevista pero todavía no habilitada.

La existencia de una columna o configuración no demuestra por sí sola que una regla esté aplicada completamente en el producto.

---

## 2. Alcance local

Sabinapp 1.0 está enfocado inicialmente en Sabinas Hidalgo, Nuevo León.

No se establece una cantidad fija de usuarios como capacidad garantizada.

El crecimiento debe evaluarse mediante uso real, almacenamiento, tráfico, consultas, rendimiento y costos.

---

## 3. Planes configurados actualmente

PostgreSQL contiene actualmente tres planes activos.

### Gratis

- key: `free`;
- precio configurado: $0 MXN al mes;
- máximo de fotos configurado: 5;
- cupones: no;
- anuncios: no;
- modos visuales avanzados: no;
- métricas avanzadas: no.

### Básico

- key: `basic`;
- precio configurado: $199 MXN al mes;
- máximo de fotos configurado: 15;
- cupones: sí;
- anuncios: no;
- modos visuales avanzados: sí;
- métricas avanzadas: no.

### Profesional

- key: `pro`;
- precio configurado: $499 MXN al mes;
- máximo de fotos configurado: 50;
- cupones: sí;
- anuncios: sí;
- modos visuales avanzados: sí;
- métricas avanzadas: sí.

## 4. Reglas de planes y monetización

Las filas `free`, `basic` y `pro` existentes en PostgreSQL forman parte de la infraestructura de producto.

Sabinapp 1.0 no comercializa suscripciones pagadas.

Los únicos pagos aprobados para Sabinapp 1.0 corresponden a campañas publicitarias.

Los precios configurados actualmente para los planes pagados son:

- `basic`: $199 MXN mensuales;
- `pro`: $499 MXN mensuales.

Estos precios están reservados para etapas posteriores de Sabinapp 2.0 / 3.0.

Sabinapp 1.0 no utilizará un límite de cantidad de items por plan como regla de producto.

La cantidad de fotos permanece configurada técnicamente por plan y deberá revisarse nuevamente cuando se habiliten comercialmente los planes pagados.

No se define aquí un límite de peso para fotografías normales de negocios mientras no exista una regla técnica validada.

---

## 5. Negocios temporales

Entre los tipos activos actuales, sólo `ocasiones_especiales` requiere fechas de inicio y fin.

No requieren fechas temporales:

- `comida_preparada`;
- `comercio`;
- `servicios_tecnicos`;
- `servicios_profesionales`;
- `sitios_de_interes`.

Las fechas temporales no deben solicitarse para negocios permanentes.

Actualmente ninguno de estos seis tipos activos está marcado como `is_adult_related = true`.

---

## 6. Publicidad

Sabinapp 1.0 contempla dos formatos principales de campaña.

### Campaña A

- anuncio fijo integrado en ubicaciones permitidas de Sabinapp;
- cada campaña contiene exactamente 1 imagen;
- no utiliza video;
- imagen máxima: 1000 KB.

### Campaña B

- formato interstitial de alto impacto;
- puede contener de 1 a 6 imágenes;
- alternativamente puede utilizar 1 video;
- no mezcla carrusel de imágenes y video dentro de la misma campaña;
- probabilidad objetivo: `0.125`, equivalente a 1/8;
- tiempo obligatorio antes de permitir cerrar: 10 segundos;
- cooldown configurado: 30 minutos;
- imagen máxima: 1000 KB;
- video máximo: 16000 KB.

No existe un máximo de interstitials por sesión como regla de producto.

Campaña B continúa deshabilitada mientras `interstitial_enabled = false`.

## 7. Sincronización pendiente de publicidad

La configuración actual de PostgreSQL todavía contiene valores anteriores que deben sincronizarse con estas decisiones de producto.

En particular debe revisarse:

- límite de assets de Campaña A;
- tamaño máximo de imágenes publicitarias;
- tamaño máximo de videos publicitarios;
- uso del campo `max_interstitials_per_session`.

No es necesario eliminar columnas sólo porque una regla deje de utilizarse.

Por estabilidad, una columna sin uso puede conservarse mientras el código deje de depender de ella.

---

## 8. Noticias asistidas por IA

La IA genera candidatos de noticias, pero no decide qué se publica.

La publicación actual requiere revisión administrativa manual.

Durante la generación se filtran candidatos con más de 24 horas de antigüedad.

Una noticia ya publicada no se oculta automáticamente únicamente por antigüedad.

Cada noticia debe conservar una fuente rastreable.

La generación debe evitar duplicados, contenido sin relevancia local y fuentes dudosas.

No se documenta una frecuencia automática de cron como límite vigente mientras dicho proceso no esté implementado y validado.

## 9. Criterio editorial

Antes de publicar un candidato, administración debe revisar relevancia local, fuente, fecha y posible duplicidad.

Los puntajes de relevancia y confianza son apoyo para revisión y no sustituyen la decisión administrativa.

---

## 10. Infraestructura y costos

La estrategia inicial es mantener costos bajos mientras Sabinapp valida uso real.

No se fijan precios de proveedores externos como límites permanentes porque sus planes y tarifas pueden cambiar.

Una ampliación de infraestructura debe responder a señales reales como:

- almacenamiento creciente;
- tráfico sostenido;
- ancho de banda;
- carga de base de datos;
- automatizaciones más frecuentes;
- requisitos de disponibilidad.

---

## 11. Prevención de abuso

Los límites deben proteger almacenamiento, ancho de banda, automatizaciones, publicidad y contenido generado por usuarios.

Los límites deben revisarse con evidencia real de uso y no sólo mediante estimaciones.

---

## 12. Regla documental

Cuando exista conflicto entre este documento y el sistema real, deben comprobarse PostgreSQL y el código activo.

Un valor existente en base de datos puede representar infraestructura preparada y no necesariamente una función habilitada.

Precios, beneficios y límites comerciales deben validarse nuevamente antes del lanzamiento público.
