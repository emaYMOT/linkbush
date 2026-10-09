import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import LinkPage from '../components/LinkPage'
import { publicUrl, supabase, type Link, type Page } from '../lib/supabase'
import { resolveTheme } from '../lib/theme'
import { Icon } from '../lib/icons'
import LinksTab from './tabs/LinksTab'
import ProfileTab from './tabs/ProfileTab'
import DesignTab from './tabs/DesignTab'
import { iconBtn, secondaryBtn } from './ui'

type Tab = 'links' | 'profile' | 'design' | 'preview'
type SaveState = 'saved' | 'pending' | 'saving' | 'error'

const TABS: { id: Tab; label: string; mobileOnly?: boolean }[] = [
  { id: 'links', label: 'Enlaces' },
  { id: 'profile', label: 'Perfil' },
  { id: 'design', label: 'Diseño' },
  { id: 'preview', label: 'Vista previa', mobileOnly: true },
]

export default function Editor() {
  const { id = '' } = useParams()
  const [page, setPage] = useState<Page | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<Tab>('links')
  const [save, setSave] = useState<SaveState>('saved')
  const [saveError, setSaveError] = useState('')

  const pageRef = useRef<Page | null>(null)
  const linksRef = useRef<Link[]>([])
  const dirty = useRef({ page: false, links: false })
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      const { data: p } = await supabase.from('pages').select('*').eq('id', id).maybeSingle()
      if (!p) return setNotFound(true)
      const { data: l } = await supabase.from('links').select('*').eq('page_id', id).order('position')
      pageRef.current = p
      linksRef.current = l || []
      setPage(p)
      setLinks(l || [])
      document.title = `${p.title} · Panel`
    })()
  }, [id])

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current)
    const d = dirty.current
    if (!d.page && !d.links) return
    dirty.current = { page: false, links: false }
    setSave('saving')
    setSaveError('')
    const errors: string[] = []
    if (d.page && pageRef.current) {
      const { slug, title, bio, avatar_url, theme, published } = pageRef.current
      // Mientras se escribe el link puede quedar incompleto (ej. "panaderia-"); solo se guarda cuando es válido.
      const validSlug = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
      const { error } = await supabase
        .from('pages')
        .update({ ...(validSlug ? { slug } : {}), title, bio, avatar_url, theme, published })
        .eq('id', id)
      if (error) {
        errors.push(error.code === '23505' ? 'Ese link ya lo usa otro cliente.' : error.code === '23514' ? 'El link solo puede tener letras, números y guiones.' : 'No se pudo guardar.')
      }
    }
    if (d.links) {
      // Mismas columnas en todas las filas: si una trae created_at y otra no, PostgREST manda NULL y falla.
      const rows = linksRef.current.map(({ id, page_id, label, url, icon, enabled }, i) => ({ id, page_id, label, url, icon, enabled, position: i }))
      const { error } = await supabase.from('links').upsert(rows)
      if (error) errors.push('No se pudieron guardar los enlaces.')
    }
    if (errors.length) {
      setSave('error')
      setSaveError(errors.join(' '))
    } else if (!dirty.current.page && !dirty.current.links) {
      setSave('saved')
    }
  }, [id])

  const schedule = useCallback(() => {
    setSave('pending')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 600)
  }, [flush])

  // Guarda antes de salir de la página
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current.page || dirty.current.links) {
        flush()
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      flush()
    }
  }, [flush])

  const updatePage = useCallback(
    (patch: Partial<Page>) => {
      const next = { ...pageRef.current!, ...patch }
      pageRef.current = next
      setPage(next)
      dirty.current.page = true
      schedule()
    },
    [schedule],
  )

  const updateLinks = useCallback(
    (next: Link[]) => {
      linksRef.current = next
      setLinks(next)
      dirty.current.links = true
      schedule()
    },
    [schedule],
  )

  const deleteLink = useCallback(async (linkId: string) => {
    const next = linksRef.current.filter((l) => l.id !== linkId)
    linksRef.current = next
    setLinks(next)
    await supabase.from('links').delete().eq('id', linkId)
  }, [])

  if (notFound) {
    return (
      <div className="p-8 text-center">
        <p className="font-semibold">Esta página no existe.</p>
        <RouterLink to="/admin" className={`${secondaryBtn} mt-4`}>
          Volver
        </RouterLink>
      </div>
    )
  }
  if (!page) return <div className="p-8 text-center text-stone-500">Cargando…</div>

  const theme = resolveTheme(page.theme)
  const preview = (
    <LinkPage preview theme={theme} data={{ title: page.title, bio: page.bio, avatar_url: page.avatar_url, links: links.filter((l) => l.enabled) }} />
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-6">
          <RouterLink to="/admin" className={iconBtn} title="Volver" onClick={() => flush()}>
            <Icon name="back" size={20} />
          </RouterLink>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold leading-tight">{page.title || 'Sin nombre'}</h1>
            <SaveBadge state={save} error={saveError} />
          </div>
          <a href={publicUrl(page.slug)} target="_blank" rel="noreferrer" className={`${secondaryBtn} px-3`}>
            <Icon name="external" size={16} /> <span className="hidden sm:inline">Ver página</span>
          </a>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-3 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition ${t.mobileOnly ? 'lg:hidden' : ''} ${
                tab === t.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-3 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className={tab === 'preview' ? 'hidden lg:block' : ''}>
          {(tab === 'links' || tab === 'preview') && (
            <LinksTab pageId={page.id} links={links} onChange={updateLinks} onDelete={deleteLink} />
          )}
          {tab === 'profile' && <ProfileTab page={page} onChange={updatePage} />}
          {tab === 'design' && <DesignTab page={page} theme={theme} onChange={(t) => updatePage({ theme: t })} />}
        </section>

        <aside className={tab === 'preview' ? 'block' : 'hidden lg:block'}>
          <div className="sticky top-32">
            <PhoneFrame>{preview}</PhoneFrame>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[44px] bg-stone-900 p-3 shadow-2xl">
      <div className="h-[680px] max-h-[calc(100dvh-12rem)] overflow-y-auto overflow-x-hidden rounded-[34px] bg-white [scrollbar-width:none]">
        {children}
      </div>
    </div>
  )
}

function SaveBadge({ state, error }: { state: SaveState; error: string }) {
  if (state === 'error') return <p className="truncate text-xs font-medium text-red-600">{error}</p>
  const text = { saved: 'Guardado ✓', pending: 'Cambios sin guardar…', saving: 'Guardando…' }[state]
  return <p className={`text-xs ${state === 'saved' ? 'text-emerald-600' : 'text-stone-500'}`}>{text}</p>
}
