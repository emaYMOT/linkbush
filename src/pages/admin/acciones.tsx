import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Field, focusFirstInvalid, TextInput } from '../../components/Field'
import Modal, { Button, CancelButton } from '../../components/Modal'
import { borrarArchivosDePagina } from '../../lib/archivos'
import { duplicarPagina, slugError, slugLibre, urlPublica } from '../../lib/paginas'
import { store } from '../../lib/store'
import type { Site } from '../../lib/types'
import { slugify } from '../../lib/vocab'
import { useAdmin } from './contexto'

/** Código QR de la página, para descargar en PNG (imprimir) o SVG (diseñadores). */
export function QrDialog({ site, onClose }: { site: Site; onClose: () => void }) {
  const url = urlPublica(site.slug)
  const [png, setPng] = useState('')
  const [svg, setSvg] = useState('')

  useEffect(() => {
    // La librería del QR solo se descarga al abrir esta ventana.
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M' }).then(setPng)
      QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }).then((s) => setSvg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`))
    })
  }, [url])

  return (
    <Modal open title={`QR de ${site.name}`} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        {/* Siempre negro sobre blanco: es lo que mejor leen las cámaras. */}
        <div className="rounded-2xl bg-white p-3">{png ? <img src={png} alt={`Código QR que abre ${url}`} className="size-56" /> : <div className="size-56" />}</div>
        <p className="max-w-full text-center text-sm break-all text-gris">{url}</p>
        {!site.published && <p className="rounded-xl bg-peligro/10 px-4 py-2.5 text-sm text-peligro">La página está en borrador: quien escanee verá «Página no encontrada» hasta que la publiques.</p>}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <a href={png} download={`qr-${site.slug}.png`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-tinta px-5 font-semibold text-superficie transition hover:bg-tinta/85">
            <Download size={18} /> PNG (imprimir)
          </a>
          <a href={svg} download={`qr-${site.slug}.svg`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-linea px-5 font-semibold transition hover:border-tinta/40">
            <Download size={18} /> SVG
          </a>
        </div>
      </div>
    </Modal>
  )
}

/** Copia la página con todo su contenido, con otro nombre y otra dirección. */
export function DuplicateDialog({ site, onClose }: { site: Site; onClose: () => void }) {
  const { sites, reloadSites } = useAdmin()
  const navigate = useNavigate()
  const [name, setName] = useState(`${site.name} (copia)`)
  const [slug, setSlug] = useState(() => slugLibre(`${site.slug}-copia`, sites ?? []))
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const nameError = name.trim() ? '' : 'Escribe el nombre.'
  const error = slugError(slug, sites ?? [])

  async function submit() {
    setTried(true)
    if (nameError || error) return focusFirstInvalid()
    setBusy(true)
    try {
      const copy = await duplicarPagina(site, name.trim(), slug)
      await reloadSites()
      toast.success('Página duplicada (en borrador)')
      onClose()
      navigate(`/admin/${copy.id}`)
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title="Duplicar página"
      onClose={onClose}
      footer={
        <>
          <CancelButton />
          <Button onClick={submit} busy={busy} busyLabel="Duplicando…">Duplicar</Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-gris">Se copian los botones, {`${site.vocab.generoSeccion === 'f' ? 'la' : 'el'} ${site.vocab.seccion.toLowerCase()}`} completo y el diseño. La copia queda en borrador.</p>
        <Field label="Nombre" error={tried ? nameError : ''}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </Field>
        <Field label="Dirección" hint={urlPublica(slug || '…')} error={tried ? error : ''}>
          <TextInput value={slug} onChange={(e) => setSlug(slugify(e.target.value))} autoCapitalize="off" />
        </Field>
      </div>
    </Modal>
  )
}

/** Borrar para siempre: pide escribir el nombre para que no pase por accidente. */
export function DeleteSiteDialog({ site, onClose }: { site: Site; onClose: () => void }) {
  const { setSites } = useAdmin()
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = typed.trim().toLowerCase() === site.name.trim().toLowerCase()

  async function submit() {
    setBusy(true)
    try {
      // Primero sus archivos (fotos y video); si falla, igual se elimina la página y se pueden limpiar a mano.
      await borrarArchivosDePagina(site.id).catch((e) => console.warn('No se pudieron borrar los archivos:', e))
      await store.removeSite(site.id)
      setSites((list) => list.filter((s) => s.id !== site.id))
      toast.success('Página eliminada')
      onClose()
      navigate('/admin')
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      title="¿Eliminar esta página?"
      onClose={onClose}
      footer={
        <>
          <CancelButton />
          <Button variant="danger" onClick={submit} disabled={!ok} busy={busy} busyLabel="Eliminando…">Eliminar para siempre</Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-gris">
          Se borran <strong className="text-tinta">{site.name}</strong>, sus botones y todo su contenido. El QR impreso dejará de funcionar. Esto no se puede deshacer; si solo quieres esconderla, despublícala en Ajustes.
        </p>
        <Field label={`Escribe «${site.name}» para confirmar`}>
          <TextInput value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </Field>
      </div>
    </Modal>
  )
}
