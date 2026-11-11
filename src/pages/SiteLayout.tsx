import { useEffect, useLayoutEffect, useState } from 'react'
import { Route, Routes, useLocation, useParams } from 'react-router-dom'
import HeroBackground from '../components/HeroBackground'
import Home from './Home'
import Menu from './Menu'
import MenuCategory from './MenuCategory'
import { cartaPrincipal, cartaPublica } from '../lib/cartas'
import { bySort } from '../lib/format'
import { SiteProvider } from '../lib/sitio'
import { store } from '../lib/store'
import { aplicarTema } from '../lib/tema'
import type { Theme } from '../lib/types'
import { useCached } from '../lib/useCached'
import { palabras } from '../lib/vocab'
import NotFound from './NotFound'

/** Mensajes que manda el panel a la vista previa (iframe) con el diseño sin guardar. */
export type MensajeVistaPrevia = { type: 'tema'; theme: Theme } | { type: 'listo' }

/**
 * Todo lo que va en /#/<slug>: carga la página, aplica su diseño y deja el video corriendo
 * entre el inicio y la carta. Si la página no existe o está en borrador (y no eres el admin), "no encontrada".
 */
export default function SiteLayout() {
  const { slug = '' } = useParams()
  const { pathname } = useLocation()
  // Dentro del iframe del panel: escucha el diseño sin guardar (aunque se navegue dentro de la vista previa).
  const preview = window.parent !== window
  const { data: site, error } = useCached(`site:${slug}`, () => store.getSiteBySlug(slug))
  // Las cartas adicionales (inglés, bebidas…). Si fallan, la principal sigue funcionando.
  const { data: menus, error: menusError } = useCached(`menus:${site?.id ?? slug}`, async () =>
    site ? (await store.list('menus', site.id)).filter((c) => c.is_active).sort(bySort) : undefined,
  )
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null)

  useEffect(() => {
    if (!preview) return
    const onMessage = (e: MessageEvent<MensajeVistaPrevia>) => {
      if (e.origin === location.origin && e.data?.type === 'tema') setPreviewTheme(e.data.theme)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'listo' } satisfies MensajeVistaPrevia, location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [preview])

  const theme = previewTheme ?? site?.theme ?? null
  useLayoutEffect(() => aplicarTema(theme), [theme])
  useEffect(() => () => aplicarTema(null), [])

  useEffect(() => {
    if (!site) return
    document.title = site.seo_title || site.name
    document.querySelector('meta[name=description]')?.setAttribute('content', site.seo_description || site.description.replace(/\n/g, ' '))
  }, [site])

  if (error) {
    return <p className="mx-auto mt-24 max-w-sm px-5 text-center text-niebla">No pudimos cargar la página. Revisa tu conexión y vuelve a intentarlo.</p>
  }
  if (site === undefined) return <div className="min-h-dvh" />
  if (site === null || !theme) return <NotFound />

  const m = palabras(site.vocab)
  const home = `/${site.slug}`
  const seccion = `${home}/${m.ruta}`
  const principal = cartaPrincipal(m)
  // Junto a una carta en inglés, la principal se nombra por su idioma: «Carta» no le dice nada a un turista.
  if (menus?.some((c) => c.idioma === 'en')) principal.nombre = 'Español'
  const cartas = [principal, ...(menus ?? []).map((c) => cartaPublica(c, m))]
  const rutaCarta = (menuId: string | null | undefined) => `${home}/${cartas.find((c) => c.id === (menuId ?? null))?.ruta ?? m.ruta}`

  return (
    <SiteProvider value={{ site, theme, m, home, seccion, cartas, cartasListas: menus !== undefined || !!menusError, rutaCarta }}>
      {/* Fuera del inicio (en cualquier carta) el fondo se oscurece para que se lea. */}
      <HeroBackground theme={theme} dim={pathname !== home && pathname !== `${home}/`} />
      {!site.published && !preview && (
        <p className="fixed top-[max(.75rem,env(safe-area-inset-top))] left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white backdrop-blur">
          Borrador · solo tú la ves
        </p>
      )}
      {/* /#/pez-y-mar, /#/pez-y-mar/catalogo y /#/pez-y-mar/catalogo/<categoría> */}
      <Routes>
        <Route index element={<Home />} />
        <Route path=":seccion" element={<Menu />} />
        <Route path=":seccion/:categoryId" element={<MenuCategory />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteProvider>
  )
}
