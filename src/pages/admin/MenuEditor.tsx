import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Field, focusFirstInvalid, TextArea, TextInput } from '../../components/Field'
import ImageUpload from '../../components/ImageUpload'
import Modal, { Button, CancelButton, ConfirmDialog } from '../../components/Modal'
import SortableList, { MoveControls, moveInList, RowAction } from '../../components/SortableList'
import { Switch } from '../../components/Toggle'
import { alOriginal, miniatura } from '../../lib/medios'
import type { Carta, Category, Draft } from '../../lib/types'
import { EmptyState, PageTitle } from './AdminApp'
import { cartaNueva, CartaForm, SelectorCartas } from './Cartas'
import { useAdminList } from './useAdminList'
import { useAdminSite } from './contexto'

export default function MenuEditor() {
  const { m, base } = useAdminSite()
  const allCategories = useAdminList('menu_categories')
  const items = useAdminList('menu_items')
  const cartas = useAdminList('menus')
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Draft<Category> | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [editingCarta, setEditingCarta] = useState<Draft<Carta> | null>(null)
  const [deletingCarta, setDeletingCarta] = useState<Carta | null>(null)

  // La carta que se edita va en la dirección (?carta=<id>): al volver de una categoría sigue elegida.
  const pedida = params.get('carta')
  const carta = cartas.rows?.find((c) => c.id === pedida) ?? null
  const elegir = (id: string | null) => setParams(id ? { carta: id } : {}, { replace: true })
  const rows = allCategories.rows?.filter((c) => (c.menu_id ?? null) === (carta?.id ?? null)) ?? null
  const categories = { ...allCategories, rows }

  const countFor = (id: string) => items.rows?.filter((i) => i.category_id === id).length ?? 0
  const deletingCount = deleting ? countFor(deleting.id) : 0
  const categoriasDe = (id: string) => allCategories.rows?.filter((c) => c.menu_id === id) ?? []
  const deletingCartaCount = deletingCarta ? categoriasDe(deletingCarta.id).length : 0

  return (
    <>
      <PageTitle
        title={m.seccion}
        description={`Cada categoría es un botón ${m.en}. Entra a una para agregar o editar sus ${m.varios}.`}
        action={<Button onClick={() => setEditing({ name: '', description: '', emoji: '', image_url: null, is_active: true, ...(carta ? { menu_id: carta.id } : {}) })}><Plus size={19} /> Agregar categoría</Button>}
      />

      {cartas.rows && (
        <SelectorCartas
          cartas={cartas.rows}
          actual={carta?.id ?? null}
          onElegir={elegir}
          onNueva={() => setEditingCarta(cartaNueva())}
          onEditar={(c) => setEditingCarta(c)}
        />
      )}

      {categories.rows && categories.rows.length === 0 && (
        <EmptyState>
          {carta
            ? `«${carta.name}» todavía no tiene categorías. Crea la primera o importa la carta desde Ajustes.`
            : `${m.el[0].toUpperCase() + m.el.slice(1)} está ${m.el.startsWith('la') ? 'vacía' : 'vacío'}. Empieza creando una categoría, por ejemplo «${m.ejemplos.categoria}».`}
        </EmptyState>
      )}

      {categories.rows && (
        <SortableList
          items={categories.rows}
          onReorder={categories.reorder}
          renderItem={(category) => {
            const count = countFor(category.id)
            return (
              <>
                <Link to={`${base}/catalogo/${category.id}`} title={category.name} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-papel">
                  {category.image_url ? (
                    <img src={miniatura(category.image_url)} onError={alOriginal(category.image_url)} alt="" loading="lazy" className="size-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-papel text-xl">{category.emoji || '🍽️'}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={`block line-clamp-2 leading-snug font-semibold [overflow-wrap:anywhere] ${category.is_active ? '' : 'text-gris line-through decoration-1'}`}>{category.name}</span>
                    <span className="block text-sm text-gris">{count === 0 ? `Sin ${m.varios} todavía` : `${count} ${count === 1 ? m.uno : m.varios}`}{category.is_active ? '' : ' · oculta'}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-gris" />
                </Link>
                <Switch small checked={category.is_active} onChange={(v) => categories.patch(category.id, { is_active: v }, v ? 'Categoría visible' : 'Categoría oculta')} label={category.is_active ? 'Visible. Toca para ocultar' : 'Oculta. Toca para mostrar'} />
                <RowAction label="Editar categoría" onClick={() => setEditing(category)}><Pencil size={18} /></RowAction>
              </>
            )
          }}
        />
      )}

      {editing && (
        <CategoryForm
          initial={editing}
          onDelete={editing.id ? () => { setDeleting(editing as Category); setEditing(null) } : undefined}
          move={editing.id && categories.rows ? {
            index: categories.rows.findIndex((r) => r.id === editing.id),
            total: categories.rows.length,
            onMove: (direction) => {
              const next = moveInList(categories.rows!, editing.id!, direction)
              if (next) categories.reorder(next)
            },
          } : undefined}
          onClose={() => setEditing(null)}
          onSave={async (draft) => {
            await categories.save(draft, draft.id ? 'Categoría guardada' : 'Categoría agregada')
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar esta categoría?"
        message={
          deletingCount > 0
            ? `"${deleting?.name}", sus subcategorías y sus ${deletingCount} ${m.varios} se borrarán para siempre. Si solo quieres esconderla, usa el interruptor.`
            : `"${deleting?.name}" se borrará ${m.del}.`
        }
        confirmLabel="Eliminar categoría"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await categories.remove(deleting.id, 'Categoría eliminada')
            items.reload()
          }
          setDeleting(null)
        }}
      />

      {editingCarta && cartas.rows && (
        <CartaForm
          initial={editingCarta}
          cartas={cartas.rows}
          onDelete={editingCarta.id ? () => { setDeletingCarta(editingCarta as Carta); setEditingCarta(null) } : undefined}
          onClose={() => setEditingCarta(null)}
          onSave={async (draft) => {
            const saved = await cartas.save(draft, draft.id ? 'Carta guardada' : 'Carta creada')
            setEditingCarta(null)
            elegir(saved.id)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingCarta}
        title="¿Eliminar esta carta?"
        message={
          deletingCartaCount > 0
            ? `«${deletingCarta?.name}» y ${deletingCartaCount === 1 ? 'su categoría' : `sus ${deletingCartaCount} categorías`} (con tod${m.o}s sus ${m.varios}) se borrarán para siempre. Los botones que la abrían pasarán a abrir ${m.el} principal. Si solo quieres esconderla, desactiva «Visible en la página».`
            : `«${deletingCarta?.name}» se borrará. Los botones que la abrían pasarán a abrir ${m.el} principal.`
        }
        confirmLabel="Eliminar carta"
        onClose={() => setDeletingCarta(null)}
        onConfirm={async () => {
          if (deletingCarta) {
            await cartas.remove(deletingCarta.id, 'Carta eliminada')
            elegir(null)
            allCategories.reload()
            items.reload()
          }
          setDeletingCarta(null)
        }}
      />
    </>
  )
}

const EMOJIS = ['🥗', '🍔', '🍕', '🌮', '🍝', '🍣', '🥩', '🍗', '🔥', '🐟', '🦐', '🦞', '🦑', '🥟', '🍰', '🍨', '☕', '🍹', '🍺', '🍷', '🥤', '🧊', '🛒', '📦', '⭐', '🎁', '🌱', '🍋', '🥔', '🐔', '🥓', '🧂']

export function CategoryForm({ initial, onSave, onClose, onDelete, move }: { initial: Draft<Category>; onSave: (draft: Draft<Category>) => Promise<void>; onClose: () => void; onDelete?: () => void; move?: { index: number; total: number; onMove: (direction: -1 | 1) => void } }) {
  const { m, site } = useAdminSite()
  const [draft, setDraft] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const set = (fields: Partial<Draft<Category>>) => setDraft((d) => ({ ...d, ...fields }))
  const nameError = draft.name.trim() ? '' : 'Escribe el nombre de la categoría.'

  async function submit() {
    setTried(true)
    if (nameError) {
      focusFirstInvalid()
      return
    }
    setBusy(true)
    try {
      await onSave({ ...draft, name: draft.name.trim(), description: draft.description?.trim() || null, emoji: draft.emoji || null })
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      dirty={JSON.stringify(draft) !== JSON.stringify(initial)}
      title={initial.id ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="ghost" className="text-peligro hover:bg-peligro/8 sm:mr-auto" onClick={onDelete}>
              <Trash2 size={18} /> Eliminar categoría
            </Button>
          )}
          <CancelButton />
          <Button onClick={submit} busy={busy}>{initial.id ? 'Guardar cambios' : 'Agregar categoría'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Nombre" error={tried ? nameError : ''}>
          <TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder={m.ejemplos.categoria} maxLength={40} />
        </Field>
        <div>
          <span className="mb-1.5 block font-medium">Foto de portada</span>
          <ImageUpload wide siteId={site.id} folder="categories" value={draft.image_url ?? null} onChange={(url) => set({ image_url: url })} />
          <span className="mt-1.5 block text-sm text-gris">Se ve grande {m.en}. Usa una foto horizontal y bien iluminada. Si no subes una, se usa la {m.delProducto.startsWith('de la') ? 'de la primera' : 'del primer'} {m.uno} con foto.</span>
        </div>
        <Field label="Descripción (opcional)" hint={`Una línea corta que aparece arriba de los ${m.varios}.`}>
          <TextArea rows={2} value={draft.description ?? ''} onChange={(e) => set({ description: e.target.value })} maxLength={160} />
        </Field>
        <fieldset>
          <legend className="mb-2 font-medium">Emoji (opcional)</legend>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-pressed={draft.emoji === emoji}
                onClick={() => set({ emoji: draft.emoji === emoji ? '' : emoji })}
                className={`grid aspect-square place-items-center rounded-xl border-2 text-xl transition ${draft.emoji === emoji ? 'border-resalte bg-resalte/12' : 'border-transparent bg-papel hover:border-linea'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </fieldset>
        {move && <MoveControls {...move} />}
      </div>
    </Modal>
  )
}
