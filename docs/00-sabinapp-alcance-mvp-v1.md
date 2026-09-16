# Sabinapp 1.0 - Alcance del producto

## 1. Definición

Sabinapp 1.0 es una plataforma digital local para Sabinas Hidalgo, Nuevo León.

Su propósito es concentrar en un mismo sitio información útil para la comunidad y conectar a ciudadanos, negocios locales y contenido de interés municipal.

Sabinapp 1.0 combina:

- directorio local moderado de negocios;
- buscador de negocios, productos y servicios;
- páginas públicas de negocios;
- noticias locales;
- información del clima;
- interacción comunitaria moderada;
- herramientas para dueños de negocios;
- administración y moderación;
- un sistema inicial de publicidad local.

Sabinapp 1.0 no pretende ser todavía una red social completa, una plataforma de comercio electrónico ni un sistema empresarial avanzado.

El objetivo de la versión 1.0 es lanzar una plataforma estable, útil desde el primer día y suficientemente completa para comenzar a atraer ciudadanos y negocios de Sabinas Hidalgo.

---

## 2. Alcance geográfico

Sabinapp 1.0 está enfocada inicialmente en:

**Sabinas Hidalgo, Nuevo León, México.**

El diseño técnico puede permitir expansión futura, pero la versión 1.0 debe priorizar las necesidades del municipio antes que una arquitectura multi-ciudad.

---

## 3. Tipos de usuario

### Visitante

Puede consultar contenido público sin iniciar sesión.

Puede:

- buscar negocios;
- consultar productos y servicios;
- abrir páginas públicas de negocios;
- consultar noticias;
- consultar clima;
- ver publicidad;
- consultar información pública disponible.

### Usuario registrado

Además de las funciones públicas puede participar en funciones comunitarias habilitadas.

Puede, según el módulo:

- mantener un perfil;
- publicar reseñas o comentarios;
- reportar contenido;
- interactuar con contenido que requiera autenticación.

### Dueño de negocio

Puede administrar uno o varios negocios asociados a su cuenta.

Puede:

- registrar negocios;
- editar información;
- administrar contenido público;
- administrar contactos;
- administrar horarios;
- administrar imágenes;
- administrar productos, servicios, menú y destacados;
- seleccionar el modo visual disponible;
- consultar el estado de revisión;
- publicar cuando las reglas de moderación lo permitan;
- solicitar campañas publicitarias;
- reportar pagos de publicidad cuando corresponda.

### Administrador

Puede moderar contenido y ejecutar operaciones administrativas.

Puede, entre otras funciones:

- revisar negocios;
- aprobar o rechazar cambios;
- publicar o despublicar contenido;
- archivar o suspender negocios;
- moderar comentarios y reportes;
- administrar noticias;
- revisar campañas publicitarias;
- verificar o rechazar reportes de pago;
- supervisar datos que requieren intervención administrativa.

---

## 4. Estados usados en esta documentación

Para evitar confundir funciones implementadas con funciones solamente planeadas:

- ✅ **Implementado y validado:** existe y fue probado.
- 🟡 **Implementado con cierre pendiente:** existe, pero todavía requiere auditoría, integración o pruebas adicionales.
- 🔵 **Comprometido para Sabinapp 1.0:** forma parte del alcance de lanzamiento, pero aún falta implementarlo o terminarlo.
- ⚪ **Post-1.0:** no es requisito para lanzar Sabinapp 1.0.

El estado detallado de cada fase debe mantenerse en:

`docs/02-fases-desarrollo.md`

---

## 5. Núcleo de negocios

### ✅ Registro y administración

Sabinapp 1.0 debe permitir:

- registrar uno o varios negocios por usuario;
- editar información del negocio;
- usar negocios con o sin local físico;
- manejar negocios permanentes y temporales;
- moderar la publicación antes de considerarla aprobada;
- conservar datos históricos cuando un negocio deja de publicarse.

### ✅ Información del negocio

Puede incluir:

- nombre;
- slug;
- categoría;
- tipo de negocio;
- descripción corta;
- descripción larga;
- dirección o ubicación;
- horarios;
- imágenes;
- contactos;
- etiquetas;
- productos;
- servicios;
- menú;
- destacados;
- configuración visual.

### ✅ Tipos y clasificación

La clasificación principal contempla:

- Restaurantes;
- Comercio;
- Servicios técnicos;
- Servicios profesionales;
- Otros.

Las etiquetas permiten una clasificación adicional y pueden ampliarse conforme crezca el directorio.

### ✅ Negocios temporales

Las fechas de vigencia se utilizan solamente cuando el tipo de negocio requiere temporalidad, por ejemplo actividades u ocasiones especiales.

---

## 6. Moderación de negocios

Sabinapp 1.0 es un directorio moderado.

La aprobación de un negocio o de datos que requieren validación administrativa no depende únicamente de una declaración del dueño.

La autorización correspondiente debe ser confirmada por administración cuando así lo requiera el flujo.

### Regla de conservación

No existe eliminación física directa de negocios como flujo administrativo normal.

Se priorizan estados como:

- no publicado;
- archivado;
- suspendido;
- vencido.

Esto permite conservar:

- historial;
- métricas;
- auditoría;
- relaciones con contenido existente.

---

## 7. Página pública del negocio

### ✅ Ruta pública

Cada negocio publicado puede tener una página pública en:

`/negocio/[slug]`

La página puede mostrar, según la información disponible:

- identidad del negocio;
- descripción;
- imágenes;
- horarios;
- ubicación;
- contactos;
- productos o servicios;
- menú;
- destacados;
- información adicional permitida.

### ✅ ContactHub

Las opciones de contacto público deben respetar como mínimo:

- contacto activo;
- contacto aprobado;
- disponibilidad pública.

### ✅ Modos visuales

Los modos actuales son:

- classic;
- modern;
- warm;
- compact;
- elegant;
- impact.

Cada modo visual debe mantenerse separado de los datos y de la lógica de permisos.

---

## 8. Directorio y búsqueda

### ✅ Directorio público

Ruta principal:

`/negocios`

Debe permitir descubrir negocios publicados y vigentes.

### ✅ Vitrina pública

Ruta principal:

`/productos`

Permite descubrir productos, servicios u ofertas asociadas con negocios publicados.

### 🟡 Buscador local

El buscador debe considerar información útil para encontrar negocios y oferta local.

Entre los campos relevantes pueden estar:

- nombre;
- categoría;
- etiquetas;
- descripción corta;
- descripción larga;
- productos;
- servicios.

Debe buscarse una experiencia tolerante a variaciones comunes del lenguaje, incluyendo singular y plural cuando sea razonable.

---

## 9. Noticias locales

### ✅ Ruta pública

`/noticias`

Sabinapp 1.0 incluye noticias de interés local.

### ✅ Administración

Ruta:

`/dashboard/admin/noticias`

El sistema contempla:

- obtención de candidatos;
- múltiples fuentes;
- revisión administrativa;
- publicación;
- rechazo;
- almacenamiento de fuentes;
- historial de procesos.

La automatización no sustituye la responsabilidad editorial.

El estado detallado del módulo se documenta en:

`docs/SABINAPP-NOTICIAS-AUTOMATICAS-1.0.md`

---

## 10. Clima

### ✅ Ruta pública principal

`/clima`

Sabinapp incluye información meteorológica útil para Sabinas Hidalgo.

Puede existir una ruta técnica o histórica adicional como `/tiempo`, pero la documentación y navegación pública deben favorecer una única ruta principal cuando se complete la consolidación.

La información mostrada puede evolucionar siempre que conserve utilidad local y estabilidad.

---

## 11. Interacción comunitaria

### 🟡 Negocios

Sabinapp contempla interacción de usuarios registrados en negocios, incluyendo reseñas o comentarios según el flujo implementado.

Debe existir moderación y posibilidad de reportar contenido.

### 🟡 Noticias

Sabinapp contempla comentarios de usuarios registrados en noticias.

Debe existir:

- identificación del usuario;
- moderación;
- reportes;
- controles contra abuso.

### Principio de autenticidad

Sabinapp debe favorecer participación de personas reales y reducir:

- bots;
- spam;
- suplantación;
- abuso;
- anonimato utilizado para evadir responsabilidad.

La versión 1.0 no necesita resolver completamente identidad digital, pero sí debe contar con controles razonables de autenticación y moderación.

---

## 12. Publicidad local

Sabinapp 1.0 incorpora un sistema inicial de publicidad para negocios locales.

La especificación detallada vive en:

`docs/SABINAPP-ANUNCIOS-1.0.md`

### 🟡 Campaña A - espacio publicitario fijo

El modelo contempla anuncios visuales integrados dentro de páginas públicas de Sabinapp.

Debe contemplarse su presencia también en:

`/negocio/[slug]`

La publicidad debe respetar moderación, vigencia y reglas de ubicación.

### 🔵 Campaña B - publicidad emergente de alto impacto

Forma parte del modelo comercial planteado para Sabinapp 1.0.

Su comportamiento esperado contempla:

- aparición probabilística;
- contenido visual o video;
- tiempo mínimo antes de permitir cerrar;
- controles de frecuencia;
- protección de la experiencia del usuario.

No debe considerarse terminada hasta que exista implementación y prueba funcional completa.

### ✅ Flujo administrativo inicial de anuncios

El sistema ya contempla, según la campaña y fase implementada:

- solicitud del dueño;
- revisión administrativa;
- aprobación;
- generación de referencia de pago;
- reporte de transferencia;
- verificación administrativa;
- rechazo de reporte;
- activación cuando corresponde;
- vigencia de campaña;
- registro de eventos publicitarios.

### Pagos de publicidad

Sabinapp 1.0 puede operar inicialmente con pagos externos y comprobación manual.

No es obligatorio integrar una pasarela de pagos en línea para lanzar 1.0.

---

## 13. Monetización y planes comerciales

Sabinapp 1.0 no comercializa suscripciones pagadas para negocios.

Los únicos pagos aprobados para Sabinapp 1.0 corresponden a campañas publicitarias.

La infraestructura de planes y suscripciones puede existir en PostgreSQL sin considerarse una función comercial activa de 1.0.

Los planes pagados actualmente previstos utilizan como referencia:

- plan Básico: $199 MXN mensuales;
- plan Profesional: $499 MXN mensuales.

Estos planes están reservados para etapas posteriores de Sabinapp 2.0 y 3.0 y no deben anunciarse como suscripciones disponibles en Sabinapp 1.0.

Las suscripciones recurrentes y su cobro automático quedan fuera del alcance comercial de Sabinapp 1.0.

---

## 14. Administración

Sabinapp debe contar con herramientas administrativas suficientes para operar el servicio sin depender directamente de Supabase para las tareas cotidianas.

Entre las operaciones administrativas pueden existir:

- revisión de negocios;
- vista previa;
- aprobación;
- rechazo;
- solicitudes de corrección;
- publicación;
- suspensión;
- archivado;
- moderación de contenido;
- noticias;
- publicidad;
- verificación de pagos;
- reportes.

Las operaciones destructivas deben minimizarse y las decisiones importantes deben dejar evidencia suficiente para auditoría.

---

## 15. Seguridad y permisos

Sabinapp 1.0 debe mantener separación entre:

- datos;
- permisos;
- interfaces;
- estilos.

Las acciones sensibles deben validarse también en servidor o base de datos y no depender exclusivamente de la interfaz.

Supabase y PostgreSQL deben proteger operaciones de acuerdo con:

- usuario autenticado;
- propietario;
- administrador;
- estado de publicación;
- estado de revisión;
- reglas específicas del recurso.

Las rutas de desarrollo no deben quedar expuestas de forma insegura en producción.

---

## 16. Métricas

Sabinapp puede registrar métricas necesarias para funcionamiento y evolución del producto.

Entre ellas:

- interacciones con contactos;
- impresiones publicitarias;
- clics publicitarios;
- actividad relacionada con campañas.

Las métricas avanzadas de inteligencia comercial no son requisito para el lanzamiento inicial.

---

## 17. Experiencia móvil

Sabinapp 1.0 debe funcionar correctamente desde navegadores móviles.

### ⚪ Aplicaciones nativas

Crear APK, aplicación Android o aplicación iOS independiente no es requisito para lanzar Sabinapp 1.0.

Puede evaluarse posteriormente:

- PWA;
- empaquetado móvil;
- aplicaciones nativas;
- publicación en tiendas.

---

## 18. Fuera del alcance obligatorio de Sabinapp 1.0

Las siguientes funciones no son necesarias para declarar lista la versión 1.0:

- red social completa;
- feed social infinito estilo Facebook o Instagram;
- sistema completo de influencers;
- foro comunitario general;
- chat privado entre usuarios;
- marketplace con compra dentro de Sabinapp;
- carrito de compras;
- procesamiento automático de pagos;
- facturación automática;
- suscripciones recurrentes automatizadas;
- aplicaciones Android o iOS nativas;
- sistema avanzado de recomendaciones algorítmicas;
- gamificación avanzada;
- expansión multi-ciudad;
- eliminación física directa de negocios desde administración;
- infraestructura empresarial sobredimensionada para el lanzamiento local.

Estas funciones pueden evaluarse para versiones posteriores.

---

## 19. Criterio para considerar Sabinapp 1.0 lista

Sabinapp 1.0 estará lista para lanzamiento público cuando:

1. las funciones comprometidas para el lanzamiento estén completas o explícitamente retiradas del alcance;
2. no existan errores críticos conocidos en los flujos principales;
3. permisos y moderación hayan sido auditados;
4. los datos demo o inconsistentes hayan sido limpiados;
5. las rutas públicas funcionen correctamente en móvil y escritorio;
6. auth y recuperación de cuenta funcionen;
7. registro, revisión y publicación de negocios funcionen de extremo a extremo;
8. buscador, negocios, productos, noticias y clima sean utilizables;
9. los módulos comunitarios incluidos tengan controles de moderación;
10. el sistema publicitario que se anuncie públicamente esté terminado y probado;
11. `npm run lint` pase;
12. `npm run build` pase;
13. exista una prueba manual final de lanzamiento;
14. exista un despliegue de producción estable;
15. exista capacidad administrativa suficiente para operar Sabinapp después del lanzamiento.

---

## 20. Principio de alcance

Sabinapp 1.0 debe priorizar:

**utilidad local + estabilidad + moderación + capacidad real de operación.**

Una función interesante no debe retrasar el lanzamiento si no es necesaria para que ciudadanos y negocios obtengan valor desde el primer día.

Las funciones sociales, comerciales y técnicas más ambiciosas deben incorporarse gradualmente después de establecer una base local estable.
