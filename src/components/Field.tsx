import { cloneElement, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type TextareaHTMLAttributes } from 'react'

const control =
  'w-full rounded-xl border border-linea bg-superficie px-3.5 py-2.5 text-base text-tinta sombra-panel transition-[border-color,box-shadow] duration-150 placeholder:text-gris/60 hover:border-tinta/25 focus:border-resalte focus:outline-none focus:ring-4 focus:ring-resalte/15 aria-invalid:border-peligro aria-invalid:ring-4 aria-invalid:ring-peligro/12'

type ControlProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }

/**
 * Etiqueta visible + campo + ayuda o error debajo.
 * La ayuda y el error quedan conectados al campo (aria-describedby) para lectores de pantalla.
 */
export function Field({ label, hint, error, prefix, children }: { label: string; hint?: string; error?: string; prefix?: string; children: ReactElement<ControlProps> }) {
  const id = useId()
  const noteId = `${id}-nota`
  const note = error || hint
  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-describedby': note ? noteId : undefined, 'aria-invalid': error ? true : undefined })
    : children

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.95rem] font-medium">{label}</label>
      {prefix ? (
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gris">{prefix}</span>
          {control}
        </div>
      ) : (
        control
      )}
      {error ? (
        <span id={noteId} role="alert" className="mt-1.5 block text-sm font-medium text-peligro">{error}</span>
      ) : (
        hint && <span id={noteId} className="mt-1.5 block text-sm text-gris">{hint}</span>
      )}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${control} resize-y ${props.className ?? ''}`} />
}

/** Lleva el foco al primer campo con error después de intentar guardar. */
export function focusFirstInvalid() {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('dialog[open] [aria-invalid=true], main [aria-invalid=true]')
    el?.focus()
  })
}
