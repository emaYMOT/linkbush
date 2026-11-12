import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { esperarLoPrincipal, videoLiviano } from '../lib/medios'
import type { Efecto, Theme } from '../lib/types'

/**
 * Fondo compartido por el inicio y la carta (vive en el layout, así no se reinicia al navegar).
 * Encima del efecto va el video (el efecto se ve mientras carga); luego el tinte y los velos que se ajustan en el panel.
 * Los colores salen de las variables de la página, así que cambian con su diseño.
 */
export default function HeroBackground({ theme, dim = false }: { theme: Theme; dim?: boolean }) {
  const f = theme.fondo
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-noche" aria-hidden>
      <EfectoFondo tipo={f.efecto} />
      {f.video && <Video key={f.video} src={f.video} />}
      {/* Tinte sobre el video (multiplica: oscurece con el color elegido). */}
      <div className="absolute inset-0 mix-blend-multiply" style={{ background: f.tinte, opacity: f.tinteFuerza / 100 }} />
      {/* Velo para que el texto no compita con el video. */}
      <div className="absolute inset-0 bg-noche" style={{ opacity: f.oscurecerInicio / 100 }} />
      {/* Viñeta: los bordes se hunden en el fondo y la luz queda arriba a la derecha. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_78%_10%,transparent_0%,color-mix(in_oklab,var(--color-noche)_45%,transparent)_55%,color-mix(in_oklab,var(--color-noche)_85%,transparent)_100%)]" />
      {/* Abajo, donde va el texto, se oscurece del todo para que se lea. */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-noche/35 via-50% to-noche/75" />
      {/* En la carta, una capa más para leer productos y precios; se funde al cambiar de página. */}
      <div className="absolute inset-0 bg-noche transition-opacity duration-700 ease-out" style={{ opacity: dim ? f.oscurecerCatalogo / 100 : 0 }} />
    </div>
  )
}

/**
 * El video empieza a bajar cuando ya se ve lo principal (logo, botones, primeras fotos): mientras, se ve el efecto.
 * En celular usa la versión liviana si existe; si esa falla, prueba la original.
 */
function Video({ src }: { src: string }) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [start, setStart] = useState(false)
  const [actual, setActual] = useState(() => (matchMedia('(max-width: 767px)').matches ? videoLiviano(src) : src))
  useEffect(() => {
    let alive = true
    esperarLoPrincipal().then(() => alive && setStart(true))
    return () => {
      alive = false
    }
  }, [])
  if (failed || !start) return null
  return (
    <video
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
      src={actual}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onPlaying={() => setReady(true)}
      onError={() => (actual !== src ? setActual(src) : setFailed(true))}
    />
  )
}

/** Nombre y descripción de cada efecto, para el panel. */
export const EFECTOS: { value: Efecto; label: string; hint: string }[] = [
  { value: 'brasas', label: 'Brasas', hint: 'Chispas que suben' },
  { value: 'luciernagas', label: 'Luciérnagas', hint: 'Lucecitas que vagan y parpadean' },
  { value: 'polvo', label: 'Polvo de oro', hint: 'Destellos que caen bajo un foco' },
  { value: 'bengalas', label: 'Bengalas', hint: 'Chispas rápidas desde el centro' },
  { value: 'burbujas', label: 'Burbujas', hint: 'Burbujas brillantes, como champaña' },
  { value: 'destellos', label: 'Destellos', hint: 'Reflectores y estrellitas que brillan' },
  { value: 'mar', label: 'Mar', hint: 'Burbujas y rayos de luz' },
  { value: 'luces', label: 'Luces', hint: 'Ladera con luces que titilan' },
  { value: 'estrellas', label: 'Estrellas', hint: 'Cielo estrellado y fugaces' },
  { value: 'bokeh', label: 'Bokeh', hint: 'Luces desenfocadas a la deriva' },
  { value: 'ninguno', label: 'Ninguno', hint: 'Solo el color de fondo' },
]

export function EfectoFondo({ tipo }: { tipo: Efecto }) {
  switch (tipo) {
    case 'brasas': return <Brasas />
    case 'luciernagas': return <Luciernagas />
    case 'polvo': return <Polvo />
    case 'bengalas': return <Bengalas />
    case 'burbujas': return <Burbujas />
    case 'destellos': return <Destellos />
    case 'mar': return <Mar />
    case 'luces': return <Luces />
    case 'estrellas': return <Estrellas />
    case 'bokeh': return <Bokeh />
    default: return null
  }
}

const stop = (offset: number, color: string, opacity = 1) => <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
const vars = (v: Record<string, string | number>) => v as CSSProperties

/** Números "al azar" pero siempre iguales (mismo dibujo en cada visita). */
function useAzar<T>(seed: number, count: number, make: (rand: () => number, i: number) => T): T[] {
  return useMemo(() => {
    let s = seed
    const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    return Array.from({ length: count }, (_, i) => make(rand, i))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, count])
}

/** Ids únicos para los degradados SVG (puede haber varias miniaturas a la vez en el panel). */
function useIds(...names: string[]) {
  const base = useId().replace(/:/g, '')
  return Object.fromEntries(names.map((n) => [n, `${n}-${base}`])) as Record<string, string>
}

/** Agua con rayos de luz que se mecen y burbujas que suben. */
function Mar() {
  const id = useIds('agua', 'superficie', 'rayo')
  const bubbles = useAzar(7, 46, (rand) => ({ x: rand() * 100, y: 60 + rand() * 50, r: 0.15 + rand() * 0.55, d: 9 + rand() * 12, delay: rand() * -20 }))
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id.agua} x1="0" y1="0" x2="0" y2="1">
          {stop(0, 'var(--color-noche-3)')}
          {stop(0.45, 'var(--color-noche-2)')}
          {stop(1, 'var(--color-noche)')}
        </linearGradient>
        <radialGradient id={id.superficie} cx="0.5" cy="0.5" r="0.5">
          {stop(0, 'var(--color-cobre-2)', 0.55)}
          {stop(0.5, 'var(--color-cobre)', 0.2)}
          {stop(1, 'var(--color-cobre)', 0)}
        </radialGradient>
        <linearGradient id={id.rayo} x1="0" y1="0" x2="0" y2="1">
          {stop(0, 'var(--color-cal)', 0.3)}
          {stop(1, 'var(--color-cal)', 0)}
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id.agua})`} />
      <ellipse cx="78" cy="0" rx="60" ry="30" fill={`url(#${id.superficie})`} />
      <g className="rayos">
        <polygon points="58,0 66,0 52,80 40,80" fill={`url(#${id.rayo})`} />
        <polygon points="72,0 77,0 70,70 62,70" fill={`url(#${id.rayo})`} opacity="0.7" />
        <polygon points="84,0 92,0 90,90 78,90" fill={`url(#${id.rayo})`} opacity="0.8" />
        <polygon points="40,0 44,0 30,60 24,60" fill={`url(#${id.rayo})`} opacity="0.5" />
      </g>
      {bubbles.map((b, i) => (
        <circle
          key={i}
          className="burbuja"
          cx={b.x}
          cy={b.y}
          r={b.r}
          fill="none"
          strokeWidth="0.12"
          style={vars({ stroke: 'var(--color-cal)', strokeOpacity: 0.45, '--d': `${b.d}s`, '--delay': `${b.delay}s` })}
        />
      ))}
    </svg>
  )
}

/** Ladera de noche con luces de casas que titilan. */
function Luces() {
  const id = useIds('cielo', 'lampara', 'brillo')
  const lights = useAzar(13, 170, (rand) => {
    const x = rand() * 100
    const ridge = 52 + Math.sin(x / 14) * 7 + Math.abs(x - 50) * -0.12
    return { x, y: ridge + rand() * (100 - ridge), r: 0.08 + rand() * 0.22, d: 3 + rand() * 5, delay: rand() * -6, warm: rand() > 0.15 }
  })
  const luciernagas = useAzar(31, 34, (rand) => ({ x: rand() * 100, y: 15 + rand() * 55, r: 0.35 + rand() * 0.45, d: 6 + rand() * 8, delay: rand() * -14, dx: `${3 + rand() * 6}px`, dy: `${2 + rand() * 5}px` }))
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id.cielo} x1="0" y1="0" x2="0" y2="1">
          {stop(0, 'var(--color-noche-2)')}
          {stop(0.5, 'var(--color-noche-3)')}
          {stop(1, 'var(--color-noche)')}
        </linearGradient>
        <radialGradient id={id.lampara} cx="0.5" cy="0.5" r="0.5">
          {stop(0, 'var(--color-cobre-2)', 0.7)}
          {stop(0.45, 'var(--color-cobre)', 0.3)}
          {stop(1, 'var(--color-cobre)', 0)}
        </radialGradient>
        <radialGradient id={id.brillo}>
          {stop(0, 'var(--color-cobre)', 0.3)}
          {stop(1, 'var(--color-cobre)', 0)}
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id.cielo})`} />
      <ellipse className="respirar" cx="84" cy="6" rx="62" ry="44" fill={`url(#${id.lampara})`} />
      {/* Neblina que cruza el cielo. */}
      {[{ cy: 30, ry: 5, d: 45, delay: -10 }, { cy: 42, ry: 4, d: 60, delay: -38 }].map((n, i) => (
        <ellipse key={i} className="neblina" cx="0" cy={n.cy} rx="45" ry={n.ry} style={vars({ fill: 'var(--color-cal)', opacity: 0.06, '--d': `${n.d}s`, '--delay': `${n.delay}s` })} />
      ))}
      <ellipse cx="50" cy="80" rx="70" ry="24" fill={`url(#${id.brillo})`} />
      <path d="M0 58 C 14 48, 26 52, 38 46 S 62 44, 74 50 S 92 46, 100 52 L100 100 L0 100Z" style={{ fill: 'var(--color-noche)' }} />
      {lights.map((l, i) => (
        <circle key={i} className="luz" cx={l.x} cy={l.y} r={l.r} style={vars({ fill: l.warm ? 'var(--color-cobre-2)' : 'var(--color-cal)', '--d': `${l.d}s`, '--delay': `${l.delay}s` })} />
      ))}
      {luciernagas.map((l, i) => (
        <circle key={`f${i}`} className="luciernaga" cx={l.x} cy={l.y} r={l.r} style={vars({ fill: 'var(--color-cobre-2)', filter: 'drop-shadow(0 0 1.2px var(--color-cobre-2))', '--d': `${l.d}s`, '--delay': `${l.delay}s`, '--dx': l.dx, '--dy': l.dy })} />
      ))}
    </svg>
  )
}

/** Cielo de noche: estrellas que titilan y, de vez en cuando, una fugaz. */
function Estrellas() {
  const id = useIds('noche')
  const stars = useAzar(21, 340, (rand) => ({ x: -60 + rand() * 220, y: -60 + rand() * 220, r: 0.09 + rand() ** 3 * 0.42, d: 2 + rand() * 5, delay: rand() * -6, color: rand() > 0.8 }))
  return (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={id.noche} cx="0.75" cy="0.05" r="0.9">
            {stop(0, 'var(--color-noche-3)')}
            {stop(0.6, 'var(--color-noche-2)')}
            {stop(1, 'var(--color-noche)')}
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${id.noche})`} />
        <g className="cielo-gira">
        {stars.map((s, i) => (
          <circle key={i} className="luz" cx={s.x} cy={s.y} r={s.r} style={vars({ fill: s.color ? 'var(--color-cobre-2)' : 'var(--color-cal)', '--d': `${s.d}s`, '--delay': `${s.delay}s` })} />
        ))}
        </g>
      </svg>
      {[
        { top: '12%', left: '8%', d: '6s', delay: '-1s' },
        { top: '30%', left: '40%', d: '8s', delay: '-5s' },
        { top: '6%', left: '55%', d: '7s', delay: '-3s' },
        { top: '22%', left: '-5%', d: '9s', delay: '-7s' },
        { top: '40%', left: '20%', d: '10s', delay: '-2s' },
      ].map((f, i) => (
        <span key={i} className="fugaz" style={vars({ top: f.top, left: f.left, '--d': f.d, '--delay': f.delay })} />
      ))}
    </>
  )
}

/** Chispas que suben desde abajo y se apagan. */
function Brasas() {
  const chispas = useAzar(5, 56, (rand) => ({ x: rand() * 100, t: 2.5 + rand() * 4.5, d: 6 + rand() * 9, delay: rand() * -15, dx: (rand() - 0.5) * 80 }))
  return (
    <div className="absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_100%,color-mix(in_oklab,var(--color-cobre)_35%,transparent),transparent_70%),linear-gradient(180deg,var(--color-noche),var(--color-noche-2))]">
      {chispas.map((c, i) => (
        <span
          key={i}
          className="columna brasa"
          style={vars({ left: `${c.x}%`, '--t': `${c.t}px`, '--d': `${c.d}s`, '--delay': `${c.delay}s`, '--dx': `${c.dx}px`, '--anim': 'subir-columna' })}
        >
          <i />
        </span>
      ))}
    </div>
  )
}

/** Círculos de luz grandes y desenfocados que van a la deriva. */
function Bokeh() {
  const luces = useAzar(17, 16, (rand) => ({
    x: rand() * 100, y: rand() * 100, s: 12 + rand() * 30, d: 5 + rand() * 6, delay: rand() * -10,
    dx: `${(rand() - 0.5) * 140}%`, dy: `${(rand() - 0.5) * 140}%`, claro: rand() > 0.5, o: 0.18 + rand() * 0.3,
  }))
  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--color-noche-3),var(--color-noche)_65%)]">
      {luces.map((l, i) => (
        <span
          key={i}
          className="bokeh"
          style={vars({
            left: `${l.x - l.s / 2}%`, top: `${l.y - l.s / 2}%`, width: `${l.s}%`, aspectRatio: '1', '--o': l.o,
            background: `radial-gradient(closest-side, ${l.claro ? 'var(--color-cobre-2)' : 'var(--color-cobre)'}, transparent)`,
            '--d': `${l.d}s`, '--delay': `${l.delay}s`, '--dx': l.dx, '--dy': l.dy,
          })}
        />
      ))}
    </div>
  )
}

/** Lucecitas que vagan por todo el fondo y parpadean, sobre un resplandor que respira. */
function Luciernagas() {
  const luces = useAzar(41, 40, (rand) => ({
    x: rand() * 100, y: 10 + rand() * 85, t: 2.5 + rand() * 3.5, d: 9 + rand() * 10, delay: rand() * -18, p: 2.5 + rand() * 3.5,
    dx: `${(rand() - 0.5) * 16}%`, dy: `${4 + rand() * 8}%`,
  }))
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-noche),var(--color-noche-2))]">
      <div className="respirar absolute -inset-x-[20%] bottom-[-30%] h-[80%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-cobre)_32%,transparent),transparent)]" />
      {luces.map((l, i) => (
        <span key={i} className="capa luciernaga-p" style={vars({ '--d': `${l.d}s`, '--delay': `${l.delay}s`, '--dx': l.dx, '--dy': l.dy })}>
          <i style={vars({ left: `${l.x}%`, top: `${l.y}%`, '--t': `${l.t}px`, '--p': `${l.p}s` })} />
        </span>
      ))}
    </div>
  )
}

/** Un foco desde arriba y polvo brillante que cae despacio dentro de su luz. */
function Polvo() {
  const motas = useAzar(23, 60, (rand) => ({ x: 8 + rand() * 84, t: 1.5 + rand() * 3, d: 12 + rand() * 14, delay: rand() * -26, dx: (rand() - 0.5) * 60, p: 1.5 + rand() * 2.5 }))
  return (
    <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,color-mix(in_oklab,var(--color-cobre)_30%,transparent),transparent_75%),linear-gradient(180deg,var(--color-noche-2),var(--color-noche))]">
      <div className="foco absolute inset-x-0 top-0 h-full [clip-path:polygon(38%_0,62%_0,95%_100%,5%_100%)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-cobre-2)_30%,transparent),transparent_85%)]" />
      {motas.map((m, i) => (
        <span key={i} className="columna polvo" style={vars({ left: `${m.x}%`, '--t': `${m.t}px`, '--d': `${m.d}s`, '--delay': `${m.delay}s`, '--dx': `${m.dx}px`, '--anim': 'caer-columna' })}>
          <i style={vars({ '--p': `${m.p}s` })} />
        </span>
      ))}
    </div>
  )
}

/** Chispas rápidas que salen en abanico desde un punto de luz abajo, como una bengala. */
function Bengalas() {
  const chispas = useAzar(57, 64, (rand) => ({ x: 44 + rand() * 12, t: 1.5 + rand() * 3, d: 2.4 + rand() * 3, delay: rand() * -6, dx: (rand() - 0.5) * 520 }))
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--color-noche),var(--color-noche-2))]">
      <div className="destello-fuente absolute -inset-x-[10%] bottom-[-25%] h-[70%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-cobre-2)_55%,transparent),color-mix(in_oklab,var(--color-cobre)_20%,transparent)_45%,transparent)]" />
      {chispas.map((c, i) => (
        <span key={i} className="columna bengala" style={vars({ left: `${c.x}%`, '--t': `${c.t}px`, '--d': `${c.d}s`, '--delay': `${c.delay}s`, '--dx': `${c.dx}px`, '--anim': 'subir-columna' })}>
          <i />
        </span>
      ))}
    </div>
  )
}

/** Burbujas brillantes que suben bamboleándose, como en una copa de champaña. */
function Burbujas() {
  const burbujas = useAzar(73, 42, (rand) => ({ x: rand() * 100, t: 4 + rand() * 10, d: 8 + rand() * 10, delay: rand() * -18, dx: (rand() - 0.5) * 40, g: 1.6 + rand() * 2 }))
  return (
    <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,color-mix(in_oklab,var(--color-cobre)_22%,transparent),transparent_70%),radial-gradient(90%_45%_at_50%_100%,color-mix(in_oklab,var(--color-cobre)_28%,transparent),transparent_70%),linear-gradient(180deg,var(--color-noche-2),var(--color-noche))]">
      {burbujas.map((b, i) => (
        <span key={i} className="columna burbuja-luz" style={vars({ left: `${b.x}%`, '--t': `${b.t}px`, '--d': `${b.d}s`, '--delay': `${b.delay}s`, '--dx': `${b.dx}px`, '--anim': 'subir-columna' })}>
          <i style={vars({ '--g': `${b.g}s` })} />
        </span>
      ))}
    </div>
  )
}

/** Reflectores que barren el fondo y estrellitas de cuatro puntas que se encienden y apagan. */
function Destellos() {
  const estrellas = useAzar(89, 34, (rand) => ({ x: rand() * 100, y: rand() * 100, t: 5 + rand() * 9, d: 2.5 + rand() * 4, delay: rand() * -7, dx: `${(rand() - 0.5) * 6}%`, dy: `${2 + rand() * 4}%` }))
  return (
    <div className="absolute inset-0 bg-[radial-gradient(90%_50%_at_50%_100%,color-mix(in_oklab,var(--color-cobre)_26%,transparent),transparent_70%),linear-gradient(180deg,var(--color-noche),var(--color-noche-2))]">
      {[{ left: '-10%', d: '9s', delay: '0s' }, { left: '35%', d: '11s', delay: '-4s' }].map((r, i) => (
        <span key={i} className="reflector" style={vars({ left: r.left, '--d': r.d, '--delay': r.delay })} />
      ))}
      {estrellas.map((e, i) => (
        <span key={i} className="capa" style={vars({ '--d': `${e.d * 3}s`, '--delay': `${e.delay}s`, '--dx': e.dx, '--dy': e.dy })}>
          <i className="centella" style={vars({ left: `${e.x}%`, top: `${e.y}%`, '--t': `${e.t}px`, '--p': `${e.d}s`, '--delay': `${e.delay}s` })} />
        </span>
      ))}
    </div>
  )
}
