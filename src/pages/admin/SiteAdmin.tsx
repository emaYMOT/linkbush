import { ChevronDown, ChevronLeft, ExternalLink, MousePointerClick, Palette, Settings, Store, UserRound, UtensilsCrossed } from 'lucide-react'
import { lazy, Suspense } from 'react'
import toast from 'react-hot-toast'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { limpiarEnSegundoPlano } from '../../lib/archivos'
import { store } from '../../lib/store'
import { palabras } from '../../lib/vocab'
import { EmptyState } from './AdminApp'
import { AdminSiteProvider, useAdmin } from './contexto'
import LinksEditor from './LinksEditor'
import MenuEditor from './MenuEditor'
import ProfileEditor from './ProfileEditor'
import { Estado } from './Sites'

// Las pestañas más pesadas se descargan al abrirlas por primera vez.
const DesignEditor = lazy(() => import('./DesignEditor'))
const SettingsEditor = lazy(() => import('./SettingsEditor'))
const CategoryEditor = lazy(() => import('./CategoryEditor'))

/** Esqueleto mientras baja una pestaña: la forma del título y dos tarjetas, para que nada salte al llegar. */
function Cargando() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="animate-pulse space-y-5">
      <div className="h-9 w-48 rounded-xl bg-linea/70" />
      <div className="h-40 rounded-[1.4rem] bg-linea/50" />
      <div className="h-64 rounded-[1.4rem] bg-linea/50" />
    </div>
  )
}

/** Una página dentro del panel: selector de página arriba y una pestaña por cada cosa que se edita. */
export default function SiteAdmin() {
  const { siteId } = useParams()
  const { sites, setSites } = useAdmin()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const site = sites?.find((s) => s.id === siteId)

  if (!sites) return null
  if (!site) {
    return (
      <main className="mx-auto max-w-3xl px-4 pt-6">
        <EmptyState>
          Esta página ya no existe. <Link to="/admin" className="font-semibold text-tinta underline">Volver a Mis páginas</Link>
        </EmptyState>
      </main>
    )
  }

  const m = palabras(site.vocab)
  const base = `/admin/${site.id}`
  const tab = pathname.slice(base.length + 1).split('/')[0]

  async function update(patch: Parameters<typeof store.updateSite>[1]) {
    try {
      const saved = await store.updateSite(site!.id, patch)
      setSites((list) => list.map((s) => (s.id === saved.id ? saved : s)))
      // Foto de perfil, video o póster reemplazados: los anteriores se borran de Storage.
      if ('avatar_url' in patch || 'theme' in patch) limpiarEnSegundoPlano(site!.id)
      return saved
    } catch (e) {
      toast.error((e as Error).message)
      throw e
    }
  }

  const tabs = [
    ['botones', 'Botones', MousePointerClick],
    ['catalogo', m.seccion, site.vocab.tipo === 'tienda' ? Store : UtensilsCrossed],
    ['perfil', 'Perfil', UserRound],
    ['diseno', 'Diseño', Palette],
    ['ajustes', 'Ajustes', Settings],
  ] as const

  return (
    <AdminSiteProvider value={{ site, m, base, update }}>
      {/* Pegada bajo la barra de arriba: las pestañas siempre a mano, aunque la sección sea larga. */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 border-b border-linea bg-superficie/90 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto max-w-6xl px-4 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Link to="/admin" aria-label="Mis páginas" title="Mis páginas" className="-ml-2 grid size-10 shrink-0 place-items-center rounded-xl text-gris hover:bg-papel hover:text-tinta">
              <ChevronLeft size={20} />
            </Link>
            <label className="sr-only" htmlFor="cambiar-pagina">Página que editas</label>
            <div className="relative min-w-0">
              <select
                id="cambiar-pagina"
                value={site.id}
                onChange={(e) => navigate(`/admin/${e.target.value}/${tab || 'botones'}`)}
                className="min-h-10 w-full max-w-[52vw] min-w-0 appearance-none truncate rounded-xl bg-transparent py-1.5 pr-8 pl-2 font-ui-display text-[1.2rem] font-semibold hover:bg-papel focus:outline-none sm:max-w-sm"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gris" />
            </div>
            <Estado published={site.published} />
            <a href={`#/${site.slug}`} target="_blank" rel="noopener" className="ml-auto inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-linea px-3 text-sm font-semibold hover:bg-papel">
              <ExternalLink size={16} /> <span className="hidden sm:inline">Ver página</span><span className="sr-only sm:hidden">Ver página (otra pestaña)</span>
            </a>
          </div>
          <nav className="no-scrollbar -mx-4 mt-1.5 flex gap-0.5 overflow-x-auto px-3" aria-label="Secciones de la página">
            {tabs.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={`${base}/${to}`}
                className={({ isActive }) =>
                  `relative flex shrink-0 items-center gap-1.5 px-3 pt-2 pb-2.5 text-[0.92rem] font-semibold whitespace-nowrap ${isActive ? 'text-tinta after:absolute after:inset-x-2.5 after:bottom-0 after:h-[2.5px] after:rounded-full after:bg-resalte' : 'text-gris hover:text-tinta'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} aria-hidden className={isActive ? 'text-resalte' : ''} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* key: al cambiar de página en el selector, cada editor arranca de cero con los datos de la otra. */}
      <main key={site.id} className={`mx-auto px-4 pt-7 pb-16 ${tab === 'diseno' ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route index element={<Navigate to="botones" replace />} />
            <Route path="botones" element={<LinksEditor />} />
            <Route path="catalogo" element={<MenuEditor />} />
            <Route path="catalogo/:categoryId" element={<CategoryEditor />} />
            <Route path="perfil" element={<ProfileEditor />} />
            <Route path="diseno" element={<DesignEditor />} />
            <Route path="ajustes" element={<SettingsEditor />} />
            <Route path="*" element={<Navigate to="botones" replace />} />
          </Routes>
        </Suspense>
      </main>
    </AdminSiteProvider>
  )
}
