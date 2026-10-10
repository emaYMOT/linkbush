import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import LinkPage from '../components/LinkPage'
import { supabase, type Link, type Page } from '../lib/supabase'
import { resolveTheme } from '../lib/theme'

type State = { status: 'loading' } | { status: 'notfound' } | { status: 'ok'; page: Page; links: Link[] }

export default function PublicPage() {
  const { slug = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancel = false
    ;(async () => {
      const { data: page } = await supabase.from('pages').select('*').eq('slug', slug.toLowerCase()).eq('published', true).maybeSingle()
      if (!page) return !cancel && setState({ status: 'notfound' })
      const { data: links } = await supabase
        .from('links')
        .select('*')
        .eq('page_id', page.id)
        .eq('enabled', true)
        .order('position')
      if (cancel) return
      document.title = page.title || 'Links'
      setState({ status: 'ok', page, links: links || [] })
    })()
    return () => {
      cancel = true
    }
  }, [slug])

  useEffect(() => {
    if (state.status !== 'ok') return
    const t = resolveTheme(state.page.theme)
    const [top, bottom] = t.bgType === 'gradient' ? t.bgGradient : [t.bgColor, t.bgColor]
    document.body.style.background = bottom
    // Color de la barra superior del navegador en Android (y de respaldo en iPhone)
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = top
  }, [state])

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
      </div>
    )
  }

  if (state.status === 'notfound') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center text-stone-700">
        <p className="text-5xl">🔗</p>
        <h1 className="text-xl font-semibold">Esta página no existe</h1>
        <p className="text-sm text-stone-500">Revisa el enlace o vuelve a escanear la tarjeta.</p>
      </div>
    )
  }

  return <LinkPage data={{ ...state.page, links: state.links }} theme={resolveTheme(state.page.theme)} />
}
