import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { store, type ImageFolder } from '../lib/store'

export default function ImageUpload({ value, onChange, siteId, folder, round, wide }: {
  value: string | null
  onChange: (url: string | null) => void
  siteId: string
  folder: ImageFolder
  round?: boolean
  wide?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function pick(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Ese archivo no es una foto. Elige un JPG, PNG o WEBP.')
      return
    }
    setBusy(true)
    try {
      onChange(await store.uploadImage(file, siteId, folder))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  const shape = round ? 'size-28 rounded-full' : wide ? 'aspect-[16/9] w-full rounded-2xl' : 'h-36 w-36 rounded-2xl'

  return (
    <div className={wide ? 'flex flex-col gap-2' : 'flex items-center gap-4'}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`${shape} presion-suave relative grid shrink-0 place-items-center overflow-hidden border-2 border-dashed border-linea bg-papel text-gris hover:border-resalte/50 hover:text-resalte ${value ? 'border-solid' : ''}`}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm">
            <ImagePlus size={26} aria-hidden />
            {busy ? 'Subiendo…' : 'Subir foto'}
          </span>
        )}
        {busy && value && <span className="absolute inset-0 grid place-items-center bg-superficie/70 text-sm font-medium text-tinta">Subiendo…</span>}
      </button>
      {value && (
        <div className={wide ? 'flex gap-1' : 'flex flex-col gap-1'}>
          <button type="button" onClick={() => input.current?.click()} className="min-h-11 rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-papel">
            Cambiar foto
          </button>
          <button type="button" onClick={() => onChange(null)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-peligro transition-colors hover:bg-peligro/8">
            <Trash2 size={15} aria-hidden /> Quitar foto
          </button>
        </div>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  )
}
