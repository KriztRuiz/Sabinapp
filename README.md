# Sabinapp

Sabinapp es una plataforma local para Sabinas Hidalgo, Nuevo León, enfocada en conectar ciudadanos con negocios, productos, servicios, noticias, clima e información de la comunidad.

Sabinapp 1.0 mantiene un modelo moderado: los negocios, campañas publicitarias y noticias sensibles pasan por flujos administrativos antes de publicarse cuando corresponde.

## Stack

- Next.js 16.3.3 con App Router;
- React 19.2.4;
- TypeScript;
- Tailwind CSS;
- Supabase;
- PostgreSQL;
- `@supabase/supabase-js`;
- `@supabase/ssr`;
- OpenAI API para generación asistida de candidatos de noticias.

## Funciones principales

Sabinapp 1.0 incluye actualmente:

- autenticación y recuperación de contraseña;
- perfiles de usuario;
- registro y administración de negocios;
- revisión y publicación administrativa;
- directorio público de negocios;
- búsqueda de negocios, productos y servicios;
- páginas públicas automáticas en `/negocio/[slug]`;
- contactos, horarios, ubicaciones, imágenes y contenido comercial;
- menú, productos, servicios y destacados;
- modos visuales por negocio;
- clima local;
- noticias locales asistidas por IA con publicación manual;
- comentarios y mecanismos de reporte donde están habilitados;
- campañas publicitarias locales;
- métricas básicas de publicidad y contactos.

## Rutas principales

### Públicas

- `/`;
- `/negocios`;
- `/productos`;
- `/noticias`;
- `/clima`;
- `/negocio/[slug]`.

`/clima` es la ruta canónica del módulo de clima.

`/tiempo` se conserva como ruta de compatibilidad y redirige hacia `/clima`.

### Autenticación

- `/auth/login`;
- `/auth/sign-up`;
- `/auth/sign-up-success`;
- `/auth/forgot-password`;
- `/auth/update-password`;
- `/auth/callback`.

### Panel del usuario

- `/dashboard`;
- `/dashboard/perfil`;
- `/dashboard/negocios`;
- `/dashboard/negocios/new`;
- `/dashboard/negocios/[businessId]/edit`;
- `/dashboard/negocios/[businessId]/preview`;
- `/dashboard/anuncios`;
- `/dashboard/anuncios/nuevo`;
- `/dashboard/anuncios/[campaignId]/editar`.

### Administración

- `/dashboard/admin/negocios`;
- `/dashboard/admin/negocios/[businessId]/preview`;
- `/dashboard/admin/noticias`;
- `/dashboard/admin/anuncios`.

### Desarrollo

- `/dev/db-test`;
- `/dev/ads-test`.

Las rutas de desarrollo no deben considerarse rutas públicas de producción.

## APIs relevantes

- `/api/admin/news/generate`;
- `/api/admin/news/candidates/publish`;
- `/api/admin/news/candidates/reject`;
- `/api/ads/events`.

Las operaciones sensibles deben comprobar autenticación, permisos y reglas de servidor; la interfaz no debe ser la única barrera de seguridad.

## Modos visuales de negocios

Los modos disponibles actualmente son:

- `classic`;
- `modern`;
- `warm`;
- `compact`;
- `elegant`;
- `impact`.

Los estilos viven en `lib/landing/styles/`.

Cada modo debe mantenerse separado y el selector visual debe permanecer debajo de la sección donde se edita el contenido del negocio.

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Iniciar desarrollo:

```bash
npm run dev
```

Validar lint:

```bash
npm run lint
```

Compilar producción:

```bash
npm run build
```

Iniciar el build de producción:

```bash
npm start
```

## Variables de entorno

`.env.example` documenta actualmente:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- `OPENAI_API_KEY`;
- `SABINAPP_NEWS_AUTO_PUBLISH`;
- `SABINAPP_NEWS_CRON_SECRET`;
- `SABINAPP_NEWS_MAX_PUBLISHED_PER_RUN`;
- `SABINAPP_NEWS_MODEL`.

No subir secretos ni archivos `.env.local` al repositorio.

En Sabinapp 1.0 la publicación de noticias continúa siendo administrativa y manual aunque exista configuración preparada para automatización.

## Reglas técnicas esenciales

- priorizar estabilidad antes que arquitectura perfecta;
- separar datos, permisos, interfaces y estilos;
- no eliminar físicamente negocios desde el flujo administrativo normal;
- archivar, ocultar o despublicar cuando corresponda;
- la autorización del negocio la confirma administración;
- las fechas temporales sólo aplican cuando el tipo de negocio lo requiere;
- proteger operaciones sensibles también en servidor y PostgreSQL;
- no asumir rutas o estructuras sin comprobar el árbol real;
- ejecutar `npm run lint` y `npm run build` antes de cerrar una fase técnica.

## Documentación del proyecto

La documentación principal vive en `docs/`:

- `00-sabinapp-alcance-mvp-v1.md`: alcance de Sabinapp 1.0;
- `01-modelo-base-datos.md`: modelo e inventario de datos;
- `02-fases-desarrollo.md`: árbol maestro de avance y pendientes;
- `03-reglas-tecnicas.md`: reglas de desarrollo;
- `04-pruebas-manuales.md`: regresión manual;
- `05-auditoria-cambios-publicos.md`: auditoría de cambios;
- `SABINAPP-1.0-ESTADO-LOCAL.md`: estado local actual;
- `SABINAPP-1.0-LIMITES-OPERATIVOS.md`: límites y reglas operativas;
- `SABINAPP-ANUNCIOS-1.0.md`: publicidad local;
- `SABINAPP-NOTICIAS-AUTOMATICAS-1.0.md`: noticias asistidas por IA.

Para conocer qué está terminado y qué falta para lanzamiento, usar `docs/02-fases-desarrollo.md` como referencia principal.
