# AGENTS.md — Link Bush

App de una sola página (React 19 + Vite 8 + TS + Tailwind 4) para páginas de negocio: enlaces, carta/catálogo y video de fondo. Panel en `/admin`; páginas públicas en `/<slug>`. Todo el contenido vive en Supabase.

## Comandos y verificación

- `npm install` → `npm run dev` abre `http://localhost:5173/admin`. Sin `.env` la app entra en **modo demo**: guarda en `localStorage` (clave `paginas-demo-v1`) y trae 2 páginas de ejemplo.
- `npm run build` ya incluye el typecheck (`tsc -b && vite build`); no hay script `typecheck` separado.
- E2E: con el dev server corriendo, `npm run e2e -- http://localhost:5173/`. El script usa Playwright con **`channel: 'msedge'`** (necesita Edge instalado), borra el localStorage, corre en modo demo y escribe capturas en `screenshots/`. Su URL por defecto es `:5180`, por eso hay que pasar la URL.

## Rutas y deploy (contrario a la intuición)

- `src/App.tsx`: `/` redirige a `/admin`; `/admin/*` se carga lazy y gana sobre el comodín `/:slug/*`. Cualquier otra ruta es una página pública. `vite.config.ts` usa `base: '/'` porque las direcciones son reales.
- La app se publica en **Cloudflare Pages** (`linkbush.pages.dev`), build `npm run build`, output `dist`, con `NODE_VERSION=22`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- `.github/workflows/deploy.yml` **no publica la app**: solo deja en GitHub Pages un redirect de los enlaces viejos `emaymot.github.io/link-bush/…`. No esperes ver la app ahí.
- `keepalive.yml` consulta Supabase cada 3 días para que el plan free no pause el proyecto. No lo quites.
- `public/_routes.json` excluye al Pages Function de `/assets`, `/media`, `/admin`, `/favicon.svg` y `/_headers`; el resto pasa por `functions/[[path]].js`, que inyecta `og:*` para WhatsApp/Instagram usando `public/media/compartir/<slug>.jpg` (o el `-c.jpg` del panel).
- Caché (`public/_headers`): fotos 30 días, videos/avatares/compartir 1 día, `assets` inmutable, `index.html` sin caché. Un archivo nuevo con un nombre antes solicitado puede seguir sirviendo HTML viejo: usa nombres nuevos o `?v=2`.

## Supabase

- Proyecto **linkbush**: `jelcmizapxrlgvitrvfi`. El otro proyecto (`Pez y mar`, `icjjnxhacjvvpxzyfiti`) es distinto.
- `supabase/schema.sql` se puede reejecutar (`create if not exists` + policies `drop/create`); `supabase/admin.sql` es **una sola vez**, tras crear el usuario admin (y desactivar *Allow new users to sign up*).
- RLS: anon lee solo páginas publicadas/filas activas; escribir exige `is_admin()`. La llave publicable de la web **no puede insertar**; para escrituras usa el MCP de Supabase (`execute_sql`, service role).
- Modelo: `sites` (con `theme`/`vocab` jsonb) → `links`, `menus`, `menu_categories`, `menu_subcategories`, `menu_items`. La **carta principal** son categorías con `menu_id NULL`; las adicionales son filas en `menus` (`ruta`, `idioma es|en`), y un `links.menu_id` apunta a una carta concreta (null = principal).
- `slug`: solo `^[a-z0-9]+$`, 2–40, distinto de `admin`. `price` es entero en COP (0 = "Consultar precio"); `unit` ∈ `lb|unidad|kg|null`.
- **Inserta `theme` y `vocab` completos**: los defaults `{}` de la BD rompen el render. Cópialos de un `sites` existente o usa `src/lib/plantillas.ts` y `src/lib/vocab.ts`. Para tocar una parte, `jsonb_set(theme, '{fondo,video}', …)`.
- Storage: bucket público `media` (20 MB; webp/jpeg/png, mp4/webm). El panel guarda `<siteId>/<avatar|items|categories>/<uuid>-o.webp` junto a `-m.webp` (miniatura) y `-c.jpg` (compartir, solo avatar); videos en `<siteId>/video/<uuid>.mp4`.

## Medios: usa los scripts, no ffmpeg a mano

- `node scripts/medios-livianos.mjs` genera `-m.webp` y `-m.mp4` (540×960) para todo `public/media`; es idempotente. `src/lib/medios.ts` cae a la original si la miniatura falta.
- `node scripts/fotos-compartir.mjs fotos.json` regenera los JPG 600×600 de `public/media/compartir/` desde un array `[{slug, avatar_url}]`.
- Las páginas existentes referencian fotos como `https://linkbush.pages.dev/media/fotos/<slug>/<32hex>.webp`.

## Skills y proyecto de video (fuera del git)

- `.claude/` está en `.gitignore`: las skills `newpage` (crear páginas) y `autohero` (video de fondo) son locales y no se versionan. Úsalas para esos encargos; `newpage/references/datos.md` tiene esquema y enums exactos.
- `video/` es trabajo local sin seguimiento del usuario: proyecto Remotion con `FondoMarca.tsx`, `props/<slug>.json` y `node scripts/renderizar.mjs <slug>` desde esa carpeta. No lo añadas al git salvo que pidan expresamente.
- El panel recuerda el tema en `localStorage['panel-modo']`; `src/lib/version.ts` recarga una vez por minuto si una chunk vieja desaparece tras un deploy (clave `link-bush-recarga-por-version`).
