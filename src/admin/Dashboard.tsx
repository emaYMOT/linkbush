import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { publicUrl, slugify, supabase, type Page } from '../lib/supabase'
import { backgroundStyle, buttonStyle, resolveTheme } from '../lib/theme'
import { TEMPLATES } from '../lib/templates'
import { Icon } from '../lib/icons'
import { iconBtn, inputCls, primaryBtn, secondaryBtn } from './ui'

type Row = Page & { links: { count: number }[] }

/** Devuelve un slug libre agregando -2, -3… si ya existe. */
export async function uniqueSlug(base: string, excludeId?: string) {
  const { data } = await supabase.from('pages').select('id, slug').like('slug', `${base}%`)
  const taken = new Set((data || []).filter((p) => p.id !== excludeId).map((p) => p.slug))
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('pages').select('*, links(count)').order('updated_at', { ascending: false })
    setRows((data as Row[]) || [])
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!rows) return []
    return q ? rows.filter((r) => r.title.toLowerCase().includes(q) || r.slug.includes(q)) : rows
  }, [rows, query])

  async function duplicate(p: Row) {
    const slug = await uniqueSlug(`${p.slug}-copia`)
    const { data: np } = await supabase
      .from('pages')
      .insert({ slug, title: `${p.title} (copia)`, bio: p.bio, avatar_url: p.avatar_url, theme: p.theme, published: false })
      .select()
      .single()
    if (!np) return
    const { data: links } = await supabase.from('links').select('*').eq('page_id', p.id)
    if (links?.length) {
      await supabase.from('links').insert(
        links.map(({ label, url, icon, position, enabled }) => ({ page_id: np.id, label, url, icon, position, enabled })),
      )
    }
    load()
  }

  async function remove(p: Row) {
    if (!confirm(`¿Eliminar la página de "${p.title || p.slug}"? Las tarjetas que apunten a ella dejarán de funcionar.`)) return
    await supabase.from('pages').delete().eq('id', p.id)
    load()
  }

  function copy(p: Row) {
    navigator.clipboard.writeText(publicUrl(p.slug))
    setCopied(p.id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis clientes</h1>
          <p className="text-sm text-stone-500">{rows ? `${rows.length} página${rows.length === 1 ? '' : 's'}` : 'Cargando…'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={primaryBtn} onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} /> Nuevo cliente
          </button>
          <button className={iconBtn} title="Cerrar sesión" onClick={() => supabase.auth.signOut()}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </header>

      {rows && rows.length > 4 && (
        <input className={`${inputCls} mt-6`} placeholder="Buscar cliente…" value={query} onChange={(e) => setQuery(e.target.value)} />
      )}

      {rows && rows.length === 0 && (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-stone-300 p-10 text-center">
          <p className="text-lg font-semibold">Aún no tienes clientes</p>
          <p className="mt-1 text-sm text-stone-500">Crea la primera página y graba su link en una tarjeta.</p>
          <button className={`${primaryBtn} mt-5`} onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} /> Crear la primera
          </button>
        </div>
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const t = resolveTheme(p.theme)
          return (
            <li key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
              <RouterLink to={`p/${p.id}`} className="block">
                <div className="flex h-28 flex-col items-center justify-center gap-2 px-8" style={backgroundStyle(t)}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: t.textColor }}>
                      {p.title}
                    </span>
                  )}
                  <span className="h-4 w-full max-w-[140px]" style={buttonStyle(t)} />
                </div>
                <div className="px-4 pt-3">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold">{p.title || 'Sin nombre'}</h2>
                    {!p.published && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Oculta</span>}
                  </div>
                  <p className="truncate text-sm text-stone-500">
                    /{p.slug} · {p.links[0]?.count ?? 0} enlaces
                  </p>
                </div>
              </RouterLink>
              <div className="flex items-center gap-1 px-2 pb-2 pt-1">
                <button className={`${iconBtn} w-auto gap-1.5 px-2 text-sm`} onClick={() => copy(p)}>
                  <Icon name={copied === p.id ? 'check' : 'copy'} size={16} /> {copied === p.id ? 'Copiado' : 'Copiar link'}
                </button>
                <span className="flex-1" />
                <a className={iconBtn} href={publicUrl(p.slug)} target="_blank" rel="noreferrer" title="Abrir página">
                  <Icon name="external" size={16} />
                </a>
                <button className={iconBtn} title="Duplicar" onClick={() => duplicate(p)}>
                  <Icon name="duplicate" size={16} />
                </button>
                <button className={`${iconBtn} hover:text-red-600`} title="Eliminar" onClick={() => remove(p)}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {creating && <CreateDialog onClose={() => setCreating(false)} onCreated={(id) => navigate(`p/${id}`)} />}
    </div>
  )
}

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const slug = await uniqueSlug(slugify(name))
    const { data, error } = await supabase
      .from('pages')
      .insert({ slug, title: name.trim(), theme: TEMPLATES[0].theme, published: true })
      .select()
      .single()
    if (error || !data) {
      setBusy(false)
      setError('No se pudo crear la página. Intenta de nuevo.')
      return
    }
    await supabase.from('links').insert({ page_id: data.id, label: 'Déjanos tu reseña en Google', url: '', icon: 'review', position: 0 })
    onCreated(data.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold">Nuevo cliente</h2>
        <p className="mt-1 text-sm text-stone-500">Escribe el nombre del negocio. Todo lo demás lo puedes cambiar después.</p>
        <input autoFocus className={`${inputCls} mt-4`} placeholder="Ej. Panadería Luna" value={name} onChange={(e) => setName(e.target.value)} />
        {name.trim() && <p className="mt-2 truncate text-xs text-stone-500">Link: {publicUrl(slugify(name))}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={secondaryBtn} onClick={onClose}>
            Cancelar
          </button>
          <button disabled={busy || !name.trim()} className={primaryBtn}>
            {busy ? 'Creando…' : 'Crear página'}
          </button>
        </div>
      </form>
    </div>
  )
}
