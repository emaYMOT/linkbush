/**
 * Vista previa al compartir (WhatsApp, Instagram, Facebook, X…).
 *
 * Esos servicios no ejecutan la app: leen el index.html tal cual llega. Esta función de Cloudflare Pages
 * recibe /<dirección>/…, busca la página en Supabase y escribe en el HTML su nombre, su descripción y su foto
 * (etiquetas og:*). La app funciona igual que siempre: solo cambian esas etiquetas.
 *
 * Usa las mismas variables que la compilación (VITE_SUPABASE_URL y la llave publicable), así que solo ve
 * páginas publicadas. Si algo falla, entrega el index.html normal.
 * Qué direcciones pasan por aquí: public/_routes.json (fotos, videos, código y el panel no).
 */
export async function onRequestGet(context) {
  const { request, env, next } = context
  const respuesta = await next()
  const tipo = respuesta.headers.get('content-type') || ''
  if (!tipo.includes('text/html')) return respuesta

  const url = new URL(request.url)
  const primera = decodeURIComponent(url.pathname.split('/')[1] || '')
  const slug = primera.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!slug || slug === 'admin') return respuesta

  let site = null
  try {
    site = await buscarPagina(env, slug)
  } catch (e) {
    console.warn('Vista previa: no se pudo leer la página', slug, e)
  }
  if (!site) return respuesta

  const titulo = site.seo_title || site.name
  const descripcion = (site.seo_description || site.description || '').replace(/\s+/g, ' ').trim().slice(0, 200)
  // Primero el JPG para compartir (scripts/fotos-compartir.mjs); si no hay, la foto de perfil tal cual.
  const jpg = new URL(`/media/compartir/${site.slug}.jpg`, url.origin)
  const hayJpg = await env.ASSETS.fetch(jpg, { method: 'HEAD' })
    .then((r) => r.ok && (r.headers.get('content-type') || '').startsWith('image/'))
    .catch(() => false)
  const imagen = hayJpg ? jpg.href : site.avatar_url ? new URL(site.avatar_url, url.origin).href : ''
  const canonica = `${url.origin}/${site.slug}`

  const etiquetas = [
    ['og:type', 'website'],
    ['og:site_name', site.name],
    ['og:title', titulo],
    ['og:description', descripcion],
    ['og:url', canonica],
    ...(imagen ? [['og:image', imagen], ['og:image:alt', site.name]] : []),
  ]
    .map(([p, c]) => `<meta property="${p}" content="${escapar(c)}" />`)
    .join('')
  const twitter = `<meta name="twitter:card" content="summary" />` +
    `<meta name="twitter:title" content="${escapar(titulo)}" />` +
    `<meta name="twitter:description" content="${escapar(descripcion)}" />` +
    (imagen ? `<meta name="twitter:image" content="${escapar(imagen)}" />` : '')

  return new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(titulo) })
    .on('meta[name="description"]', { element: (el) => el.setAttribute('content', descripcion) })
    .on('head', { element: (el) => el.append(etiquetas + twitter + `<link rel="canonical" href="${escapar(canonica)}" />`, { html: true }) })
    .transform(respuesta)
}

async function buscarPagina(env, slug) {
  const base = env.VITE_SUPABASE_URL
  const llave = env.VITE_SUPABASE_ANON_KEY
  if (!base || !llave) {
    console.warn('Vista previa: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en Cloudflare')
    return null
  }
  const campos = 'slug,name,description,seo_title,seo_description,avatar_url'
  const r = await fetch(`${base}/rest/v1/sites?select=${campos}&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`, {
    headers: { apikey: llave, Authorization: `Bearer ${llave}` },
    // Cloudflare guarda la respuesta 5 minutos: un cambio en el panel se ve en la vista previa poco después.
    cf: { cacheTtl: 300, cacheEverything: true },
  })
  if (!r.ok) throw new Error(`Supabase ${r.status}`)
  const filas = await r.json()
  return filas[0] || null
}

function escapar(texto) {
  return String(texto).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
