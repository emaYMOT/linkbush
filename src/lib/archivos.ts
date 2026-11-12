import { rutaMiniatura } from './medios'
import { store, type StoredFile } from './store'

/**
 * Limpieza de archivos (fotos, póster, video) que ya no usa ninguna página.
 * Los archivos viven en Supabase Storage y la base de datos solo guarda su enlace; al reemplazar o quitar
 * uno, el archivo viejo se queda ocupando espacio. Aquí se detectan y se borran.
 *
 * Reglas de seguridad:
 * - Un archivo se considera "en uso" si lo usa CUALQUIER página (una copia puede compartir fotos con su original).
 * - No se borra nada subido hace menos de `minutos` (puede ser un borrador que aún no se guardó).
 * - Si algo falla al leer, no se borra nada.
 */

/** "https://…/storage/v1/object/public/media/<ruta>" → "<ruta>" */
export function rutaDeUrl(url: string | null | undefined): string | null {
  const m = url?.match(/\/object\/public\/media\/(.+?)(?:\?.*)?$/)
  return m ? decodeURIComponent(m[1]) : null
}

/** Todas las rutas que alguna página usa hoy (salvo las de `excluir`, para cuando se va a borrar esa página). */
async function rutasEnUso(excluir?: string): Promise<Set<string>> {
  const sites = (await store.listSites()).filter((s) => s.id !== excluir)
  const usadas = new Set<string>()
  const add = (url: string | null | undefined) => {
    const ruta = rutaDeUrl(url)
    if (!ruta) return
    usadas.add(ruta)
    // Su miniatura va con ella: se conserva mientras la foto se use y se borra cuando la foto sobra.
    const mini = rutaMiniatura(ruta)
    if (mini) usadas.add(mini)
  }
  for (const s of sites) {
    add(s.avatar_url)
    add(s.theme.fondo.video)
    const [categorias, productos] = await Promise.all([store.list('menu_categories', s.id), store.list('menu_items', s.id)])
    categorias.forEach((c) => add(c.image_url))
    productos.forEach((p) => add(p.image_url))
  }
  return usadas
}

export interface AnalisisArchivos {
  total: number
  bytes: number
  sobran: StoredFile[]
  bytesSobran: number
}

/** Qué archivos de la página ya no usa nadie (y llevan más de `minutos` guardados). */
export async function analizarArchivos(siteId: string, minutos = 120): Promise<AnalisisArchivos> {
  const [archivos, usadas] = await Promise.all([store.listFiles(siteId), rutasEnUso()])
  const limite = Date.now() - minutos * 60_000
  // Sin fecha legible, por precaución se conserva.
  const sobran = archivos.filter((f) => !usadas.has(f.path) && f.created_at && new Date(f.created_at).getTime() < limite)
  const suma = (list: StoredFile[]) => list.reduce((n, f) => n + f.size, 0)
  return { total: archivos.length, bytes: suma(archivos), sobran, bytesSobran: suma(sobran) }
}

export async function borrarSobrantes(sobran: StoredFile[]) {
  await store.removeFiles(sobran.map((f) => f.path))
}

/** Borra los archivos de una página que se va a eliminar (menos los que otra página siga usando). */
export async function borrarArchivosDePagina(siteId: string) {
  const [archivos, usadas] = await Promise.all([store.listFiles(siteId), rutasEnUso(siteId)])
  await store.removeFiles(archivos.filter((f) => !usadas.has(f.path)).map((f) => f.path))
}

const pendientes = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Después de guardar o borrar algo, limpia en segundo plano (espera unos segundos por si vienen más cambios).
 * Si falla, no pasa nada: queda para la próxima vez o para el botón de Ajustes.
 */
export function limpiarEnSegundoPlano(siteId: string) {
  if (store.mode === 'demo') return
  clearTimeout(pendientes.get(siteId))
  pendientes.set(
    siteId,
    setTimeout(async () => {
      pendientes.delete(siteId)
      try {
        const { sobran } = await analizarArchivos(siteId)
        if (sobran.length) await borrarSobrantes(sobran)
      } catch (e) {
        console.warn('No se pudo limpiar archivos sin usar:', e)
      }
    }, 5000),
  )
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
