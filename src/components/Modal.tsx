import { X } from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Si hay cambios sin guardar, pregunta antes de cerrar. */
  dirty?: boolean
  /** Ventana más ancha en computador (para listas con miniaturas). */
  wide?: boolean
}

const CloseContext = createContext<() => void>(() => {})

/** Hoja que sube desde abajo en celular y ventana centrada en computador. */
export default function Modal({ open, title, onClose, children, footer, dirty, wide }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  const requestClose = () => (dirty ? setAsking(true) : onClose())

  return (
    <dialog
      ref={dialog}
      aria-labelledby="modal-titulo"
      onCancel={(e) => {
        e.preventDefault()
        if (asking) setAsking(false)
        else requestClose()
      }}
      onClick={(e) => e.target === dialog.current && requestClose()}
      className={`modal m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-[1.75rem] border border-linea bg-superficie p-0 text-tinta shadow-2xl backdrop:bg-black/55 backdrop:backdrop-blur-[2px] sm:m-auto sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
    >
      {open && (
        <CloseContext.Provider value={requestClose}>
          <div className="relative flex max-h-[92dvh] flex-col">
            {/* Asa de la hoja en celular: indica que es una hoja que se puede cerrar. */}
            <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-linea sm:hidden" />
            <header className="flex items-center justify-between gap-4 py-2.5 pr-3 pl-6 sm:pt-4">
              <h2 id="modal-titulo" className="font-ui-display text-[1.45rem] leading-tight">{title}</h2>
              <button type="button" onClick={requestClose} className="grid size-10 place-items-center rounded-full bg-papel text-gris hover:text-tinta" aria-label="Cerrar">
                <X size={18} aria-hidden />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-2 pb-5">{children}</div>
            {footer && (
              <footer className="flex flex-col-reverse gap-2 border-t border-linea bg-papel/40 px-6 pt-3.5 pb-[max(.875rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
                {footer}
              </footer>
            )}

            {asking && (
              <div className="absolute inset-0 z-10 grid place-items-end bg-superficie/85 p-4 backdrop-blur-sm sm:place-items-center" role="alertdialog" aria-labelledby="descartar-titulo">
                <div className="w-full max-w-sm rounded-2xl border border-linea bg-superficie p-5 shadow-xl">
                  <p id="descartar-titulo" className="font-semibold">Tienes cambios sin guardar</p>
                  <p className="mt-1 text-sm text-gris">Si cierras ahora, se pierden.</p>
                  <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="ghost" onClick={onClose}>Descartar cambios</Button>
                    <Button autoFocus onClick={() => setAsking(false)}>Seguir editando</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CloseContext.Provider>
      )}
    </dialog>
  )
}

/** Botón "Cancelar" del pie: respeta el aviso de cambios sin guardar. */
export function CancelButton() {
  const close = useContext(CloseContext)
  return <Button variant="ghost" onClick={close}>Cancelar</Button>
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onClose }: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-gris">{message}</p>
    </Modal>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline'; busy?: boolean; busyLabel?: string }

export function Button({ variant = 'primary', busy, busyLabel = 'Guardando…', className = '', children, disabled, ...rest }: ButtonProps) {
  const styles = {
    primary: 'bg-tinta text-superficie shadow-[0_1px_2px_rgb(0_0_0/.12),inset_0_1px_0_rgb(255_255_255/.08)] hover:bg-tinta/88',
    outline: 'border border-linea bg-superficie text-tinta sombra-panel hover:border-tinta/30 hover:bg-papel/60',
    ghost: 'text-tinta hover:bg-papel',
    danger: 'bg-peligro text-white hover:bg-peligro/90',
  }[variant]
  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4.5 text-[0.95rem] font-semibold disabled:opacity-45 ${styles} ${className}`}
      {...rest}
    >
      {busy ? (
        <>
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent [animation-duration:600ms]" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  )
}
