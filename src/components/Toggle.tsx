import { useId } from 'react'

export default function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="flex-1">
        <span className="block font-medium">{label}</span>
        {description && <span className="block text-sm text-gris">{description}</span>}
      </label>
      <Switch id={id} checked={checked} onChange={onChange} />
    </div>
  )
}

/**
 * Interruptor. El área que se puede tocar es más grande que el dibujo (mínimo 44 px),
 * con márgenes negativos para no mover el diseño.
 */
export function Switch({ checked, onChange, label, small, id }: { checked: boolean; onChange: (value: boolean) => void; label?: string; small?: boolean; id?: string }) {
  return (
    <span className={`relative inline-flex shrink-0 ${small ? '-m-2.5 p-2.5' : '-m-2 p-2'}`} title={label}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-label={id ? undefined : label}
        aria-checked={checked}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`${small ? 'h-6 w-10' : 'h-7 w-12'} rounded-full bg-gris/40 shadow-[inset_0_1px_2px_rgb(0_0_0/.12)] transition-colors duration-200 ease-(--ease-salida) peer-checked:bg-exito peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-resalte`} />
      <span
        className={`pointer-events-none absolute ${small ? 'top-3.5 left-3.5 size-4 peer-checked:translate-x-4' : 'top-3 left-3 size-5 peer-checked:translate-x-5'} rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/.25)] transition-transform duration-200 ease-(--ease-salida)`}
      />
    </span>
  )
}
