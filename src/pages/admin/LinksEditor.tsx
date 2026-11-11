import { BookOpen, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field, focusFirstInvalid, TextInput } from '../../components/Field'
import Modal, { Button, CancelButton, ConfirmDialog } from '../../components/Modal'
import SortableList, { MoveControls, moveInList, RowAction } from '../../components/SortableList'
import { Switch } from '../../components/Toggle'
import { isValidUrl, normalizeUrl } from '../../lib/format'
import { GRUPOS_ICONOS, guessIcon, iconoSeccion, ICONS, LinkIcon, type IconKey } from '../../lib/icons'
import type { Draft, LinkButton, LinkType } from '../../lib/types'
import { EmptyState, PageTitle } from './AdminApp'
import { useAdminList } from './useAdminList'
import { useAdminSite } from './contexto'

export default function LinksEditor() {
  const { m } = useAdminSite()
  const { rows, save, patch, remove, reorder } = useAdminList('links')
  const [editing, setEditing] = useState<Draft<LinkButton> | null>(null)
  const [deleting, setDeleting] = useState<LinkButton | null>(null)

  const blank: Draft<LinkButton> = { label: '', type: 'url', url: '', icon: 'link', is_active: true }

  return (
    <>
      <PageTitle
        title="Botones de inicio"
        description="Son los botones que la gente ve debajo de la foto. Arrástralos para cambiar el orden (o usa Subir y Bajar al editarlos); el interruptor los muestra u oculta."
        action={<Button onClick={() => setEditing(blank)}><Plus size={19} /> Agregar botón</Button>}
      />

      {rows && rows.length === 0 && <EmptyState>Todavía no hay botones. Agrega el primero, por ejemplo tu WhatsApp.</EmptyState>}

      {rows && (
        <SortableList
          items={rows}
          onReorder={reorder}
          renderItem={(link) => (
            <>
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${link.type === 'menu' ? 'bg-resalte/15 text-resalte' : 'bg-papel text-tinta'}`}>
                <LinkIcon name={link.icon} />
              </span>
              <button type="button" onClick={() => setEditing(link)} title={link.type === 'menu' ? link.label : `${link.label}\n${link.url}`} className="min-h-11 min-w-0 flex-1 px-2 text-left">
                <span className={`block line-clamp-2 leading-snug font-semibold [overflow-wrap:anywhere] ${link.is_active ? '' : 'text-gris line-through decoration-1'}`}>{link.label}</span>
                <span className="block truncate text-sm text-gris">{link.is_active ? '' : 'Oculto · '}{link.type === 'menu' ? `Abre ${m.el}` : link.url?.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </button>
              <Switch small checked={link.is_active} onChange={(v) => patch(link.id, { is_active: v }, v ? 'Botón visible' : 'Botón oculto')} label={link.is_active ? 'Visible. Toca para ocultar' : 'Oculto. Toca para mostrar'} />
              <RowAction label="Editar" onClick={() => setEditing(link)}><Pencil size={18} /></RowAction>
            </>
          )}
        />
      )}

      {editing && (
        <LinkForm
          initial={editing}
          onDelete={editing.id ? () => { setDeleting(editing as LinkButton); setEditing(null) } : undefined}
          move={editing.id && rows ? {
            index: rows.findIndex((r) => r.id === editing.id),
            total: rows.length,
            onMove: (direction) => {
              const next = moveInList(rows, editing.id!, direction)
              if (next) reorder(next)
            },
          } : undefined}
          onClose={() => setEditing(null)}
          onSave={async (draft) => {
            await save(draft, draft.id ? 'Botón guardado' : 'Botón agregado')
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar este botón?"
        message={`"${deleting?.label}" desaparecerá de la página. Si solo quieres esconderlo por un tiempo, usa el interruptor.`}
        confirmLabel="Eliminar botón"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove(deleting.id, 'Botón eliminado')
          setDeleting(null)
        }}
      />
    </>
  )
}

function LinkForm({ initial, onSave, onClose, onDelete, move }: { initial: Draft<LinkButton>; onSave: (draft: Draft<LinkButton>) => Promise<void>; onClose: () => void; onDelete?: () => void; move?: { index: number; total: number; onMove: (direction: -1 | 1) => void } }) {
  const { m, site } = useAdminSite()
  const [draft, setDraft] = useState(initial)
  const [iconTouched, setIconTouched] = useState(!!initial.id)
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)

  const set = (fields: Partial<Draft<LinkButton>>) => setDraft((d) => ({ ...d, ...fields }))

  const labelError = !draft.label.trim() ? 'Escribe el texto del botón.' : ''
  const urlError = draft.type === 'url' && !isValidUrl(draft.url ?? '') ? 'Pega un enlace válido, por ejemplo wa.me/573001234567' : ''

  function chooseType(type: LinkType) {
    const seccion = iconoSeccion(site.vocab.tipo)
    set(type === 'menu' ? { type, url: null, icon: seccion, label: draft.label || m.boton } : { type, url: draft.url ?? '', icon: draft.icon === seccion ? 'link' : draft.icon })
  }

  function changeUrl(url: string) {
    const guessed = !iconTouched ? guessIcon(url) : null
    set({ url, ...(guessed ? { icon: guessed } : {}) })
  }

  async function submit() {
    setTried(true)
    if (labelError || urlError) {
      focusFirstInvalid()
      return
    }
    setBusy(true)
    try {
      await onSave({ ...draft, label: draft.label.trim(), url: draft.type === 'url' ? normalizeUrl(draft.url ?? '') : null })
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      dirty={JSON.stringify(draft) !== JSON.stringify(initial)}
      title={initial.id ? 'Editar botón' : 'Nuevo botón'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="ghost" className="text-peligro hover:bg-peligro/8 sm:mr-auto" onClick={onDelete}>
              <Trash2 size={18} /> Eliminar botón
            </Button>
          )}
          <CancelButton />
          <Button onClick={submit} busy={busy}>{initial.id ? 'Guardar cambios' : 'Agregar botón'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 font-medium">¿Qué hace este botón?</legend>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['url', 'Abre un enlace', 'WhatsApp, Instagram, mapa…', Link2],
              ['menu', `Abre ${m.el}`, 'La sección de esta página', BookOpen],
            ] as const).map(([type, title, hint, Icon]) => (
              <button
                key={type}
                type="button"
                onClick={() => chooseType(type)}
                aria-pressed={draft.type === type}
                className={`presion-suave rounded-2xl border-2 p-3.5 text-left ${draft.type === type ? 'border-resalte bg-resalte/10' : 'border-linea hover:border-tinta/30'}`}
              >
                <Icon size={20} />
                <span className="mt-2 block font-semibold">{title}</span>
                <span className="block text-sm text-gris">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Texto del botón" error={tried ? labelError : ''}>
          <TextInput value={draft.label} onChange={(e) => set({ label: e.target.value })} placeholder={m.ejemplos.boton} maxLength={60} />
        </Field>

        {draft.type === 'url' && (
          <Field label="Enlace" hint="Copia y pega la dirección completa." error={tried ? urlError : ''}>
            <TextInput value={draft.url ?? ''} onChange={(e) => changeUrl(e.target.value)} placeholder="https://wa.me/573001234567" inputMode="url" autoCapitalize="off" />
          </Field>
        )}

        <fieldset>
          <legend className="mb-2 font-medium">Ícono</legend>
          {GRUPOS_ICONOS.map((grupo) => (
            <div key={grupo} className="mb-3">
              <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-gris uppercase">{grupo}</h3>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                {(Object.keys(ICONS) as IconKey[]).filter((key) => ICONS[key].grupo === grupo).map((key) => (
                  <button
                    key={key}
                    type="button"
                    title={ICONS[key].label}
                    aria-label={ICONS[key].label}
                    aria-pressed={draft.icon === key}
                    onClick={() => {
                      setIconTouched(true)
                      set({ icon: key })
                    }}
                    className={`grid aspect-square place-items-center rounded-xl border-2 transition ${draft.icon === key ? 'border-resalte bg-resalte/12' : 'border-transparent bg-papel hover:border-linea'}`}
                  >
                    <LinkIcon name={key} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        {move && <MoveControls {...move} />}
      </div>
    </Modal>
  )
}
