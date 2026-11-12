# Link Bush

Una sola app para crear páginas de negocios: enlaces tipo Linktree, carta o catálogo con precios, y video de fondo. Todo se maneja desde **un único panel**: ahí creas cada página y editas su contenido y su diseño.

- Página pública: `…/#/<dirección>`, por ejemplo `#/pez-y-mar`. La carta o catálogo queda en `#/pez-y-mar/catalogo`.
- Panel: `…/#/admin`.

## Qué se puede hacer en el panel

- **Mis páginas**
  - Crear una página: nombre, dirección, tipo de negocio y plantilla.
  - Abrir, copiar el enlace, descargar el QR, duplicar o eliminar.
- **Botones**: los enlaces del inicio (WhatsApp, Instagram, mapa…), con íconos, orden y ocultar/mostrar.
- **Carta / Catálogo**
  - Categorías con foto o emoji, subcategorías (secciones) y productos.
  - Cada producto lleva precio, unidad (lb / unidad / kg), foto, agotado y oculto.
  - **Varias cartas** por página (por ejemplo, la carta en inglés o una de bebidas). Cada una tiene su dirección (`#/pez-y-mar/english-menu`), idioma de los textos fijos (español o inglés), título y frase. En la página aparece un selector para cambiar de carta, y cada botón de tipo carta elige cuál abre. Al importar un JSON se elige a qué carta va.
- **Perfil**: foto o logo, nombre, descripción, y título y descripción para buscadores.
- **Diseño**, con vista previa en vivo:
  - 10 plantillas listas para usar.
  - Los 8 colores de la página, con aviso de contraste.
  - Letras para títulos, textos y precios (34 Google Fonts) y su grosor.
  - Video de fondo: se sube y crea su póster solo, o se pega un enlace.
  - 11 efectos de fondo animados: mar, luces, estrellas, aurora, brasas, bokeh, confeti, ondas, cuadrícula retro, degradado o ninguno.
  - Tinte y velos del video.
  - Botones del inicio:
    - 8 estilos: vidrio, sólido, borde, degradado, neón, suave, minimal, relieve.
    - 5 formas, 5 sombras y 3 tamaños.
    - Difuminado interior ajustable.
  - Foto de perfil: 9 aros (incluido «sin aro»), en círculo o cuadrada redondeada.
- Los botones tienen más de 70 íconos en grupos. El botón de la carta usa cubiertos y el del catálogo, un libro.
- **Ajustes**:
  - Dirección y publicar / borrador.
  - Palabras de la página: «carta» o «catálogo», «plato» o «producto», unidades de venta.
  - Importar un catálogo desde JSON, duplicar o eliminar.
- **Modo oscuro del panel**: claro, oscuro o automático. Se recuerda en el navegador.

Las páginas en **borrador** solo las ve quien tiene la sesión del panel. Para los demás, la dirección muestra «Página no encontrada».

## Probar en tu computador

```bash
npm install
npm run dev
```

Abre `http://localhost:5173/#/admin` y entra en **modo demo**: sin Supabase, los cambios se guardan solo en ese navegador. Trae dos páginas de ejemplo, `#/mar-adentro` y `#/brasa-y-barra`.

Prueba completa del panel (con el servidor corriendo): `npm run e2e -- http://localhost:5173/`.

## Publicar (una sola vez)

1. **Supabase**
   1. Crea un proyecto nuevo en supabase.com.
   2. En **SQL Editor**, ejecuta `supabase/schema.sql`.
   3. En **Authentication > Users > Add user**, crea tu usuario (correo y contraseña, con *Auto Confirm*).
   4. Ejecuta `supabase/admin.sql` con tu correo.
   5. En **Authentication > Sign In / Providers**, desactiva *Allow new users to sign up*.
2. **Llaves**: en **Project Settings > API Keys**, copia la URL del proyecto y la llave **publicable** (`sb_publishable_…`). La llave secreta nunca va en la web.
3. **GitHub**
   1. Crea el repositorio.
   2. En *Settings > Secrets and variables > Actions*, agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la publicable).
   3. En *Settings > Pages*, en *Source*, elige **GitHub Actions**.
4. Haz `git push` a `main`: el workflow `deploy.yml` publica la web en unos 30–60 s.

El workflow `keepalive.yml` consulta la base cada 3 días, para que el plan gratis de Supabase no pause el proyecto.

### En Cloudflare Pages (gratis)

Cloudflare publica el mismo repositorio con cada `git push`, igual que GitHub Pages. Además respeta `public/_headers`, que deja guardados en el celular las fotos (30 días), los videos (1 día) y el código, en vez de solo 10 minutos.

1. En dash.cloudflare.com, entra a **Workers & Pages → Create** y elige la pestaña **Pages**. No uses la opción de Workers, que pide un "Deploy command". Luego **Connect to Git** y elige este repositorio.
2. Configuración de compilación:
   - Framework preset: *None*.
   - Build command: `npm run build`.
   - Build output directory: `dist`.
3. Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (la publicable) y `NODE_VERSION` = `22`.

Queda en `https://<proyecto>.pages.dev`. El plan gratis permite tráfico ilimitado, 500 publicaciones al mes y hasta 20.000 archivos de máximo 25 MB cada uno.

## Límites a tener en cuenta

- **Videos**: el plan gratis de Supabase trae unos 5 GB de descarga al mes, sumando todas las páginas. Un video de 6 MB alcanza para unas 800 visitas.
  - Usa videos de 720p y de 2 a 4 MB. El panel avisa por encima de 8 MB y no acepta más de 20 MB.
  - También puedes pegar el enlace de un video alojado en otro lugar.
- **Vista previa al compartir**: WhatsApp muestra el título general de la app, no el de cada página, porque las direcciones van después del `#`. Se resuelve más adelante con un dominio propio (por ejemplo, en Cloudflare Pages).

## Estructura

- `src/lib/store.ts`: acceso a datos (Supabase o demo). Todo el contenido lleva `site_id`.
- `src/lib/tema.ts`: aplica el diseño de una página como variables CSS.
- `src/lib/plantillas.ts`, `src/lib/fuentes.ts`, `src/lib/vocab.ts`: plantillas, fuentes y vocabulario por tipo de negocio.
- `src/lib/paginas.ts`: crear, duplicar e importar catálogos.
- `src/pages/SiteLayout.tsx`: la página pública (`#/<dirección>/…`).
- `src/pages/admin/`: el panel.
- `supabase/schema.sql`: tablas, permisos (RLS) y almacenamiento.
- `scripts/ejemplo-carta.json`: ejemplo del formato para importar.
