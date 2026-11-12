import { ExternalLink, Languages, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field, focusFirstInvalid, TextArea, TextInput } from '../../components/Field'
import Modal, { Button, CancelButton } from '../../components/Modal'
import Toggle from '../../components/Toggle'
import { IDIOMAS, rutaCartaError, rutaSugerida } from '../../lib/cartas'
import type { Carta, Draft, Idioma } from '../../lib/types'
import { useAdminSite } from './contexto'
import { Opciones } from './controles'

/**
 * Fila de cartas arriba de las categorías: la principal y las adicionales (inglés, bebidas…).
 * Elegir una muestra sus categorías; desde aquí también se crea y se edita cada carta.
 */
export function SelectorCartas({ cartas, actual, onElegir, onNueva, onEditar }: {
  cartas: Carta[]
  actual: string | null
  onElegir: (id: string | null) => void
  onNueva: () => void
  onEditar: (carta: Carta) => void
}) {
  const { m, site } = useAdminSite()
  const editando = cartas.find((c) => c.id === actual)
  const chip = (activa: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${activa ? 'bg-tinta text-superficie' : 'border border-linea bg-superficie hover:border-tinta/30'}`

  return (
    <div className="mb-6 rounded-[1.4rem] border border-linea bg-superficie p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="flex items-center gap-2 font-semibold"><Languages size={18} aria-hidden className="text-gris" /> Cartas</h2>
        <Button variant="ghost" onClick={onNueva}><Plus size={18} /> Agregar carta</Button>
      </div>
      {cartas.length === 0 ? (
        <p className="mt-1 px-1 text-sm text-gris">Por ahora hay una sola. Agrega otra si tienes la carta en inglés o una aparte (bebidas, brunch…).</p>
      ) : (
        <>
          <div role="tablist" aria-label="Cartas" className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 py-1">
            <button type="button" role="tab" aria-selected={actual === null} onClick={() => onElegir(null)} className={chip(actual === null)}>
              {m.seccion} <span className="font-normal opacity-70">· principal</span>
            </button>
            {cartas.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={actual === c.id} onClick={() => onElegir(c.id)} className={chip(actual === c.id)}>
                {c.name}
                {!c.is_active && <span className="font-normal opacity-70">· oculta</span>}
              </button>
            ))}
          </div>
          {editando && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-linea px-1 pt-3 text-sm text-gris">
              <span className="min-w-0 flex-1 truncate">
                {editando.idioma === 'en' ? 'En inglés' : 'En español'} · <code>/{site.slug}/{editando.ruta}</code>
              </span>
              <a href={`/${site.slug}/${editando.ruta}`} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 font-semibold text-tinta hover:bg-papel">
                <ExternalLink size={16} /> Ver
              </a>
              <Button variant="outline" onClick={() => onEditar(editando)}><Pencil size={16} /> Editar carta</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Crear o editar una carta adicional: nombre, idioma de los textos fijos, dirección, título y visibilidad. */
export function CartaForm({ initial, cartas, onSave, onClose, onDelete }: {
  initial: Draft<Carta>
  cartas: Carta[]
  onSave: (draft: Draft<Carta>) => Promise<void>
  onClose: () => void
  onDelete?: () => void
}) {
  const { m, site } = useAdminSite()
  const [draft, setDraft] = useState(initial)
  const [rutaTocada, setRutaTocada] = useState(!!initial.id)
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const set = (fields: Partial<Draft<Carta>>) => setDraft((d) => ({ ...d, ...fields }))

  const nameError = draft.name.trim() ? '' : 'Escribe el nombre de la carta.'
  const rutaError = rutaCartaError(draft.ruta, m.ruta, cartas, initial.id)

  function cambiarNombre(name: string) {
    set({ name, ...(rutaTocada ? {} : { ruta: rutaSugerida(name) }) })
  }

  function cambiarIdioma(idioma: Idioma) {
    // Si el nombre sigue siendo el sugerido, se cambia con el idioma.
    const sugeridos = ['English menu', 'Carta en español', '']
    set({ idioma, ...(sugeridos.includes(draft.name) ? { name: idioma === 'en' ? 'English menu' : 'Carta en español' } : {}) })
    if (!rutaTocada && sugeridos.includes(draft.name)) set({ ruta: idioma === 'en' ? 'englishmenu' : 'cartaenespanol' })
  }

  async function submit() {
    setTried(true)
    if (nameError || rutaError) {
      focusFirstInvalid()
      return
    }
    setBusy(true)
    try {
      await onSave({ ...draft, name: draft.name.trim(), titulo: draft.titulo?.trim() || null, subtitulo: draft.subtitulo?.trim() || null })
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      dirty={JSON.stringify(draft) !== JSON.stringify(initial)}
      title={initial.id ? 'Editar carta' : 'Nueva carta'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="ghost" className="text-peligro hover:bg-peligro/8 sm:mr-auto" onClick={onDelete}>
              <Trash2 size={18} /> Eliminar carta
            </Button>
          )}
          <CancelButton />
          <Button onClick={submit} busy={busy}>{initial.id ? 'Guardar cambios' : 'Crear carta'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Opciones
          legend="Idioma de la carta"
          columns={2}
          value={draft.idioma}
          onChange={cambiarIdioma}
          options={IDIOMAS}
        />
        <Field label="Nombre" hint="Así aparece en el selector de cartas de la página." error={tried ? nameError : ''}>
          <TextInput value={draft.name} onChange={(e) => cambiarNombre(e.target.value)} placeholder={draft.idioma === 'en' ? 'English menu' : 'Bebidas'} maxLength={40} />
        </Field>
        <Field label="Dirección" hint={`La carta queda en /${site.slug}/${draft.ruta || '…'}`} error={tried ? rutaError : ''}>
          <TextInput
            value={draft.ruta}
            onChange={(e) => {
              setRutaTocada(true)
              set({ ruta: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })
            }}
            placeholder="english-menu"
            autoCapitalize="off"
            maxLength={40}
          />
        </Field>
        <Field label="Título (opcional)" hint={draft.idioma === 'en' ? 'Si lo dejas vacío: «Our menu».' : `Si lo dejas vacío, se usa el nombre.`}>
          <TextInput value={draft.titulo ?? ''} onChange={(e) => set({ titulo: e.target.value })} placeholder={draft.idioma === 'en' ? 'Our menu' : draft.name} maxLength={60} />
        </Field>
        <Field label="Frase corta (opcional)" hint="Aparece debajo del título.">
          <TextArea rows={2} value={draft.subtitulo ?? ''} onChange={(e) => set({ subtitulo: e.target.value })} maxLength={160} />
        </Field>
        <Toggle checked={draft.is_active} onChange={(v) => set({ is_active: v })} label="Visible en la página" description="Si la ocultas, nadie la ve ni aparece en el selector; sus categorías se conservan." />
      </div>
    </Modal>
  )
}

export const cartaNueva = (): Draft<Carta> => ({ name: 'English menu', ruta: 'englishmenu', idioma: 'en', titulo: null, subtitulo: null, is_active: true })
