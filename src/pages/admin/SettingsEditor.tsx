import { Copy, Eraser, FileUp, Link2, QrCode, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Field, TextInput } from '../../components/Field'
import Modal, { Button, CancelButton } from '../../components/Modal'
import Toggle from '../../components/Toggle'
import { UNITS } from '../../lib/format'
import { store } from '../../lib/store'
import { analizarArchivos, borrarSobrantes, formatBytes, type AnalisisArchivos } from '../../lib/archivos'
import { contarProductos, importarCatalogo, leerCatalogo, slugError, urlPublica, type CatalogoImportado } from '../../lib/paginas'
import type { PriceUnit, Vocab } from '../../lib/types'
import { clearPublicCache } from '../../lib/useCached'
import { palabras, slugify, VOCAB_PRESETS } from '../../lib/vocab'
import { DeleteSiteDialog, DuplicateDialog, QrDialog } from './acciones'
import { Card, PageTitle } from './AdminApp'
import { useAdmin, useAdminSite } from './contexto'
import { Opciones } from './controles'

export default function SettingsEditor() {
  const { site, update } = useAdminSite()
  const [dialog, setDialog] = useState<'qr' | 'duplicar' | 'eliminar' | null>(null)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(urlPublica(site.slug))
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar el enlace.')
    }
  }

  return (
    <>
      <PageTitle title="Ajustes" description="Dirección, publicación, palabras de la página e importar un catálogo." />

      <div className="space-y-5">
        <Card title="Publicación">
          <div className="divide-y divide-linea">
            <Toggle
              label="Página publicada"
              description={site.published ? 'Cualquiera con el enlace o el QR la ve.' : 'Borrador: solo tú la ves (con la sesión iniciada).'}
              checked={site.published}
              onChange={async (published) => {
                try {
                  await update({ published })
                  toast.success(published ? 'Página publicada' : 'Página en borrador')
                } catch {
                  // update ya mostró el error
                }
              }}
            />
            <div className="flex flex-wrap gap-2 pt-4">
              <Button variant="outline" onClick={copyLink}><Link2 size={18} /> Copiar enlace</Button>
              <Button variant="outline" onClick={() => setDialog('qr')}><QrCode size={18} /> Código QR</Button>
            </div>
          </div>
        </Card>

        <SlugCard />
        <VocabCard />
        <ImportCard />
        <FilesCard />

        <Card title="Copiar o eliminar">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialog('duplicar')}><Copy size={18} /> Duplicar página</Button>
            <Button variant="ghost" className="text-peligro hover:bg-peligro/8" onClick={() => setDialog('eliminar')}><Trash2 size={18} /> Eliminar página</Button>
          </div>
        </Card>
      </div>

      {dialog === 'qr' && <QrDialog site={site} onClose={() => setDialog(null)} />}
      {dialog === 'duplicar' && <DuplicateDialog site={site} onClose={() => setDialog(null)} />}
      {dialog === 'eliminar' && <DeleteSiteDialog site={site} onClose={() => setDialog(null)} />}
    </>
  )
}

function SlugCard() {
  const { site, update } = useAdminSite()
  const { sites } = useAdmin()
  const [slug, setSlug] = useState(site.slug)
  const [busy, setBusy] = useState(false)
  const error = slugError(slug, sites ?? [], site.id)
  const dirty = slug !== site.slug

  async function save() {
    if (error) return
    setBusy(true)
    try {
      await update({ slug })
      toast.success('Dirección cambiada')
    } catch {
      // update ya mostró el error
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Dirección" description="La parte final del enlace de la página.">
      <Field label="Dirección" hint={urlPublica(slug || '…')} error={dirty ? error : ''}>
        <TextInput value={slug} onChange={(e) => setSlug(slugify(e.target.value))} autoCapitalize="off" />
      </Field>
      {dirty && (
        <p className="mt-3 rounded-xl bg-peligro/10 px-4 py-3 text-sm text-peligro">
          Si cambias la dirección, el enlace anterior y los QR ya impresos dejan de funcionar.
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        {dirty && <Button variant="ghost" onClick={() => setSlug(site.slug)}>Deshacer</Button>}
        <Button onClick={save} busy={busy} disabled={!dirty || !!error}>Cambiar dirección</Button>
      </div>
    </Card>
  )
}

function VocabCard() {
  const { site, update } = useAdminSite()
  const [saved, setSaved] = useState<Vocab>(site.vocab)
  const [draft, setDraft] = useState<Vocab>(site.vocab)
  const [busy, setBusy] = useState(false)
  const set = (fields: Partial<Vocab>) => setDraft((d) => ({ ...d, ...fields }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const m = palabras(draft)

  function toggleUnit(unit: PriceUnit, on: boolean) {
    const unidades = (Object.keys(UNITS) as PriceUnit[]).filter((u) => (u === unit ? on : draft.unidades.includes(u)))
    set({ unidades, unidadPorDefecto: unidades.includes(draft.unidadPorDefecto as PriceUnit) ? draft.unidadPorDefecto : (unidades[0] ?? null) })
  }

  async function save() {
    if (!draft.seccion.trim() || !draft.producto.uno.trim() || !draft.producto.varios.trim()) {
      toast.error('Completa el nombre de la sección y cómo se llama cada producto.')
      return
    }
    setBusy(true)
    try {
      await update({ vocab: draft })
      setSaved(draft)
      clearPublicCache()
      toast.success('Palabras guardadas')
    } catch {
      // update ya mostró el error
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Palabras de la página" description="Cómo se llaman las cosas en este negocio. Se usan en la página y en el panel.">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-sm text-gris">Empezar con las palabras de:</span>
          {(['restaurante', 'tienda'] as const).map((tipo) => (
            <Button key={tipo} variant="outline" onClick={() => setDraft({ ...structuredClone(VOCAB_PRESETS[tipo]) })}>
              {tipo === 'restaurante' ? 'Restaurante o bar (carta, opciones)' : 'Tienda (catálogo, productos)'}
            </Button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <Field label="Nombre de la sección" hint={`Pestaña y dirección: …/#/${site.slug}/${m.ruta}`}>
            <TextInput value={draft.seccion} onChange={(e) => set({ seccion: e.target.value })} placeholder="Carta" maxLength={24} />
          </Field>
          <Opciones
            legend="Se dice"
            columns={2}
            value={draft.generoSeccion}
            onChange={(v) => set({ generoSeccion: v })}
            options={[
              { value: 'f', label: `la ${draft.seccion.toLowerCase() || 'carta'}` },
              { value: 'm', label: `el ${draft.seccion.toLowerCase() || 'catálogo'}` },
            ]}
          />
        </div>
        <Field label="Título de la sección">
          <TextInput value={draft.titulo} onChange={(e) => set({ titulo: e.target.value })} placeholder="Nuestra carta" maxLength={40} />
        </Field>
        <Field label="Subtítulo (opcional)">
          <TextInput value={draft.subtitulo} onChange={(e) => set({ subtitulo: e.target.value })} maxLength={100} />
        </Field>
        <Field label="Texto sugerido del botón" hint="El que se propone al crear el botón que abre la sección.">
          <TextInput value={draft.boton} onChange={(e) => set({ boton: e.target.value })} maxLength={60} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Cada producto se llama">
            <TextInput value={draft.producto.uno} onChange={(e) => set({ producto: { ...draft.producto, uno: e.target.value } })} placeholder="opción" maxLength={20} />
          </Field>
          <Field label="En plural">
            <TextInput value={draft.producto.varios} onChange={(e) => set({ producto: { ...draft.producto, varios: e.target.value } })} placeholder="opciones" maxLength={22} />
          </Field>
          <Opciones
            legend="Se dice"
            columns={2}
            value={draft.producto.genero}
            onChange={(v) => set({ producto: { ...draft.producto, genero: v } })}
            options={[
              { value: 'm', label: `el ${draft.producto.uno || 'producto'}` },
              { value: 'f', label: `la ${draft.producto.uno || 'opción'}` },
            ]}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Etiqueta de agotado">
            <TextInput value={draft.agotado} onChange={(e) => set({ agotado: e.target.value })} placeholder="Agotado por hoy" maxLength={30} />
          </Field>
          <Field label="Interruptor de disponibilidad" hint="Cómo se llama en el formulario de cada producto.">
            <TextInput value={draft.disponible.etiqueta} onChange={(e) => set({ disponible: { ...draft.disponible, etiqueta: e.target.value } })} placeholder="Disponible hoy" maxLength={30} />
          </Field>
        </div>

        <fieldset>
          <legend className="font-medium">Precio por unidad de venta</legend>
          <p className="text-sm text-gris">Para tiendas que venden por peso. Si no marcas ninguna, no se pregunta.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(UNITS) as PriceUnit[]).map((u) => (
              <label key={u} className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-3.5 font-semibold transition ${draft.unidades.includes(u) ? 'border-resalte bg-resalte/10' : 'border-linea'}`}>
                <input type="checkbox" checked={draft.unidades.includes(u)} onChange={(e) => toggleUnit(u, e.target.checked)} className="size-4.5 accent-[var(--color-resalte)]" />
                {UNITS[u].long}
              </label>
            ))}
          </div>
          {draft.unidades.length > 1 && (
            <label className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gris">Al crear un producto, empezar con:</span>
              <select value={draft.unidadPorDefecto ?? ''} onChange={(e) => set({ unidadPorDefecto: (e.target.value || null) as PriceUnit | null })} className="min-h-11 rounded-xl border border-linea bg-superficie px-3 font-semibold">
                {draft.unidades.map((u) => <option key={u} value={u}>{UNITS[u].long}</option>)}
                <option value="">No indicar</option>
              </select>
            </label>
          )}
        </fieldset>

        <div className="flex justify-end gap-2">
          {dirty && <Button variant="ghost" onClick={() => setDraft(saved)}>Descartar</Button>}
          <Button onClick={save} busy={busy} disabled={!dirty}>Guardar palabras</Button>
        </div>
      </div>
    </Card>
  )
}

function ImportCard() {
  const { site, m } = useAdminSite()
  const input = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<CatalogoImportado | null>(null)
  const [reemplazar, setReemplazar] = useState(false)
  const [busy, setBusy] = useState(false)

  async function pick(file: File | undefined) {
    if (input.current) input.current.value = ''
    if (!file) return
    try {
      setData(leerCatalogo(await file.text()))
      setReemplazar(false)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function run() {
    if (!data) return
    setBusy(true)
    try {
      await importarCatalogo(site.id, data, reemplazar)
      clearPublicCache()
      toast.success(`${m.seccion} importad${m.el.startsWith('la') ? 'a' : 'o'}`)
      setData(null)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const subs = data?.categorias.reduce((n, c) => n + c.grupos.filter((g) => g.nombre).length, 0) ?? 0

  return (
    <Card title={`Importar ${m.el}`} description="Desde un archivo JSON con categorías, subcategorías y productos (el mismo formato que usamos al pasar un menú en PDF).">
      <Button variant="outline" onClick={() => input.current?.click()}><FileUp size={18} /> Elegir archivo .json</Button>
      <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => pick(e.target.files?.[0])} />

      {data && (
        <Modal
          open
          title={`Importar ${m.el}`}
          onClose={() => setData(null)}
          footer={
            <>
              <CancelButton />
              <Button variant={reemplazar ? 'danger' : 'primary'} onClick={run} busy={busy} busyLabel="Importando…">{reemplazar ? 'Reemplazar todo' : 'Importar'}</Button>
            </>
          }
        >
          <div className="space-y-5">
            <p>
              El archivo trae <strong>{data.categorias.length}</strong> {data.categorias.length === 1 ? 'categoría' : 'categorías'}, <strong>{subs}</strong> {subs === 1 ? 'subcategoría' : 'subcategorías'} y <strong>{contarProductos(data)}</strong> {m.varios}.
            </p>
            <Opciones
              legend="¿Qué hago con lo que ya hay?"
              columns={2}
              value={reemplazar ? 'si' : 'no'}
              onChange={(v) => setReemplazar(v === 'si')}
              options={[
                { value: 'no', label: 'Agregar', hint: 'Se suma después de las categorías actuales' },
                { value: 'si', label: 'Reemplazar', hint: `Borra ${m.el} actual y deja solo lo del archivo` },
              ]}
            />
            <p className="text-sm text-gris">Las fotos que vengan con rutas de otra web no se importan; súbelas después en cada {m.uno}.</p>
          </div>
        </Modal>
      )}
    </Card>
  )
}

function FilesCard() {
  const { site } = useAdminSite()
  const [analisis, setAnalisis] = useState<AnalisisArchivos | null>(null)
  const [busy, setBusy] = useState<'buscando' | 'borrando' | null>(null)

  async function buscar() {
    setBusy('buscando')
    try {
      setAnalisis(await analizarArchivos(site.id))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function borrar() {
    if (!analisis) return
    setBusy('borrando')
    try {
      await borrarSobrantes(analisis.sobran)
      toast.success(`${analisis.sobran.length} archivos borrados (${formatBytes(analisis.bytesSobran)})`)
      setAnalisis(await analizarArchivos(site.id))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card title="Archivos" description="Las fotos y videos que reemplazas o quitas se borran solos de Supabase. Aquí puedes revisarlo y limpiar a mano.">
      {store.mode === 'demo' ? (
        <p className="text-sm text-gris">En modo demo las fotos viven dentro de la página, no hay archivos que limpiar.</p>
      ) : (
        <div className="space-y-3">
          <Button variant="outline" onClick={buscar} busy={busy === 'buscando'} busyLabel="Buscando…"><Eraser size={18} /> Buscar archivos sin usar</Button>
          {analisis && (
            <p className="text-sm">
              Esta página tiene <strong>{analisis.total}</strong> {analisis.total === 1 ? 'archivo' : 'archivos'} ({formatBytes(analisis.bytes)}).{' '}
              {analisis.sobran.length === 0 ? (
                'Todos están en uso.'
              ) : (
                <>
                  <strong>{analisis.sobran.length}</strong> ya no se {analisis.sobran.length === 1 ? 'usa' : 'usan'} y ocupan {formatBytes(analisis.bytesSobran)}.
                </>
              )}
            </p>
          )}
          {analisis && analisis.sobran.length > 0 && (
            <Button variant="danger" onClick={borrar} busy={busy === 'borrando'} busyLabel="Borrando…"><Trash2 size={18} /> Borrar {analisis.sobran.length === 1 ? 'el archivo' : `los ${analisis.sobran.length} archivos`} sin usar</Button>
          )}
          <p className="text-xs text-gris">Los archivos subidos hace menos de 2 horas no se tocan: podrían ser de un cambio que aún no guardas.</p>
        </div>
      )}
    </Card>
  )
}
