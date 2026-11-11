import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import Modal from '../../components/Modal'
import { cargarHoja, FUENTES, GRUPOS, pilaDe, urlMuestras } from '../../lib/fuentes'
import { normalizarHex, variablesDe } from '../../lib/tema'
import type { Theme } from '../../lib/types'

/**
 * Caja con los colores y letras de la página (sus variables CSS), para mostrar muestras reales
 * de botones, aros o efectos dentro del panel sin afectar el resto del panel.
 */
export function Lienzo({ theme, className = '', children }: { theme: Theme; className?: string; children: ReactNode }) {
  return (
    <div aria-hidden className={`relative overflow-hidden ${className}`} style={{ ...variablesDe(theme), background: 'var(--color-noche)', color: 'var(--color-cal)', fontFamily: 'var(--font-sans)' } as CSSProperties}>
      {children}
    </div>
  )
}

/** Selector de color: muestra con el selector del sistema + campo para escribir el código (#1f4fd1). */
export function ColorField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (hex: string) => void }) {
  const id = useId()
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const invalid = normalizarHex(text) === null

  return (
    <div className="flex items-center gap-3 py-2.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label}: elegir color`}
        className="size-11 shrink-0 cursor-pointer rounded-xl border border-linea bg-transparent p-1 [&::-moz-color-swatch]:rounded-lg [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
      />
      <label htmlFor={id} className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-gris">{hint}</span>}
      </label>
      <input
        id={id}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const hex = normalizarHex(e.target.value)
          if (hex) onChange(hex)
        }}
        onBlur={() => setText(value)}
        aria-invalid={invalid || undefined}
        spellCheck={false}
        autoCapitalize="off"
        maxLength={7}
        className="w-[6.5rem] shrink-0 rounded-xl border border-linea bg-superficie px-3 py-2.5 font-mono text-sm uppercase focus:border-tinta focus:outline-none aria-invalid:border-peligro"
      />
    </div>
  )
}

/** Botones de opción única (como radios, pero grandes y tocables). */
export function Opciones<T extends string | number>({ legend, value, onChange, options, columns = 3 }: {
  legend: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; hint?: string; preview?: ReactNode }[]
  columns?: 2 | 3 | 4
}) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[columns]
  return (
    <fieldset>
      <legend className="mb-2 text-[0.95rem] font-medium">{legend}</legend>
      <div className={`grid gap-2 ${cols}`}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`relative rounded-2xl border p-3 text-left ${value === o.value ? 'border-resalte bg-resalte/8 ring-2 ring-resalte/25' : 'border-linea hover:border-tinta/25 hover:bg-papel/50'}`}
          >
            {o.preview}
            <span className="block font-semibold">{o.label}</span>
            {o.hint && <span className="block text-sm text-gris">{o.hint}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Deslizador de 0 a 100 con el valor a la vista. */
export function Rango({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (value: number) => void }) {
  const id = useId()
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium">{label}</label>
        <span className="text-sm text-gris tabular-nums">{value}%</span>
      </div>
      {hint && <p className="text-sm text-gris">{hint}</p>}
      <input id={id} type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 h-11 w-full accent-[var(--color-resalte)]" />
    </div>
  )
}

/** Elegir una fuente viéndolas todas escritas con su propia letra. */
export function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (nombre: string) => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (open) cargarHoja(urlMuestras())
  }, [open])

  return (
    <div className="py-2">
      <span className="mb-1.5 block font-medium">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="sombra-panel flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-linea bg-superficie px-4 text-left hover:border-tinta/25"
      >
        <span className="truncate text-lg" style={{ fontFamily: pilaDe(value) }}>{value}</span>
        <ChevronDown size={18} className="shrink-0 text-gris" aria-hidden />
      </button>
      {open && (
        <Modal open title={label} onClose={() => setOpen(false)}>
          <div className="space-y-5">
            {GRUPOS.map((grupo) => (
              <section key={grupo} aria-label={grupo}>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wider text-gris uppercase">{grupo}</h3>
                <ul className="grid gap-1">
                  {FUENTES.filter((f) => f.grupo === grupo).map((f) => (
                    <li key={f.nombre}>
                      <button
                        type="button"
                        aria-pressed={f.nombre === value}
                        onClick={() => {
                          onChange(f.nombre)
                          setOpen(false)
                        }}
                        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left transition-colors ${f.nombre === value ? 'bg-resalte/12' : 'hover:bg-papel'}`}
                      >
                        <span className="truncate text-[1.35rem]" style={{ fontFamily: pilaDe(f.nombre) }}>{f.nombre}</span>
                        {f.nombre === value && <Check size={18} className="shrink-0 text-resalte" aria-label="Elegida" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
