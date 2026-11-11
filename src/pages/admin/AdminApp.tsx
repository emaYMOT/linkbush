import { LogOut, Monitor, Moon, Shrub, Sun, Undo2 } from 'lucide-react'
import { Button } from '../../components/Modal'
import { useCallback, useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useModoPanel, type ModoPanel } from '../../lib/modoPanel'
import { store, type AdminSession } from '../../lib/store'
import type { Site } from '../../lib/types'
import { clearPublicCache } from '../../lib/useCached'
import { AdminProvider } from './contexto'
import Login from './Login'
import SiteAdmin from './SiteAdmin'
import Sites from './Sites'

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined)
  const [sites, setSitesState] = useState<Site[] | null>(null)

  useEffect(() => {
    document.documentElement.dataset.ruta = 'admin'
    document.title = 'Link Bush · Panel'
    store.getSession().then(setSession, () => setSession(null))
    // Al salir del panel, la página pública vuelve a pedir los datos recién editados.
    return () => {
      delete document.documentElement.dataset.ruta
      clearPublicCache()
    }
  }, [])

  const reloadSites = useCallback(async () => {
    try {
      setSitesState(await store.listSites())
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  useEffect(() => {
    if (session) reloadSites()
  }, [session, reloadSites])

  async function signOut() {
    await store.signOut()
    setSession(null)
    setSitesState(null)
  }

  return (
    <div className="panel min-h-dvh bg-papel font-ui text-tinta">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: '14px', fontWeight: 500, fontSize: '0.95rem', padding: '10px 14px', background: 'var(--color-superficie)', color: 'var(--color-tinta)', border: '1px solid var(--color-linea)', boxShadow: '0 12px 32px -12px rgb(16 24 40 / .25)' },
          duration: 3500,
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      />
      {session === undefined ? null : session === null ? (
        <Login onSignedIn={setSession} />
      ) : (
        <AdminProvider value={{ sites, setSites: (update) => setSitesState((list) => (list ? update(list) : list)), reloadSites }}>
          <header className="sticky top-0 z-30 border-b border-linea bg-superficie/90 pt-[env(safe-area-inset-top)] backdrop-blur-md backdrop-saturate-150">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
              <Link to="/admin" className="sin-presion -ml-1.5 flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1" aria-label="Link Bush: Mis páginas">
                <Marca />
                <span className="font-ui-display text-[1.2rem] leading-none whitespace-nowrap">Link Bush</span>
                {store.mode === 'demo' && <span className="rounded-full bg-resalte/12 px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide text-resalte uppercase">Demo</span>}
              </Link>
              <SelectorModo />
              <button type="button" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión" className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-gris hover:bg-papel hover:text-tinta">
                <LogOut size={17} /> <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </header>

          {store.mode === 'demo' && (
            <p className="mx-auto mt-4 max-w-6xl px-4 text-sm text-gris">
              <strong className="text-tinta">Modo demo.</strong> Los cambios se guardan solo en este navegador. Cuando conectes Supabase se publicarán para todos.
            </p>
          )}

          <Routes>
            <Route index element={<Sites />} />
            <Route path=":siteId/*" element={<SiteAdmin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AdminProvider>
      )}
    </div>
  )
}

const MODOS: [ModoPanel, string, typeof Sun][] = [
  ['claro', 'Claro', Sun],
  ['oscuro', 'Oscuro', Moon],
  ['auto', 'Automático (el del sistema)', Monitor],
]

/** Claro / Oscuro / Automático para el panel. La página pública no cambia. */
function SelectorModo() {
  const [modo, setModo] = useModoPanel()
  return (
    <div role="group" aria-label="Modo del panel" className="flex rounded-xl bg-papel p-0.5">
      {MODOS.map(([value, label, Icon]) => (
        <button
          key={value}
          type="button"
          aria-pressed={modo === value}
          aria-label={label}
          title={label}
          onClick={() => setModo(value)}
          className={`grid size-9 place-items-center rounded-[10px] ${modo === value ? 'sombra-panel bg-superficie text-tinta' : 'text-gris hover:text-tinta'}`}
        >
          <Icon size={16} aria-hidden />
        </button>
      ))}
    </div>
  )
}

/** El símbolo de Link Bush: un arbusto, en blanco y negro (se invierte en modo oscuro). */
export function Marca({ size = 30 }: { size?: number }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-[9px] bg-tinta text-superficie" style={{ width: size, height: size }}>
      <Shrub size={size * 0.6} strokeWidth={2} />
    </span>
  )
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-ui-display text-[1.85rem] leading-[1.1] tracking-[-0.015em] sm:text-[2.1rem]">{title}</h1>
        {description && <p className="mt-2 max-w-[56ch] text-[0.95rem] leading-relaxed text-gris">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function EmptyState({ icon, children, action }: { icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-linea bg-superficie/50 px-6 py-12 text-center text-gris">
      {icon && <span className="grid size-12 place-items-center rounded-2xl bg-papel text-tinta">{icon}</span>}
      <div className="max-w-[42ch]">{children}</div>
      {action}
    </div>
  )
}

/** Tarjeta de los formularios del panel. Con `id`, se puede saltar a ella desde un índice. */
export function Card({ title, description, children, id, aside }: { title?: string; description?: string; children: React.ReactNode; id?: string; aside?: React.ReactNode }) {
  return (
    <section id={id} className="sombra-panel rounded-[1.4rem] border border-linea bg-superficie p-4 sm:p-6">
      {(title || aside) && (
        <div className="flex items-start justify-between gap-3">
          {title && <h2 className="font-ui-display text-[1.3rem] leading-tight tracking-[-0.01em]">{title}</h2>}
          {aside}
        </div>
      )}
      {description && <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-gris">{description}</p>}
      <div className={title || description ? 'mt-5' : ''}>{children}</div>
    </section>
  )
}

/**
 * Barra de guardar que queda pegada abajo mientras hay algo por guardar.
 * Dice siempre en qué estado está el formulario, para que nadie se vaya sin guardar.
 */
export function BarraGuardar({ dirty, busy, onSave, onDiscard, label, extra }: { dirty: boolean; busy: boolean; onSave: () => void; onDiscard?: () => void; label: string; extra?: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-2 px-4 pt-2 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:px-0">
      <div className={`flex items-center gap-1.5 rounded-2xl border bg-superficie/95 p-2 pl-3.5 backdrop-blur-md sm:gap-2 sm:pl-4 ${dirty ? 'sombra-flotante border-resalte/30' : 'sombra-panel border-linea'}`}>
        {/* En celular solo el punto (el texto queda para lectores de pantalla): así los botones caben en una línea. */}
        <span className="mr-auto flex min-w-0 items-center gap-2 text-sm text-gris" aria-live="polite">
          <span aria-hidden className={`size-2 shrink-0 rounded-full ${dirty ? 'bg-resalte' : 'bg-exito'}`} />
          <span className="max-sm:sr-only truncate">{dirty ? 'Cambios sin guardar' : 'Todo guardado'}</span>
        </span>
        {extra}
        {/* En celular, Descartar es solo un ícono: con texto, los tres botones no caben en 375 px. */}
        {dirty && onDiscard && (
          <Button variant="ghost" aria-label="Descartar cambios" title="Descartar cambios" className="px-3 whitespace-nowrap sm:px-4.5" onClick={onDiscard}>
            <Undo2 size={18} aria-hidden className="sm:hidden" />
            <span className="max-sm:hidden">Descartar</span>
          </Button>
        )}
        <Button className="px-3.5 whitespace-nowrap sm:px-4.5" onClick={onSave} busy={busy} disabled={!dirty}>{label}</Button>
      </div>
    </div>
  )
}
