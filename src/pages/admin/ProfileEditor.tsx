import { useState } from 'react'
import toast from 'react-hot-toast'
import { Field, TextArea, TextInput } from '../../components/Field'
import ImageUpload from '../../components/ImageUpload'
import { BarraGuardar, Card, PageTitle } from './AdminApp'
import { useAdminSite } from './contexto'

export default function ProfileEditor() {
  const { site, update } = useAdminSite()
  const pick = () => ({ name: site.name, description: site.description, avatar_url: site.avatar_url, seo_title: site.seo_title ?? '', seo_description: site.seo_description ?? '' })
  const [saved, setSaved] = useState(pick)
  const [draft, setDraft] = useState(saved)
  const [busy, setBusy] = useState(false)
  const set = (fields: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...fields }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  async function submit() {
    if (!draft.name.trim()) {
      toast.error('Escribe el nombre del negocio.')
      return
    }
    setBusy(true)
    try {
      const next = { ...draft, name: draft.name.trim() }
      await update({ ...next, seo_title: next.seo_title.trim() || null, seo_description: next.seo_description.trim() || null })
      setSaved(next)
      setDraft(next)
      toast.success('Perfil guardado')
    } catch {
      // update ya mostró el error
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageTitle title="Perfil" description="La foto, el nombre y el texto que aparecen arriba de los botones." />

      <div className="space-y-5">
        <Card>
          <div className="space-y-6">
            <div>
              <span className="mb-2 block font-medium">Foto de perfil o logo</span>
              <ImageUpload round siteId={site.id} folder="avatar" value={draft.avatar_url} onChange={(url) => set({ avatar_url: url })} />
            </div>
            <Field label="Nombre">
              <TextInput value={draft.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} />
            </Field>
            <Field label="Descripción" hint="Puedes usar varias líneas. Lo ideal: dos o tres frases cortas.">
              <TextArea rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} maxLength={280} />
            </Field>
          </div>
        </Card>

        <Card title="En buscadores y pestañas" description="Lo que se ve en la pestaña del navegador y en Google. Si lo dejas vacío, se usan el nombre y la descripción.">
          <div className="space-y-5">
            <Field label="Título (opcional)">
              <TextInput value={draft.seo_title} onChange={(e) => set({ seo_title: e.target.value })} placeholder={draft.name} maxLength={70} />
            </Field>
            <Field label="Descripción (opcional)">
              <TextArea rows={2} value={draft.seo_description} onChange={(e) => set({ seo_description: e.target.value })} placeholder={draft.description.replace(/\n/g, ' ')} maxLength={160} />
            </Field>
          </div>
        </Card>

        <BarraGuardar dirty={dirty} busy={busy} onSave={submit} onDiscard={() => setDraft(saved)} label="Guardar perfil" />
      </div>
    </>
  )
}
