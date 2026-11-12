import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { bySort } from './format'
import { demoSeed } from './seed'
import { completarTema } from './tema'
import type { Carta, Category, Draft, LinkButton, MenuItem, Site, Subcategory } from './types'

export type Collection = 'links' | 'menus' | 'menu_categories' | 'menu_subcategories' | 'menu_items'
export type RowOf<C extends Collection> = C extends 'links'
  ? LinkButton
  : C extends 'menus'
    ? Carta
    : C extends 'menu_categories'
      ? Category
      : C extends 'menu_subcategories'
        ? Subcategory
        : MenuItem

export type ImageFolder = 'avatar' | 'items' | 'categories'
export type NewSite = Omit<Site, 'id' | 'created_at' | 'updated_at'>

const MAX_SIDE: Record<ImageFolder, [number, number]> = {
  // [Supabase, modo demo]: el demo guarda en el navegador, así que va más liviano.
  avatar: [600, 400],
  items: [1200, 800],
  categories: [1600, 1000],
}

/** Máximo que acepta el almacenamiento (igual que en schema.sql). */
export const VIDEO_MAX_MB = 20

export interface StoredFile {
  path: string // "<id-de-la-página>/video/<código>.mp4"
  size: number
  created_at: string
}

export interface PublicSite {
  site: Site
  links: LinkButton[]
  menus: Carta[]
}

export interface AdminSession {
  email: string
}

/**
 * Todo el acceso a datos pasa por aquí. Hay dos implementaciones:
 * - Supabase (producción), cuando existen VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
 * - Demo, que guarda en localStorage para probar la web sin base de datos.
 * Cada fila de contenido pertenece a una página (site_id).
 */
export interface DataStore {
  mode: 'supabase' | 'demo'
  listSites(): Promise<Site[]>
  getSite(id: string): Promise<Site | null>
  getSiteBySlug(slug: string): Promise<Site | null>
  /** Lo que necesita la vista pública para empezar (página, botones y cartas), en una sola consulta. */
  getPublicSite(slug: string): Promise<PublicSite | null>
  createSite(site: NewSite): Promise<Site>
  updateSite(id: string, patch: Partial<NewSite>): Promise<Site>
  removeSite(id: string): Promise<void>
  list<C extends Collection>(collection: C, siteId: string): Promise<RowOf<C>[]>
  save<C extends Collection>(collection: C, siteId: string, row: Draft<RowOf<C>>): Promise<RowOf<C>>
  /** Inserta filas completas (con id y posición). Lo usan duplicar e importar. */
  insertMany<C extends Collection>(collection: C, rows: RowOf<C>[]): Promise<void>
  remove(collection: Collection, id: string): Promise<void>
  reorder(collection: Collection, orderedIds: string[]): Promise<void>
  uploadImage(file: File, siteId: string, folder: ImageFolder): Promise<string>
  uploadVideo(file: File, siteId: string): Promise<string>
  /** Archivos guardados de una página (en demo no hay: las fotos viven dentro de la página). */
  listFiles(siteId: string): Promise<StoredFile[]>
  removeFiles(paths: string[]): Promise<void>
  getSession(): Promise<AdminSession | null>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
}

// La librería de compresión solo se descarga al subir la primera foto (la página pública nunca la necesita).
const compresor = () => import('browser-image-compression').then((m) => m.default)

async function compress(file: File, maxSide: number, maxSizeMB = 0.35): Promise<File> {
  const imageCompression = await compresor()
  return imageCompression(file, { maxSizeMB, maxWidthOrHeight: maxSide, fileType: 'image/webp', useWebWorker: true })
}

/** Miniatura: el lado corto queda en 360 px (nunca más grande que la foto), igual que scripts/medios-livianos.mjs. */
async function compressMiniatura(file: File): Promise<File> {
  const bmp = await createImageBitmap(file)
  const largo = Math.max(bmp.width, bmp.height)
  const corto = Math.min(bmp.width, bmp.height)
  bmp.close()
  return compress(file, Math.min(largo, Math.round((360 * largo) / corto)), 0.06)
}

const now = () => new Date().toISOString()

/** Toda página leída sale con su diseño completo (las guardadas antes no traen las opciones nuevas). */
const completa = <T extends Site | null>(site: T): T => (site ? { ...site, theme: completarTema(site.theme) } : site)

// ---------------------------------------------------------------- Supabase

function supabaseStore(client: SupabaseClient): DataStore {
  const fail = (error: { message: string } | null) => {
    if (error) throw new Error(translateError(error.message))
  }

  async function upload(path: string, file: File, contentType: string) {
    const { error } = await client.storage.from('media').upload(path, file, { contentType, cacheControl: '31536000' })
    fail(error)
    return client.storage.from('media').getPublicUrl(path).data.publicUrl
  }

  return {
    mode: 'supabase',

    async listSites() {
      const { data, error } = await client.from('sites').select('*').order('created_at')
      fail(error)
      return ((data ?? []) as Site[]).map(completa)
    },

    async getSite(id) {
      const { data, error } = await client.from('sites').select('*').eq('id', id).maybeSingle()
      fail(error)
      return completa(data as Site | null)
    },

    async getSiteBySlug(slug) {
      const { data, error } = await client.from('sites').select('*').eq('slug', slug).maybeSingle()
      fail(error)
      return completa(data as Site | null)
    },

    async getPublicSite(slug) {
      // Botones y cartas vienen dentro de la página (se nombra la relación porque links también apunta a menus).
      const { data, error } = await client
        .from('sites')
        .select('*, links!links_site_id_fkey(*), menus!menus_site_id_fkey(*)')
        .eq('slug', slug)
        .maybeSingle()
      fail(error)
      if (!data) return null
      const { links, menus, ...site } = data as Site & { links: LinkButton[]; menus: Carta[] }
      return { site: completa(site as Site), links, menus }
    },

    async createSite(site) {
      const { data, error } = await client.from('sites').insert(site).select().single()
      fail(error)
      return completa(data as Site)
    },

    async updateSite(id, patch) {
      const { data, error } = await client.from('sites').update({ ...patch, updated_at: now() }).eq('id', id).select().single()
      fail(error)
      return completa(data as Site)
    },

    async removeSite(id) {
      const { error } = await client.from('sites').delete().eq('id', id)
      fail(error)
    },

    async list(collection, siteId) {
      const { data, error } = await client.from(collection).select('*').eq('site_id', siteId).order('position')
      fail(error)
      return (data ?? []) as never
    },

    async save(collection, siteId, row) {
      const { id, ...fields } = row as Draft<RowOf<Collection>>
      if (id) {
        const { data, error } = await client.from(collection).update(fields).eq('id', id).select().single()
        fail(error)
        return data as never
      }
      const { data: last } = await client.from(collection).select('position').eq('site_id', siteId).order('position', { ascending: false }).limit(1)
      const position = (last?.[0]?.position ?? -1) + 1
      const { data, error } = await client.from(collection).insert({ ...fields, site_id: siteId, position }).select().single()
      fail(error)
      return data as never
    },

    async insertMany(collection, rows) {
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await client.from(collection).insert(rows.slice(i, i + 500))
        fail(error)
      }
    },

    async remove(collection, id) {
      const { error } = await client.from(collection).delete().eq('id', id)
      fail(error)
    },

    async reorder(collection, orderedIds) {
      const results = await Promise.all(orderedIds.map((id, position) => client.from(collection).update({ position }).eq('id', id)))
      fail(results.find((r) => r.error)?.error ?? null)
    },

    async uploadImage(file, siteId, folder) {
      const small = await compress(file, MAX_SIDE[folder][0])
      // Junto a la foto va su miniatura ("-m"), la que usan la carta y el panel en los cuadritos (ver lib/medios.ts).
      // El "-o" del nombre avisa que la tiene. Si la miniatura falla, la foto sigue sirviendo sola.
      const id = crypto.randomUUID()
      const url = await upload(`${siteId}/${folder}/${id}-o.webp`, small, 'image/webp')
      try {
        await upload(`${siteId}/${folder}/${id}-m.webp`, await compressMiniatura(small), 'image/webp')
      } catch (e) {
        console.warn('No se pudo guardar la miniatura:', e)
      }
      return url
    },

    async uploadVideo(file, siteId) {
      const ext = file.type === 'video/webm' ? 'webm' : 'mp4'
      return upload(`${siteId}/video/${crypto.randomUUID()}.${ext}`, file, file.type || 'video/mp4')
    },

    async listFiles(siteId) {
      const bucket = client.storage.from('media')
      const out: StoredFile[] = []
      // 'poster' ya no se usa: se sigue listando para que la limpieza borre los que quedaron.
      for (const folder of ['avatar', 'items', 'categories', 'poster', 'video']) {
        const { data, error } = await bucket.list(`${siteId}/${folder}`, { limit: 1000 })
        fail(error)
        // Las carpetas vienen sin id; solo interesan los archivos.
        for (const f of data ?? []) if (f.id) out.push({ path: `${siteId}/${folder}/${f.name}`, size: Number(f.metadata?.size ?? 0), created_at: f.created_at ?? '' })
      }
      return out
    },

    async removeFiles(paths) {
      for (let i = 0; i < paths.length; i += 100) {
        const { error } = await client.storage.from('media').remove(paths.slice(i, i + 100))
        fail(error)
      }
    },

    async getSession() {
      const { data } = await client.auth.getSession()
      const user = data.session?.user
      if (!user) return null
      const { data: admin } = await client.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
      if (!admin) {
        await client.auth.signOut()
        return null
      }
      return { email: user.email ?? '' }
    },

    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      fail(error)
      const { data: admin } = await client.from('admins').select('user_id').eq('user_id', data.user?.id ?? '').maybeSingle()
      if (!admin) {
        await client.auth.signOut()
        throw new Error('Esta cuenta no tiene permiso de administrador. Agrégala a la tabla admins en Supabase.')
      }
    },

    async signOut() {
      await client.auth.signOut()
    },
  }
}

function translateError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.'
  if (/row-level security|permission denied/i.test(message)) return 'No tienes permiso para hacer este cambio. Vuelve a iniciar sesión.'
  if (/check constraint/i.test(message)) return 'Ese dato no es válido. Revisa la dirección: solo minúsculas, números y guiones.'
  if (/duplicate key/i.test(message)) return 'Ya hay una página con esa dirección. Elige otra.'
  if (/exceeded the maximum allowed size|payload too large/i.test(message)) return `El archivo pesa demasiado. El máximo es ${VIDEO_MAX_MB} MB.`
  if (/mime type/i.test(message)) return 'Ese tipo de archivo no se puede subir. Usa MP4 o WEBM para video, y JPG, PNG o WEBP para fotos.'
  if (/failed to fetch|network/i.test(message)) return 'No hay conexión con la base de datos. Revisa tu internet e inténtalo de nuevo.'
  return message
}

// ---------------------------------------------------------------- Demo (localStorage)

const DEMO_KEY = 'paginas-demo-v1'

interface DemoData {
  sites: Site[]
  links: LinkButton[]
  menus: Carta[]
  menu_categories: Category[]
  menu_subcategories: Subcategory[]
  menu_items: MenuItem[]
  session: AdminSession | null
}

function demoStore(): DataStore {
  const fresh = (): DemoData => ({ ...structuredClone(demoSeed), session: null })

  const read = (): DemoData => {
    try {
      const raw = localStorage.getItem(DEMO_KEY)
      return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh()
    } catch {
      return fresh()
    }
  }

  const write = (data: DemoData) => {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(data))
    } catch {
      throw new Error('El navegador no tiene espacio para guardar más en modo demo. Usa fotos más livianas o conecta Supabase.')
    }
  }

  const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 120))
  const rowsOf = (data: DemoData, c: Collection) => data[c] as RowOf<Collection>[]
  const slugTaken = (data: DemoData, slug: string, except?: string) => data.sites.some((s) => s.slug === slug && s.id !== except)
  const duplicated = () => new Error('Ya hay una página con esa dirección. Elige otra.')

  return {
    mode: 'demo',

    listSites: async () => delay([...read().sites].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(completa)),
    getSite: async (id) => delay(completa(read().sites.find((s) => s.id === id) ?? null)),
    async getSiteBySlug(slug) {
      // Igual que la base de datos: un borrador solo lo ve quien tiene la sesión del panel.
      const data = read()
      const site = data.sites.find((s) => s.slug === slug)
      return delay(completa(site && (site.published || data.session) ? site : null))
    },
    async getPublicSite(slug) {
      const data = read()
      const site = data.sites.find((s) => s.slug === slug)
      if (!site || !(site.published || data.session)) return delay(null)
      return delay({ site: completa(site), links: data.links.filter((l) => l.site_id === site.id), menus: data.menus.filter((c) => c.site_id === site.id) })
    },

    async createSite(site) {
      const data = read()
      if (slugTaken(data, site.slug)) throw duplicated()
      const created: Site = { ...site, id: crypto.randomUUID(), created_at: now(), updated_at: now() }
      data.sites.push(created)
      write(data)
      return delay(completa(created))
    },

    async updateSite(id, patch) {
      const data = read()
      if (patch.slug && slugTaken(data, patch.slug, id)) throw duplicated()
      const index = data.sites.findIndex((s) => s.id === id)
      data.sites[index] = { ...data.sites[index], ...patch, updated_at: now() }
      write(data)
      return delay(completa(data.sites[index]))
    },

    async removeSite(id) {
      const data = read()
      data.sites = data.sites.filter((s) => s.id !== id)
      for (const c of ['links', 'menus', 'menu_categories', 'menu_subcategories', 'menu_items'] as const) {
        ;(data[c] as RowOf<Collection>[]) = rowsOf(data, c).filter((r) => r.site_id !== id)
      }
      write(data)
      await delay(null)
    },

    async list(collection, siteId) {
      return delay(rowsOf(read(), collection).filter((r) => r.site_id === siteId).sort(bySort) as never)
    },

    async save(collection, siteId, row) {
      const data = read()
      const rows = rowsOf(data, collection)
      let saved: RowOf<Collection>
      if (row.id) {
        const index = rows.findIndex((r) => r.id === row.id)
        saved = { ...rows[index], ...row } as RowOf<Collection>
        rows[index] = saved
      } else {
        const position = rows.filter((r) => r.site_id === siteId).reduce((max, r) => Math.max(max, r.position), -1) + 1
        saved = { ...row, id: crypto.randomUUID(), site_id: siteId, position } as unknown as RowOf<Collection>
        rows.push(saved)
      }
      write(data)
      return delay(saved as never)
    },

    async insertMany(collection, newRows) {
      const data = read()
      rowsOf(data, collection).push(...(newRows as RowOf<Collection>[]))
      write(data)
      await delay(null)
    },

    async remove(collection, id) {
      const data = read()
      ;(data[collection] as RowOf<Collection>[]) = rowsOf(data, collection).filter((r) => r.id !== id)
      // Igual que en la base de datos: borrar una carta borra sus categorías, y sus botones vuelven a la principal.
      if (collection === 'menus') {
        const categorias = new Set(data.menu_categories.filter((c) => c.menu_id === id).map((c) => c.id))
        data.menu_categories = data.menu_categories.filter((c) => !categorias.has(c.id))
        data.menu_items = data.menu_items.filter((i) => !categorias.has(i.category_id))
        data.menu_subcategories = data.menu_subcategories.filter((s) => !categorias.has(s.category_id))
        for (const link of data.links) if (link.menu_id === id) link.menu_id = null
      }
      if (collection === 'menu_categories') {
        data.menu_items = data.menu_items.filter((i) => i.category_id !== id)
        data.menu_subcategories = data.menu_subcategories.filter((s) => s.category_id !== id)
      }
      // Igual que en la base de datos: borrar una subcategoría deja sus productos sin subcategoría.
      if (collection === 'menu_subcategories') {
        for (const item of data.menu_items) if (item.subcategory_id === id) item.subcategory_id = null
      }
      write(data)
      await delay(null)
    },

    async reorder(collection, orderedIds) {
      const data = read()
      for (const row of rowsOf(data, collection)) {
        const index = orderedIds.indexOf(row.id)
        if (index >= 0) row.position = index
      }
      write(data)
      await delay(null)
    },

    async uploadImage(file, _siteId, folder) {
      const small = await compress(file, MAX_SIDE[folder][1])
      return (await compresor()).getDataUrlFromFile(small)
    },

    async uploadVideo() {
      throw new Error('En modo demo el video no cabe en el navegador. Pega el enlace de un video o conecta Supabase.')
    },

    listFiles: async () => [],
    removeFiles: async () => {},

    getSession: async () => delay(read().session),

    async signIn(email) {
      const data = read()
      data.session = { email: email || 'demo' }
      write(data)
    },

    async signOut() {
      const data = read()
      data.session = null
      write(data)
    },
  }
}

// ----------------------------------------------------------------

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const store: DataStore = url && anonKey ? supabaseStore(createClient(url, anonKey)) : demoStore()

/**
 * Para la vista pública: solo lo visible, en orden. Cada categoría trae sus productos en secciones:
 * primero los que no tienen subcategoría (sin título) y luego una sección por subcategoría.
 */
export async function loadPublicMenu(siteId: string, menuId: string | null = null) {
  const [categories, subcategories, items] = await Promise.all([
    store.list('menu_categories', siteId),
    store.list('menu_subcategories', siteId),
    store.list('menu_items', siteId),
  ])
  const visibleItems = items.filter((i) => i.is_active).sort(bySort)
  return {
    categories: categories
      .filter((c) => c.is_active && (c.menu_id ?? null) === menuId)
      .sort(bySort)
      .map((category) => {
        const own = visibleItems.filter((i) => i.category_id === category.id)
        const subs = subcategories.filter((s) => s.category_id === category.id).sort(bySort)
        const known = new Set(subs.map((s) => s.id))
        const sections: MenuSection[] = [
          { id: null, name: null, items: own.filter((i) => !i.subcategory_id || !known.has(i.subcategory_id)) },
          ...subs.map((s) => ({ id: s.id, name: s.name, items: own.filter((i) => i.subcategory_id === s.id) })),
        ].filter((s) => s.items.length > 0)
        // `items` queda en el orden en que se ven, para el conteo y la foto de portada.
        return { ...category, sections, items: sections.flatMap((s) => s.items) }
      })
      .filter((c) => c.items.length > 0),
  }
}

export interface MenuSection {
  id: string | null
  name: string | null
  items: MenuItem[]
}

export type PublicCategory = Awaited<ReturnType<typeof loadPublicMenu>>['categories'][number]
