import { ChevronLeft, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Field, focusFirstInvalid, TextArea, TextInput } from '../../components/Field'
import ImageUpload from '../../components/ImageUpload'
import Modal, { Button, CancelButton, ConfirmDialog } from '../../components/Modal'
import SortableList, { MoveControls, moveInList, RowAction } from '../../components/SortableList'
import Toggle, { Switch } from '../../components/Toggle'
import { formatPrice, parsePrice, priceText, UNITS } from '../../lib/format'
import type { Category, Draft, MenuItem, Subcategory } from '../../lib/types'
import { EmptyState } from './AdminApp'
import { useAdminSite } from './contexto'
import { CategoryForm } from './MenuEditor'
import { useAdminList } from './useAdminList'

const selectClass = 'w-full rounded-xl border border-linea bg-superficie px-4 py-3 text-base focus:border-tinta focus:outline-none'

export default function CategoryEditor() {
  const { m, base } = useAdminSite()
  const { categoryId } = useParams()
  const categories = useAdminList('menu_categories')
  const subcategories = useAdminList('menu_subcategories')
  const items = useAdminList('menu_items')
  const [editing, setEditing] = useState<Draft<MenuItem> | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState(false)
  const [editingSub, setEditingSub] = useState<Draft<Subcategory> | null>(null)
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null)

  const category = categories.rows?.find((c) => c.id === categoryId)
  // Volver a la carta de esta categoría (la principal no lleva ?carta).
  const volver = `${base}/catalogo${category?.menu_id ? `?carta=${category.menu_id}` : ''}`
  const subs = subcategories.rows?.filter((s) => s.category_id === categoryId) ?? []
  const list = items.rows?.filter((i) => i.category_id === categoryId) ?? null

  if (categories.rows && !category) {
    return (
      <EmptyState>
        Esta categoría ya no existe. <Link to={`${base}/catalogo`} className="font-semibold text-tinta underline">Volver a {m.el}</Link>
      </EmptyState>
    )
  }

  // Un grupo por subcategoría; primero los productos que no tienen (o cuya subcategoría ya no existe).
  const known = new Set(subs.map((s) => s.id))
  const loose = list?.filter((i) => !i.subcategory_id || !known.has(i.subcategory_id)) ?? []
  const groups = list
    ? [
        ...(subs.length === 0 || loose.length > 0 ? [{ sub: null, rows: loose }] : []),
        ...subs.map((sub) => ({ sub, rows: list.filter((i) => i.subcategory_id === sub.id) })),
      ]
    : null
  const groupOf = (item: Draft<MenuItem>) => groups?.find((g) => g.rows.some((r) => r.id === item.id))?.rows ?? []
  const countIn = (id: string) => list?.filter((i) => i.subcategory_id === id).length ?? 0
  const deletingSubCount = deletingSub ? countIn(deletingSub.id) : 0

  const blank = (subcategory_id: string | null = null): Draft<MenuItem> => ({
    category_id: categoryId!, subcategory_id, name: '', description: '', price: 0, unit: m.unidadPorDefecto, image_url: null, is_available: true, is_active: true,
  })

  return (
    <>
      <Link to={volver} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-gris hover:text-tinta">
        <ChevronLeft size={18} /> Todas las categorías
      </Link>

      <div className="mt-2 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-ui-display text-[2rem] leading-tight">
            {category?.emoji && <span aria-hidden>{category.emoji}</span>}
            <span className="truncate">{category?.name ?? ' '}</span>
          </h1>
          <button type="button" onClick={() => setEditingCategory(true)} className="mt-1 -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-gris transition-colors hover:bg-superficie hover:text-tinta">
            <Pencil size={14} /> Editar nombre y descripción
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditingSub({ category_id: categoryId!, name: '' })}><FolderPlus size={19} /> Subcategoría</Button>
          <Button onClick={() => setEditing(blank())}><Plus size={19} /> Agregar {m.uno}</Button>
        </div>
      </div>

      {subs.length === 0 && list && list.length > 3 && (
        <p className="mb-4 text-sm text-gris">¿Muchos {m.varios}? Agrúpalos con subcategorías, por ejemplo «{m.ejemplos.subcategoria}». {m.en[0].toUpperCase() + m.en.slice(1)} salen como secciones.</p>
      )}

      {list && list.length === 0 && subs.length === 0 && <EmptyState>Esta categoría no tiene {m.varios}. Mientras esté vacía no aparece {m.en}.</EmptyState>}

      <div className="flex flex-col gap-8">
        {groups?.map(({ sub, rows }) => (
          <section key={sub?.id ?? 'sin-subcategoria'} aria-label={sub?.name ?? 'Sin subcategoría'}>
            {subs.length > 0 && (
              <div className="mb-2 flex items-center gap-2">
                <h2 className={`min-w-0 font-ui-display text-[1.5rem] leading-tight [overflow-wrap:anywhere] ${sub ? '' : 'text-gris'}`}>{sub?.name ?? 'Sin subcategoría'}</h2>
                <span className="shrink-0 text-sm text-gris">{rows.length} {rows.length === 1 ? m.uno : m.varios}</span>
                {sub && (
                  <span className="ml-auto flex shrink-0 gap-1">
                    <RowAction label={`Agregar ${m.uno} en ${sub.name}`} onClick={() => setEditing(blank(sub.id))}><Plus size={18} /></RowAction>
                    <RowAction label={`Editar subcategoría ${sub.name}`} onClick={() => setEditingSub(sub)}><Pencil size={18} /></RowAction>
                  </span>
                )}
              </div>
            )}
            {sub && rows.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-linea px-4 py-5 text-center text-sm text-gris">Vacía: no aparece {m.en} hasta que le agregues {m.varios}.</p>
            )}
            {rows.length > 0 && (
              <SortableList
                items={rows}
                onReorder={items.reorder}
                renderItem={(item) => (
                  <>
                    <button type="button" onClick={() => setEditing(item)} title={item.name} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 text-left transition-colors hover:bg-papel">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="size-12 shrink-0 rounded-xl bg-papel" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={`block line-clamp-2 leading-snug font-semibold [overflow-wrap:anywhere] ${item.is_active ? '' : 'text-gris line-through decoration-1'}`}>{item.name}</span>
                        <span className="flex flex-wrap items-center gap-x-2 text-sm text-gris">
                          <span className="tabular-nums">{priceText(item.price, item.unit)}</span>
                          {!item.is_available && <span className="rounded-full bg-peligro/10 px-2 text-xs font-semibold text-peligro">Agotado</span>}
                          {!item.is_active && <span className="text-xs">Oculto</span>}
                        </span>
                      </span>
                    </button>
                    <Switch small checked={item.is_active} onChange={(v) => items.patch(item.id, { is_active: v }, `${m.Uno} ${v ? 'visible' : `ocult${m.o}`}`)} label={item.is_active ? 'Visible. Toca para ocultar' : 'Oculto. Toca para mostrar'} />
                    <RowAction label={`Editar ${m.uno}`} onClick={() => setEditing(item)}><Pencil size={18} /></RowAction>
                  </>
                )}
              />
            )}
          </section>
        ))}
      </div>

      {editing && categories.rows && subcategories.rows && (
        <ItemForm
          initial={editing}
          categories={categories.rows}
          subcategories={subcategories.rows}
          onDelete={editing.id ? () => { setDeleting(editing as MenuItem); setEditing(null) } : undefined}
          move={editing.id ? {
            index: groupOf(editing).findIndex((r) => r.id === editing.id),
            total: groupOf(editing).length,
            onMove: (direction) => {
              const next = moveInList(groupOf(editing), editing.id!, direction)
              if (next) items.reorder(next)
            },
          } : undefined}
          onClose={() => setEditing(null)}
          onSave={async (draft) => {
            await items.save(draft, `${m.Uno} ${draft.id ? 'guardad' : 'agregad'}${m.o}`)
            setEditing(null)
          }}
        />
      )}

      {editingCategory && category && (
        <CategoryForm
          initial={category}
          onClose={() => setEditingCategory(false)}
          onSave={async (draft) => {
            await categories.save(draft, 'Categoría guardada')
            setEditingCategory(false)
          }}
        />
      )}

      {editingSub && (
        <SubcategoryForm
          initial={editingSub}
          onDelete={editingSub.id ? () => { setDeletingSub(editingSub as Subcategory); setEditingSub(null) } : undefined}
          move={editingSub.id ? {
            index: subs.findIndex((s) => s.id === editingSub.id),
            total: subs.length,
            onMove: (direction) => {
              const next = moveInList(subs, editingSub.id!, direction)
              if (next) subcategories.reorder(next)
            },
          } : undefined}
          onClose={() => setEditingSub(null)}
          onSave={async (draft) => {
            await subcategories.save(draft, draft.id ? 'Subcategoría guardada' : 'Subcategoría agregada')
            setEditingSub(null)
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`¿Eliminar ${m.este} ${m.uno}?`}
        message={`"${deleting?.name}" se borrará ${m.del}. Si solo se acabó, márcal${m.o} como agotad${m.o}.`}
        confirmLabel={`Eliminar ${m.uno}`}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) items.remove(deleting.id, `${m.Uno} eliminad${m.o}`)
          setDeleting(null)
        }}
      />

      <ConfirmDialog
        open={!!deletingSub}
        title="¿Eliminar esta subcategoría?"
        message={
          deletingSubCount > 0
            ? `Se quita la sección "${deletingSub?.name}". ${deletingSubCount === 1 ? `Su ${m.uno} no se borra: queda` : `Sus ${deletingSubCount} ${m.varios} no se borran: quedan`} en la categoría, sin subcategoría.`
            : `Se quita la sección "${deletingSub?.name}".`
        }
        confirmLabel="Eliminar subcategoría"
        onClose={() => setDeletingSub(null)}
        onConfirm={async () => {
          if (deletingSub) {
            await subcategories.remove(deletingSub.id, 'Subcategoría eliminada')
            items.reload()
          }
          setDeletingSub(null)
        }}
      />
    </>
  )
}

function SubcategoryForm({ initial, onSave, onClose, onDelete, move }: {
  initial: Draft<Subcategory>
  onSave: (draft: Draft<Subcategory>) => Promise<void>
  onClose: () => void
  onDelete?: () => void
  move?: { index: number; total: number; onMove: (direction: -1 | 1) => void }
}) {
  const { m } = useAdminSite()
  const [name, setName] = useState(initial.name)
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const nameError = name.trim() ? '' : 'Escribe el nombre de la subcategoría.'

  async function submit() {
    setTried(true)
    if (nameError) {
      focusFirstInvalid()
      return
    }
    setBusy(true)
    try {
      await onSave({ ...initial, name: name.trim() })
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      dirty={name !== initial.name}
      title={initial.id ? 'Editar subcategoría' : 'Nueva subcategoría'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="ghost" className="text-peligro hover:bg-peligro/8 sm:mr-auto" onClick={onDelete}>
              <Trash2 size={18} /> Eliminar
            </Button>
          )}
          <CancelButton />
          <Button onClick={submit} busy={busy}>{initial.id ? 'Guardar cambios' : 'Agregar subcategoría'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Nombre" hint="Sale como título de sección dentro de la categoría." error={tried ? nameError : ''}>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            placeholder={m.ejemplos.subcategoria}
            maxLength={40}
          />
        </Field>
        {move && <MoveControls {...move} />}
      </div>
    </Modal>
  )
}

function ItemForm({ initial, categories, subcategories, onSave, onClose, onDelete, move }: {
  initial: Draft<MenuItem>
  categories: Category[]
  subcategories: Subcategory[]
  onSave: (draft: Draft<MenuItem>) => Promise<void>
  onClose: () => void
  onDelete?: () => void
  move?: { index: number; total: number; onMove: (direction: -1 | 1) => void }
}) {
  const { m, site } = useAdminSite()
  const [draft, setDraft] = useState(initial)
  const [priceInput, setPriceInput] = useState(initial.price ? formatPrice(initial.price).slice(1) : '')
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const set = (fields: Partial<Draft<MenuItem>>) => setDraft((d) => ({ ...d, ...fields }))
  const subsOfCategory = subcategories.filter((s) => s.category_id === draft.category_id)
  // Si el producto ya tenía una unidad que se desactivó en Ajustes, se sigue mostrando para poder quitarla.
  const unidades = draft.unit && !m.unidades.includes(draft.unit) ? [...m.unidades, draft.unit] : m.unidades

  const nameError = draft.name.trim() ? '' : `Escribe el nombre ${m.delProducto}.`

  function changePrice(text: string) {
    const value = parsePrice(text)
    setPriceInput(value ? formatPrice(value).slice(1) : '')
    set({ price: value })
  }

  async function submit() {
    setTried(true)
    if (nameError) {
      focusFirstInvalid()
      return
    }
    setBusy(true)
    try {
      await onSave({ ...draft, name: draft.name.trim(), description: draft.description?.trim() || null })
    } catch {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      dirty={JSON.stringify(draft) !== JSON.stringify(initial)}
      title={initial.id ? `Editar ${m.uno}` : `${m.nuevo} ${m.uno}`}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="ghost" className="text-peligro hover:bg-peligro/8 sm:mr-auto" onClick={onDelete}>
              <Trash2 size={18} /> Eliminar {m.uno}
            </Button>
          )}
          <CancelButton />
          <Button onClick={submit} busy={busy}>{initial.id ? 'Guardar cambios' : `Agregar ${m.uno}`}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Nombre" error={tried ? nameError : ''}>
          <TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder={m.ejemplos.producto} maxLength={70} />
        </Field>
        <Field label="Descripción (opcional)" hint={m.ejemplos.descripcionProducto}>
          <TextArea value={draft.description ?? ''} onChange={(e) => set({ description: e.target.value })} maxLength={240} />
        </Field>
        <Field label="Precio" prefix="$" hint="Si lo dejas vacío, se muestra «Consultar precio».">
          <TextInput value={priceInput} onChange={(e) => changePrice(e.target.value)} inputMode="numeric" placeholder="25.000" className="pl-8 tabular-nums" />
        </Field>
        {unidades.length > 0 && (
          <fieldset>
            <legend className="mb-2 font-medium">Precio por</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[...unidades, null].map((u) => (
                <button
                  key={u ?? 'ninguna'}
                  type="button"
                  aria-pressed={(draft.unit ?? null) === u}
                  onClick={() => set({ unit: u })}
                  className={`min-h-11 rounded-xl border-2 px-3 text-sm font-semibold transition-colors ${(draft.unit ?? null) === u ? 'border-resalte bg-resalte/12' : 'border-linea hover:border-tinta/30'}`}
                >
                  {u ? UNITS[u].long : 'No indicar'}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <div>
          <span className="mb-1.5 block font-medium">Foto (opcional)</span>
          <ImageUpload siteId={site.id} folder="items" value={draft.image_url} onChange={(url) => set({ image_url: url })} />
        </div>
        <div className="divide-y divide-linea rounded-2xl border border-linea px-4">
          <Toggle label={m.disponible.etiqueta} description={m.disponible.ayuda} checked={draft.is_available} onChange={(v) => set({ is_available: v })} />
          <Toggle label={`Mostrar ${m.en}`} description="Apágalo para esconderlo sin borrarlo." checked={draft.is_active} onChange={(v) => set({ is_active: v })} />
        </div>
        {subsOfCategory.length > 0 && (
          <Field label="Subcategoría" hint="La sección donde aparece dentro de la categoría.">
            <select value={draft.subcategory_id ?? ''} onChange={(e) => set({ subcategory_id: e.target.value || null })} className={selectClass}>
              <option value="">Sin subcategoría</option>
              {subsOfCategory.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}
        {categories.length > 1 && (
          <Field label="Categoría">
            <select
              value={draft.category_id}
              // Las subcategorías son de cada categoría: al cambiarla, el producto queda sin subcategoría.
              onChange={(e) => set({ category_id: e.target.value, subcategory_id: null })}
              className={selectClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        )}
        {move && <MoveControls {...move} />}
      </div>
    </Modal>
  )
}
