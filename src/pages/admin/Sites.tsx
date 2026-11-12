import { ArrowRight, Copy, Ellipsis, ExternalLink, Link2, Plus, QrCode, Search, SearchX, Shrub, Store, Trash2, UtensilsCrossed, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Field, focusFirstInvalid, TextInput } from '../../components/Field'
import Modal, { Button, CancelButton } from '../../components/Modal'
import { RowAction } from '../../components/SortableList'
import { cargarHoja, urlMuestras } from '../../lib/fuentes'
import { crearPagina, slugError, slugLibre, urlPublica } from '../../lib/paginas'
import { PLANTILLAS, temaDePlantilla } from '../../lib/plantillas'
import type { Site } from '../../lib/types'
import { slugify } from '../../lib/vocab'
import { DeleteSiteDialog, DuplicateDialog, QrDialog } from './acciones'
import { EmptyState, PageTitle } from './AdminApp'
import { useAdmin } from './contexto'
import Muestra, { SelectorTemasColor } from './Muestra'

type Accion = { tipo: 'qr' | 'duplicar' | 'eliminar'; site: Site }

/** Para buscar sin importar tildes ni mayúsculas: "Pizzería" se encuentra con "pizzeria". */
const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

/** "Mis páginas": todas las páginas, y el botón para crear una nueva. */
export default function Sites() {
  const { sites } = useAdmin()
  const [creating, setCreating] = useState(false)
  const [accion, setAccion] = useState<Accion | null>(null)
  // En celular, las acciones de cada tarjeta van en una hoja (no caben en media pantalla).
  const [acciones, setAcciones] = useState<Site | null>(null)
  // La búsqueda queda en la dirección (?buscar=…): al volver de editar una página sigue filtrada.
  const [params, setParams] = useSearchParams()
  const busqueda = params.get('buscar') ?? ''
  const setBusqueda = (valor: string) => setParams(valor ? { buscar: valor } : {}, { replace: true })
  const visibles = useMemo(() => {
    const q = normalizar(busqueda)
    return q ? sites?.filter((s) => normalizar(`${s.name} ${s.slug}`).includes(q)) : sites
  }, [sites, busqueda])

  // Las miniaturas usan las fuentes de cada página (solo las letras de sus nombres).
  useEffect(() => {
    if (!sites?.length) return
    const nombres = sites.flatMap((s) => [s.theme.fuentes.titulos, s.theme.fuentes.textos, s.theme.fuentes.precios])
    cargarHoja(urlMuestras(nombres, sites.map((s) => s.name).join('') + 'Carta·Vermás WhatsApp'))
  }, [sites])

  async function copyLink(site: Site) {
    try {
      await navigator.clipboard.writeText(urlPublica(site.slug))
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar. Ábrela y copia la dirección del navegador.')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-7 pb-24">
      <PageTitle
        title="Mis páginas"
        description="Cada negocio tiene su página con botones, carta o catálogo y su propio diseño. Entra a una para editarla."
        action={<Button onClick={() => setCreating(true)}><Plus size={19} /> Nueva página</Button>}
      />

      {sites && sites.length === 0 && (
        <EmptyState icon={<Shrub size={22} />} action={<Button onClick={() => setCreating(true)}><Plus size={19} /> Crear mi primera página</Button>}>
          <p className="font-semibold text-tinta">Todavía no tienes páginas</p>
          <p className="mt-1 text-sm">Cada negocio tiene la suya: botones, carta o catálogo y su propio diseño.</p>
        </EmptyState>
      )}

      {/* Mientras llegan las páginas, la forma de las tarjetas (nada salta al cargar). */}
      {!sites && (
        <div aria-busy="true" aria-label="Cargando páginas" className="grid animate-pulse grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-64 rounded-[1.1rem] bg-linea/50 sm:h-72 sm:rounded-[1.4rem]" />)}
        </div>
      )}

      {!!sites?.length && (
        <div className="relative mb-4 sm:mb-5 sm:max-w-sm">
          <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gris" />
          <TextInput
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && busqueda) {
                e.preventDefault()
                setBusqueda('')
              }
            }}
            placeholder="Buscar por nombre"
            aria-label="Buscar páginas por nombre"
            autoComplete="off"
            enterKeyHint="search"
            className="pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar búsqueda" className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-gris hover:text-tinta">
              <X size={18} aria-hidden />
            </button>
          )}
        </div>
      )}

      {/* Para lectores de pantalla: cuántas quedan al filtrar. */}
      <p className="sr-only" aria-live="polite">
        {busqueda && visibles ? `${visibles.length} ${visibles.length === 1 ? 'página' : 'páginas'}` : ''}
      </p>

      {busqueda && visibles?.length === 0 && (
        <EmptyState icon={<SearchX size={22} />} action={<Button onClick={() => setBusqueda('')}>Ver todas</Button>}>
          <p className="font-semibold text-tinta">Ninguna página coincide con «{busqueda}»</p>
          <p className="mt-1 text-sm">Revisa cómo está escrito o prueba con una parte del nombre.</p>
        </EmptyState>
      )}

      {/* Dos columnas también en celular: se ven más páginas de un vistazo. */}
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {visibles?.map((site) => (
          <li key={site.id} className="group/tarjeta sombra-panel flex min-w-0 flex-col overflow-hidden rounded-[1.1rem] border border-linea bg-superficie transition-[box-shadow,border-color] duration-200 hover:border-tinta/15 hover:shadow-[0_12px_32px_-14px_rgb(16_24_40/.25)] sm:rounded-[1.4rem]">
            <Link to={`/admin/${site.id}`} className="presion-suave block p-1.5 pb-0 sm:p-2 sm:pb-0" aria-label={`Editar ${site.name}`}>
              <Muestra theme={site.theme} titulo={site.name} avatar={site.avatar_url} className="aspect-[4/5] rounded-[0.8rem] sm:aspect-[16/10] sm:rounded-[1rem]" />
            </Link>
            <div className="flex flex-1 flex-col gap-2 px-3 pt-2.5 pb-1.5 sm:gap-3 sm:px-4 sm:pt-3.5 sm:pb-2">
              <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:justify-between sm:gap-3">
                <div className="w-full min-w-0">
                  <Link to={`/admin/${site.id}`} className="sin-presion block truncate font-semibold hover:text-resalte sm:text-[1.05rem]">{site.name}</Link>
                  <span className="block truncate text-[0.8rem] text-gris sm:text-sm">/{site.slug}</span>
                </div>
                <Estado published={site.published} />
              </div>
              <div className="mt-auto -mx-1.5 flex items-center gap-0.5 border-t border-linea pt-1 sm:-mx-2 sm:flex-wrap sm:pt-1.5">
                <Link to={`/admin/${site.id}`} className="mr-auto inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-semibold hover:bg-papel sm:px-3">
                  Editar <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover/tarjeta:translate-x-0.5" />
                </Link>
                <div className="hidden sm:contents">
                  <a href={`/${site.slug}`} target="_blank" rel="noopener" aria-label={`Ver ${site.name} (otra pestaña)`} title="Ver página" className="grid size-11 place-items-center rounded-xl text-gris hover:bg-papel hover:text-tinta">
                    <ExternalLink size={18} />
                  </a>
                  <RowAction label="Copiar enlace" onClick={() => copyLink(site)}><Link2 size={18} /></RowAction>
                  <RowAction label="Código QR" onClick={() => setAccion({ tipo: 'qr', site })}><QrCode size={18} /></RowAction>
                  <RowAction label="Duplicar" onClick={() => setAccion({ tipo: 'duplicar', site })}><Copy size={18} /></RowAction>
                  <RowAction danger label="Eliminar" onClick={() => setAccion({ tipo: 'eliminar', site })}><Trash2 size={18} /></RowAction>
                </div>
                <div className="sm:hidden">
                  <RowAction label={`Más acciones de ${site.name}`} onClick={() => setAcciones(site)}><Ellipsis size={20} /></RowAction>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {acciones && (
        <Modal open title={acciones.name} onClose={() => setAcciones(null)}>
          <ul className="-mx-2 -mt-1 flex flex-col">
            <li>
              <a href={`/${acciones.slug}`} target="_blank" rel="noopener" onClick={() => setAcciones(null)} className={opcionHoja}>
                <ExternalLink size={20} aria-hidden className="text-gris" /> Ver página
              </a>
            </li>
            <OpcionHoja icon={<Link2 size={20} />} onClick={() => { copyLink(acciones); setAcciones(null) }}>Copiar enlace</OpcionHoja>
            <OpcionHoja icon={<QrCode size={20} />} onClick={() => { setAccion({ tipo: 'qr', site: acciones }); setAcciones(null) }}>Código QR</OpcionHoja>
            <OpcionHoja icon={<Copy size={20} />} onClick={() => { setAccion({ tipo: 'duplicar', site: acciones }); setAcciones(null) }}>Duplicar</OpcionHoja>
            <OpcionHoja danger icon={<Trash2 size={20} />} onClick={() => { setAccion({ tipo: 'eliminar', site: acciones }); setAcciones(null) }}>Eliminar</OpcionHoja>
          </ul>
        </Modal>
      )}

      {creating && sites && <NewSiteForm sites={sites} onClose={() => setCreating(false)} />}
      {accion?.tipo === 'qr' && <QrDialog site={accion.site} onClose={() => setAccion(null)} />}
      {accion?.tipo === 'duplicar' && <DuplicateDialog site={accion.site} onClose={() => setAccion(null)} />}
      {accion?.tipo === 'eliminar' && <DeleteSiteDialog site={accion.site} onClose={() => setAccion(null)} />}
    </main>
  )
}

const opcionHoja = 'flex min-h-13 w-full items-center gap-3.5 rounded-xl px-3 text-left text-[1.05rem] font-medium hover:bg-papel active:bg-papel'

function OpcionHoja({ icon, onClick, danger, children }: { icon: ReactNode; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`${opcionHoja} ${danger ? 'text-peligro' : ''}`}>
        <span aria-hidden className={danger ? '' : 'text-gris'}>{icon}</span>
        {children}
      </button>
    </li>
  )
}

export function Estado({ published }: { published: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${published ? 'bg-exito/12 text-exito' : 'bg-gris/12 text-gris'}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${published ? 'bg-exito' : 'bg-gris/70'}`} />
      {published ? 'Publicada' : 'Borrador'}
    </span>
  )
}

const TIPOS = [
  ['restaurante', 'Restaurante o bar', 'Carta con opciones', UtensilsCrossed],
  ['tienda', 'Tienda', 'Catálogo con productos y precio por libra, unidad o kilo', Store],
] as const

function NewSiteForm({ sites, onClose }: { sites: Site[]; onClose: () => void }) {
  const { reloadSites } = useAdmin()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [tipo, setTipo] = useState<Site['vocab']['tipo']>('restaurante')
  const [plantilla, setPlantilla] = useState(PLANTILLAS[0].id)
  const [paleta, setPaleta] = useState(PLANTILLAS[0].temaColor)
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)

  useEffect(() => {
    cargarHoja(urlMuestras(PLANTILLAS.flatMap((p) => [p.estilo.fuentes.titulos, p.estilo.fuentes.textos, p.estilo.fuentes.precios]), 'Tu negocio Carta·Vermás WhatsApp'))
  }, [])

  const nameError = name.trim() ? '' : 'Escribe el nombre del negocio.'
  const error = slugError(slug, sites)

  function changeName(value: string) {
    setName(value)
    if (!slugTouched) setSlug(value.trim() ? slugLibre(value, sites) : '')
  }

  async function submit() {
    setTried(true)
    if (nameError || error) return focusFirstInvalid()
    setBusy(true)
    try {
      const site = await crearPagina({ name: name.trim(), slug, tipo, plantilla, paleta })
      await reloadSites()
      toast.success('Página creada en borrador')
      navigate(`/admin/${site.id}/perfil`)
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      dirty={!!name}
      wide
      title="Nueva página"
      onClose={onClose}
      footer={
        <>
          <CancelButton />
          <Button onClick={submit} busy={busy} busyLabel="Creando…">Crear página</Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field label="Nombre del negocio" error={tried ? nameError : ''}>
          <TextInput value={name} onChange={(e) => changeName(e.target.value)} placeholder="Pez y Mar" maxLength={60} autoFocus />
        </Field>
        <Field label="Dirección" hint={`Así queda el enlace: ${urlPublica(slug || '…')}`} error={tried || slugTouched ? error : ''}>
          <TextInput
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
            autoCapitalize="off"
            placeholder="pez-y-mar"
          />
        </Field>

        <fieldset>
          <legend className="mb-2 font-medium">Tipo de negocio</legend>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(([value, title, hint, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={tipo === value}
                onClick={() => setTipo(value)}
                className={`presion-suave rounded-2xl border-2 p-3.5 text-left ${tipo === value ? 'border-resalte bg-resalte/10' : 'border-linea hover:border-tinta/30'}`}
              >
                <Icon size={20} aria-hidden />
                <span className="mt-2 block font-semibold">{title}</span>
                <span className="block text-sm text-gris">{hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gris">Define las palabras («carta» o «catálogo», «opción» o «producto»). Las puedes cambiar después en Ajustes.</p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-medium">Diseño para empezar</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PLANTILLAS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={plantilla === p.id}
                aria-label={`Plantilla ${i + 1}: ${p.descripcion}`}
                title={p.descripcion}
                onClick={() => setPlantilla(p.id)}
                className={`presion-suave overflow-hidden rounded-2xl border-2 text-left ${plantilla === p.id ? 'border-resalte ring-2 ring-resalte/30' : 'border-linea hover:border-tinta/30'}`}
              >
                <Muestra compacta theme={temaDePlantilla(p.id, undefined, paleta)} titulo="Tu negocio" className="aspect-[4/3] px-2! pb-2.5!" />
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gris">Letras, fondo y botones. Todo se puede ajustar en la pestaña Diseño.</p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-medium">Tema de color</legend>
          <SelectorTemasColor value={paleta} onChange={setPaleta} />
        </fieldset>
      </div>
    </Modal>
  )
}
