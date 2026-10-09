import { useRef, useState } from 'react'
import { publicUrl, slugify, type Page } from '../../lib/supabase'
import { Icon } from '../../lib/icons'
import { uploadImage } from '../upload'
import { Field, Toggle, inputCls, secondaryBtn } from '../ui'

export default function ProfileTab({ page, onChange }: { page: Page; onChange: (p: Partial<Page>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const originalSlug = useRef(page.slug)

  async function onFile(file?: File) {
    if (!file) return
    setUploading(true)
    try {
      onChange({ avatar_url: await uploadImage(file, page.id, 400) })
    } catch {
      alert('No se pudo subir la imagen.')
    }
    setUploading(false)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200 text-stone-400">
          {page.avatar_url ? <img src={page.avatar_url} alt="" className="h-full w-full object-cover" /> : <Icon name="plus" size={28} />}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={secondaryBtn} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Subiendo…' : page.avatar_url ? 'Cambiar logo / foto' : 'Subir logo / foto'}
          </button>
          {page.avatar_url && (
            <button className={`${secondaryBtn} text-red-600`} onClick={() => onChange({ avatar_url: null })}>
              Quitar
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      <Field label="Nombre del negocio">
        <input className={inputCls} value={page.title} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>

      <Field label="Descripción" hint="Opcional. Una frase corta sobre el negocio.">
        <textarea rows={3} className={`${inputCls} resize-none`} value={page.bio} onChange={(e) => onChange({ bio: e.target.value })} />
      </Field>

      <Field
        label="Link de la página"
        hint={
          page.slug !== originalSlug.current ? (
            <span className="text-amber-700">Ojo: las tarjetas ya grabadas con el link anterior dejarán de funcionar.</span>
          ) : (
            'Esto es lo que se graba en el QR / NFC.'
          )
        }
      >
        <div className="flex items-center rounded-xl border border-stone-300 bg-white focus-within:border-stone-900">
          <span className="truncate pl-3.5 text-sm text-stone-400">{publicUrl('')}</span>
          <input
            className="min-w-0 flex-1 bg-transparent py-2.5 pr-3.5 text-[15px] outline-none"
            value={page.slug}
            onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            onBlur={() => onChange({ slug: slugify(page.slug) })}
          />
        </div>
      </Field>

      <button
        className={secondaryBtn}
        onClick={() => {
          navigator.clipboard.writeText(publicUrl(page.slug))
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Copiado' : 'Copiar link'}
      </button>

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
        <div>
          <p className="font-medium">Página publicada</p>
          <p className="text-sm text-stone-500">Si la apagas, quien escanee la tarjeta verá "página no existe".</p>
        </div>
        <Toggle checked={page.published} onChange={(v) => onChange({ published: v })} label="Página publicada" />
      </div>
    </div>
  )
}
