import { store, type Collection, type RowOf } from './store'
import { iconoSeccion } from './icons'
import { temaDePlantilla } from './plantillas'
import type { Category, LinkButton, MenuItem, PriceUnit, Site, Subcategory } from './types'
import { slugify, VOCAB_PRESETS } from './vocab'

/** Direcciones que no puede usar una página porque las usa la app. */
export const SLUGS_RESERVADOS = ['admin']

export function slugError(slug: string, sites: Site[], except?: string): string {
  if (!slug) return 'Escribe la dirección.'
  if (slug.length < 2) return 'Usa al menos 2 letras.'
  if (!/^[a-z0-9]+$/.test(slug)) return 'Solo minúsculas y números (sin guiones, tildes ni espacios).'
  if (SLUGS_RESERVADOS.includes(slug)) return 'Esa dirección la usa el panel. Elige otra.'
  if (sites.some((s) => s.slug === slug && s.id !== except)) return 'Ya hay una página con esa dirección.'
  return ''
}

/** Una dirección libre a partir del nombre: "Pez y Mar" -> "pezymar" (o "pezymar2"). */
export function slugLibre(name: string, sites: Site[]): string {
  const base = slugify(name) || 'pagina'
  let slug = base
  for (let i = 2; slugError(slug, sites); i++) slug = `${base}${i}`
  return slug
}

/** Dirección pública completa de una página (la que va en el QR). */
export function urlPublica(slug: string): string {
  return `${location.origin}/${slug}`
}

/**
 * Página nueva en borrador con los cinco botones de siempre (los de Mia Rooftop): la carta o el catálogo,
 * reseña, reserva, cómo llegar e Instagram. Los enlaces son de ejemplo: hay que completarlos antes de publicar.
 */
export async function crearPagina({ name, slug, tipo, plantilla, paleta }: { name: string; slug: string; tipo: Site['vocab']['tipo']; plantilla: string; paleta?: string }) {
  const vocab = structuredClone(VOCAB_PRESETS[tipo])
  const site = await store.createSite({
    slug, name, description: '', avatar_url: null, published: false,
    theme: temaDePlantilla(plantilla, undefined, paleta), vocab, seo_title: null, seo_description: null,
  })
  const botones: Pick<LinkButton, 'label' | 'type' | 'url' | 'icon'>[] = [
    { label: tipo === 'tienda' ? 'Nuestro Catálogo' : 'Nuestra Carta', type: 'menu', url: null, icon: iconoSeccion(tipo) },
    { label: 'Déjanos una reseña!', type: 'url', url: 'https://search.google.com/local/writereview?placeid=', icon: 'star' },
    { label: 'Haz tu reserva', type: 'url', url: 'https://wa.me/57', icon: 'chat' },
    { label: 'Cómo llegar', type: 'url', url: 'https://maps.google.com/', icon: 'map' },
    { label: 'Síguenos en Instagram', type: 'url', url: 'https://www.instagram.com/', icon: 'instagram' },
  ]
  const starter: LinkButton[] = botones.map((b, position) => ({ ...b, id: crypto.randomUUID(), site_id: site.id, position, is_active: true }))
  await store.insertMany('links', starter)
  return site
}

/** Copia una página con todo su contenido. La copia queda en borrador. */
export async function duplicarPagina(source: Site, name: string, slug: string) {
  const { id: _id, created_at: _c, updated_at: _u, ...fields } = source
  const site = await store.createSite({ ...structuredClone(fields), name, slug, published: false })
  const ids = new Map<string, string>()
  const nuevo = (old: string) => {
    const id = crypto.randomUUID()
    ids.set(old, id)
    return id
  }
  const copy = async <C extends Collection>(c: C, map: (row: RowOf<C>) => RowOf<C>) => {
    const rows = await store.list(c, source.id)
    await store.insertMany(c, rows.map((r) => ({ ...map(r), site_id: site.id })))
  }
  // Primero las cartas adicionales: categorías y botones apuntan a ellas por id.
  await copy('menus', (r) => ({ ...r, id: nuevo(r.id) }))
  const carta = (old: string | null | undefined) => (old ? (ids.get(old) ?? null) : null)
  await copy('links', (r) => ({ ...r, id: crypto.randomUUID(), ...(r.menu_id ? { menu_id: carta(r.menu_id) } : {}) }))
  await copy('menu_categories', (r) => ({ ...r, id: nuevo(r.id), ...(r.menu_id ? { menu_id: carta(r.menu_id) } : {}) }))
  await copy('menu_subcategories', (r) => ({ ...r, id: nuevo(r.id), category_id: ids.get(r.category_id)! }))
  await copy('menu_items', (r) => ({
    ...r,
    id: crypto.randomUUID(),
    category_id: ids.get(r.category_id)!,
    subcategory_id: r.subcategory_id ? (ids.get(r.subcategory_id) ?? null) : null,
  }))
  return site
}

// ---------------------------------------------------------------- Importar catálogo (JSON)

/**
 * Acepta los dos formatos que ya usamos:
 * - Pez y Mar (catalogo.json): productos como objetos { nombre, precio, unidad, foto, descripcion, disponible }.
 * - Al Aire (carta-real.json): platos como [nombre, precio, descripción] y subcategorias: [{ nombre, platos }].
 */
interface ProductoJson { nombre: string; precio?: number; unidad?: PriceUnit | null; foto?: string | null; descripcion?: string | null; disponible?: boolean }
type PlatoJson = ProductoJson | [string, number?, (string | null)?]
interface GrupoJson { nombre: string; platos?: PlatoJson[]; productos?: PlatoJson[] }
interface CategoriaJson extends GrupoJson { emoji?: string | null; descripcion?: string | null; portada?: string | null; subcategorias?: GrupoJson[] }

export interface CatalogoImportado {
  categorias: { nombre: string; emoji: string | null; descripcion: string | null; portada: string | null; grupos: { nombre: string | null; productos: ProductoJson[] }[] }[]
}

const UNIDADES: PriceUnit[] = ['lb', 'unidad', 'kg']
// Las fotos con ruta relativa eran de la otra web: aquí no existen, así que se omiten.
const soloUrl = (v: string | null | undefined) => (v && /^https?:\/\//.test(v) ? v : null)

function producto(p: PlatoJson): ProductoJson {
  if (Array.isArray(p)) return { nombre: String(p[0] ?? '').trim(), precio: Number(p[1]) || 0, descripcion: p[2] ?? null }
  return { ...p, nombre: String(p.nombre ?? '').trim(), precio: Number(p.precio) || 0 }
}

export function leerCatalogo(texto: string): CatalogoImportado {
  let json: { categorias?: CategoriaJson[] }
  try {
    json = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (!Array.isArray(json.categorias)) throw new Error('No encontré la lista "categorias" en el archivo.')
  const categorias = json.categorias.map((c) => {
    if (!c?.nombre) throw new Error('Hay una categoría sin "nombre".')
    const sueltos = [...(c.platos ?? []), ...(c.productos ?? [])].map(producto)
    const grupos = [
      { nombre: null, productos: sueltos },
      ...(c.subcategorias ?? []).map((s) => ({ nombre: String(s.nombre).trim(), productos: [...(s.platos ?? []), ...(s.productos ?? [])].map(producto) })),
    ].filter((g) => g.productos.length > 0 || g.nombre)
    return { nombre: String(c.nombre).trim().slice(0, 40), emoji: c.emoji ?? null, descripcion: c.descripcion ?? null, portada: soloUrl(c.portada), grupos }
  })
  if (categorias.some((c) => c.grupos.some((g) => g.productos.some((p) => !p.nombre)))) throw new Error('Hay un producto sin nombre.')
  return { categorias }
}

export function contarProductos(cat: CatalogoImportado) {
  return cat.categorias.reduce((n, c) => n + c.grupos.reduce((m, g) => m + g.productos.length, 0), 0)
}

/**
 * Agrega el catálogo a una carta de la página (null = la principal), o lo reemplaza: borra antes las categorías
 * de esa carta (las de las otras cartas no se tocan).
 */
export async function importarCatalogo(siteId: string, cat: CatalogoImportado, reemplazar: boolean, menuId: string | null = null) {
  const existentes = (await store.list('menu_categories', siteId)).filter((c) => (c.menu_id ?? null) === menuId)
  if (reemplazar) for (const c of existentes) await store.remove('menu_categories', c.id)
  let posCat = reemplazar ? 0 : existentes.reduce((m, c) => Math.max(m, c.position + 1), 0)

  const categories: Category[] = []
  const subcategories: Subcategory[] = []
  const items: MenuItem[] = []
  for (const c of cat.categorias) {
    const categoryId = crypto.randomUUID()
    categories.push({
      id: categoryId, site_id: siteId, name: c.nombre, emoji: c.emoji, description: c.descripcion, image_url: c.portada, position: posCat++, is_active: true,
      // Solo se envía si hay carta: así importar a la principal sigue funcionando en bases sin la columna.
      ...(menuId ? { menu_id: menuId } : {}),
    })
    let posItem = 0
    c.grupos.forEach((g, gi) => {
      const subId = g.nombre ? crypto.randomUUID() : null
      if (subId) subcategories.push({ id: subId, site_id: siteId, category_id: categoryId, name: g.nombre!.slice(0, 40), position: gi })
      for (const p of g.productos) {
        items.push({
          id: crypto.randomUUID(), site_id: siteId, category_id: categoryId, subcategory_id: subId,
          name: p.nombre.slice(0, 70), description: p.descripcion?.trim() || null, price: Math.max(0, Math.round(p.precio ?? 0)),
          unit: p.unidad && UNIDADES.includes(p.unidad) ? p.unidad : null, image_url: soloUrl(p.foto),
          position: posItem++, is_available: p.disponible ?? true, is_active: true,
        })
      }
    })
  }
  await store.insertMany('menu_categories', categories)
  await store.insertMany('menu_subcategories', subcategories)
  await store.insertMany('menu_items', items)
}
