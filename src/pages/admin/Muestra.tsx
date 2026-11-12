import { pilaDe } from '../../lib/fuentes'
import { TEMAS_COLOR } from '../../lib/plantillas'
import type { Theme } from '../../lib/types'

/** Cuadrícula de temas de color: cada uno muestra su fondo, tarjeta, acentos y texto. */
export function SelectorTemasColor({ value, onChange }: { value: string | null | undefined; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TEMAS_COLOR.map((t) => {
        const c = t.colores
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            aria-pressed={value === t.id}
            aria-label={t.nombre}
            title={t.nombre}
            className={`presion-suave overflow-hidden rounded-2xl border-2 text-left ${value === t.id ? 'border-resalte ring-2 ring-resalte/30' : 'border-linea hover:border-tinta/30'}`}
          >
            {/* Solo los colores: el nombre queda para lectores de pantalla y al pasar el mouse. */}
            <span aria-hidden className="flex h-16 items-end gap-1.5 px-2.5 pb-2.5" style={{ background: `radial-gradient(90% 90% at 85% 0%, ${c.acento}55, transparent 70%), ${c.fondo}` }}>
              {[c.fondo2, c.acento, c.acento2, c.texto].map((color, i) => (
                <span key={i} className="size-5 rounded-full" style={{ background: color, boxShadow: `0 0 0 1px ${c.texto}33` }} />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Miniatura de cómo se ve una página con un diseño: fondo, título, botón de acento y un precio.
 * Usa los colores directos (no las variables), así varias miniaturas conviven en el panel.
 */
export default function Muestra({ theme, titulo, compacta, avatar, className = '' }: { theme: Theme; titulo: string; compacta?: boolean; avatar?: string | null; className?: string }) {
  const c = theme.colores
  const forma = { pildora: '9999px', redondeado: '8px', suave: '4px', recto: '0', hoja: '10px 2px' }[theme.botones.forma] ?? '9999px'
  const solido = ['solido', 'degradado', 'relieve'].includes(theme.botones.estilo)
  return (
    <div
      aria-hidden
      className={`relative flex flex-col items-center justify-center overflow-hidden px-3 py-3 text-center [container-type:inline-size] ${className}`}
      style={{ background: `radial-gradient(90% 60% at 85% 0%, ${c.acento}55, transparent 70%), ${c.fondo}`, color: c.texto }}
    >
      {/* Como en la página real: la foto arriba, luego el nombre y los botones. */}
      {!compacta && (
        <span
          className="mb-2 grid size-11 shrink-0 place-items-center overflow-hidden text-[0.95rem]"
          style={{ borderRadius: theme.avatar.forma === 'redondeado' ? '28%' : '9999px', background: c.fondo2, boxShadow: theme.avatar.aro === 'ninguno' ? undefined : `0 0 0 2px ${c.fondo}, 0 0 0 3.5px ${c.acento}, 0 0 18px ${c.acento}66`, fontFamily: pilaDe(theme.fuentes.titulos) }}
        >
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : titulo.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="block w-full truncate leading-tight" style={{ fontFamily: pilaDe(theme.fuentes.titulos), fontWeight: theme.fuentes.pesoTitulos, fontSize: compacta ? '1.05rem' : 'clamp(1rem, 9cqi, 1.35rem)' }}>
        {titulo}
      </span>
      <span className="mt-1 block text-[0.7rem]" style={{ fontFamily: pilaDe(theme.fuentes.textos), color: c.textoSuave, fontWeight: theme.fuentes.pesoTextos }}>
        Carta · <span style={{ fontFamily: pilaDe(theme.fuentes.precios), color: c.acento, fontWeight: theme.fuentes.pesoPrecios }}>$25.000</span>
      </span>
      <span
        className="mt-2 block w-[78%] py-1 text-[0.68rem] font-semibold"
        style={{ borderRadius: forma, background: solido ? c.acento : `${c.acento}44`, color: solido ? c.fondo : c.texto, border: `1px solid ${c.acento}` }}
      >
        Ver más
      </span>
      {!compacta && (
        <span className="mt-1.5 block w-[78%] py-1 text-[0.68rem]" style={{ borderRadius: forma, background: solido ? c.fondo2 : `${c.texto}12`, border: `1px solid ${c.texto}26` }}>
          WhatsApp
        </span>
      )}
    </div>
  )
}
