# Sabinapp 1.0 - Límites operativos

Este documento define límites prácticos para mantener Sabinapp 1.0 estable, económico y controlable.

Sabinapp está pensado inicialmente para Sabinas Hidalgo, Nuevo León. No se espera una escala masiva nacional. Como referencia general, la aplicación no debería necesitar soportar más de 30,000 usuarios locales en su primera etapa.

Aun así, se definen límites para evitar abuso, costos innecesarios y consumo excesivo de almacenamiento o ancho de banda.

## Principio general

Los límites no existen para bloquear el crecimiento de Sabinapp.

Existen para evitar que pocos negocios, usuarios o imágenes mal optimizadas vuelvan costosa o lenta la plataforma.

El riesgo principal no es sólo la cantidad de usuarios, sino esta combinación:

cantidad de imágenes x peso de imágenes x cantidad de visitas

## Infraestructura inicial recomendada

Para Sabinapp 1.0:

- Vercel Hobby: $0
- Supabase Free: $0
- OpenAI API: pago por uso, sólo para automatización controlada de noticias
- Dominio: costo anual aparte

No se recomienda pagar Vercel Pro ni Supabase Pro antes de validar uso real.

## Cuándo considerar Supabase Pro

Supabase Pro debería considerarse antes que Vercel Pro si el problema principal empieza a ser:

- muchas imágenes de negocios
- mucho almacenamiento
- mucho tráfico sirviendo fotos
- necesidad de mayor tranquilidad operativa
- base de datos con uso real constante

La primera mejora de pago recomendada sería:

Vercel Hobby + Supabase Pro

## Cuándo considerar Vercel Pro

Vercel Pro debería considerarse si Sabinapp necesita:

- cron jobs más frecuentes que una vez al día
- automatización de noticias cada 4 a 8 horas
- mayor uso de funciones server-side
- más margen de tráfico
- operación comercial más seria

No se recomienda pagar Vercel Pro sólo por noticias antes de validar que la sección tenga uso real.

## Límites de imágenes por plan

### Negocio gratuito

- Imagen principal: 1
- Fotos adicionales: hasta 3
- Peso máximo sugerido por imagen: 1 MB
- Formato recomendado: WebP o JPG

Uso esperado:

- foto del negocio
- foto de fachada
- foto de producto o servicio
- imagen básica de referencia

### Plan de $100 MXN al mes

- Imagen principal: 1
- Fotos adicionales: hasta 6
- Peso máximo sugerido por imagen: 1.5 MB
- Formato recomendado: WebP o JPG

Uso esperado:

- galería más completa
- productos destacados
- menú visual básico
- evidencia del trabajo o servicio

### Plan de $400 MXN al mes

- Imagen principal: 1
- Fotos adicionales: hasta 12
- Peso máximo sugerido por imagen: 2 MB
- Formato recomendado: WebP o JPG

Uso esperado:

- galería amplia
- promociones
- banners internos
- secciones visuales destacadas
- campañas temporales

## Regla práctica para imágenes

Para Sabinapp 1.0:

- no permitir galerías infinitas
- no aceptar imágenes enormes sin control
- evitar fotos directas del celular sin compresión
- mantener una cantidad de fotos razonable por negocio
- priorizar imágenes útiles, no volumen

Un negocio local normalmente no necesita 30 imágenes para comunicar valor.

Necesita pocas imágenes buenas, claras y rápidas de cargar.

## Noticias automáticas

Para Sabinapp 1.0:

- Frecuencia inicial: 1 vez al día
- Publicación automática: sólo con confianza alta
- Noticias dudosas: guardar como candidatas o revisar antes de publicar
- Fuente principal: siempre debe existir
- Resumen: generado por IA, pero basado en fuentes rastreables

La IA no debe ser la fuente de verdad.

La IA puede:

- buscar
- comparar
- clasificar
- resumir
- detectar relevancia local
- sugerir fuente principal

Pero cada noticia debe conservar una fuente verificable.

## Noticias automáticas futuras

Cuando Sabinapp tenga uso real, se puede subir a:

- Frecuencia futura: cada 4 a 8 horas

Eso probablemente requerirá:

- Vercel Pro o servicio externo de cron
- control de costos de OpenAI API
- límites por ejecución
- deduplicación de noticias
- revisión de fuentes permitidas
- registro de errores y resultados

## Límites sugeridos para automatización de noticias

Por ejecución automática:

- Máximo de fuentes consultadas: 5 a 10
- Máximo de noticias candidatas analizadas: 10 a 20
- Máximo de noticias publicadas por ejecución: 3

Para Sabinapp 1.0:

- Máximo recomendado de noticias nuevas por día: 3 a 5

Esto evita llenar la app con ruido.

## Criterio para publicar noticias

Una noticia debería publicarse si cumple al menos una condición:

- menciona directamente Sabinas Hidalgo
- afecta directamente a Sabinas Hidalgo
- involucra municipios cercanos con impacto local
- habla de clima, seguridad, servicios, movilidad, economía local o avisos comunitarios relevantes
- proviene de una fuente rastreable

No debería publicarse si:

- es demasiado general
- no tiene impacto local claro
- no tiene fuente confiable
- parece duplicada
- parece rumor
- la IA no puede explicar por qué importa a Sabinas Hidalgo

## Criterio financiero

Mientras no haya tracción:

- mantener infraestructura gratuita

Cuando haya negocios reales pagando:

- primero considerar Supabase Pro

Cuando haya más tráfico, más funciones automáticas o necesidad de cron frecuente:

- después considerar Vercel Pro

## Decisión para Sabinapp 1.0

Sabinapp 1.0 debe iniciar con límites prudentes:

- Vercel gratuito
- Supabase gratuito
- imágenes limitadas por negocio
- noticias automáticas máximo una vez al día
- OpenAI API con bajo consumo
- sin pagos de infraestructura hasta validar uso real

Los límites podrán ampliarse cuando exista uso real, negocios activos y justificación económica.
