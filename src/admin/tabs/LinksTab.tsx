import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Link } from '../../lib/supabase'
import { ICONS, Icon, resolveIcon } from '../../lib/icons'
import { Toggle, iconBtn, inputCls, primaryBtn } from '../ui'

const QUICK: { label: string; icon: string; placeholder: string }[] = [
  { label: 'Déjanos tu reseña en Google', icon: 'review', placeholder: 'https://g.page/r/...' },
  { label: 'WhatsApp', icon: 'whatsapp', placeholder: 'https://wa.me/573001234567' },
  { label: 'Instagram', icon: 'instagram', placeholder: 'https://instagram.com/usuario' },
  { label: 'Ubicación', icon: 'map', placeholder: 'https://maps.app.goo.gl/...' },
  { label: 'Facebook', icon: 'facebook', placeholder: 'https://facebook.com/pagina' },
  { label: 'TikTok', icon: 'tiktok', placeholder: 'https://tiktok.com/@usuario' },
]

export default function LinksTab({
  pageId,
  links,
  onChange,
  onDelete,
}: {
  pageId: string
  links: Link[]
  onChange: (links: Link[]) => void
  onDelete: (id: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function add(label = '', icon: string | null = null) {
    const link: Link = { id: crypto.randomUUID(), page_id: pageId, label, url: '', icon, position: 0, enabled: true }
    onChange([link, ...links])
  }

  function update(id: string, patch: Partial<Link>) {
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const from = links.findIndex((l) => l.id === e.active.id)
    const to = links.findIndex((l) => l.id === e.over!.id)
    onChange(arrayMove(links, from, to))
  }

  return (
    <div>
      <button className={`${primaryBtn} w-full py-3`} onClick={() => add()}>
        <Icon name="plus" size={18} /> Añadir enlace
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.icon}
            onClick={() => add(q.label, q.icon)}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-900"
          >
            <Icon name={q.icon} size={14} /> {q.label.replace('Déjanos tu reseña en Google', 'Reseñas Google')}
          </button>
        ))}
      </div>

      {links.length === 0 && <p className="mt-10 text-center text-sm text-stone-500">Todavía no hay enlaces. Añade el primero arriba.</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <ul className="mt-6 space-y-3">
            {links.map((l) => (
              <LinkRow key={l.id} link={l} onChange={(p) => update(l.id, p)} onDelete={() => onDelete(l.id)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function LinkRow({ link, onChange, onDelete }: { link: Link; onChange: (p: Partial<Link>) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })
  const placeholder = QUICK.find((q) => q.icon === link.icon)?.placeholder || 'https://...'
  const autoIcon = resolveIcon(null, link.url)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200 ${isDragging ? 'z-10 shadow-lg ring-stone-400' : ''} ${
        link.enabled ? '' : 'opacity-60'
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="flex w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 active:cursor-grabbing"
        title="Arrastra para ordenar"
      >
        <Icon name="grip" size={18} />
      </button>

      <div className="min-w-0 flex-1 space-y-2">
        <input className={inputCls} placeholder="Texto del botón" value={link.label} onChange={(e) => onChange({ label: e.target.value })} />
        <input
          className={`${inputCls} text-sm`}
          placeholder={placeholder}
          inputMode="url"
          value={link.url}
          onChange={(e) => onChange({ url: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-700"
            value={link.icon ?? ''}
            onChange={(e) => onChange({ icon: e.target.value || null })}
          >
            <option value="">Ícono automático ({ICONS[autoIcon || 'link']?.label})</option>
            {Object.entries(ICONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
            <option value="none">Sin ícono</option>
          </select>
          <span className="flex-1" />
          <Toggle checked={link.enabled} onChange={(v) => onChange({ enabled: v })} label="Mostrar enlace" />
          <button className={`${iconBtn} hover:text-red-600`} title="Eliminar" onClick={() => confirm('¿Eliminar este enlace?') && onDelete()}>
            <Icon name="trash" size={18} />
          </button>
        </div>
        {!link.url.trim() && <p className="text-xs text-amber-700">Falta pegar el link.</p>}
      </div>
    </li>
  )
}
