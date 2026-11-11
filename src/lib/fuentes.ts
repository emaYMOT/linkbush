/**
 * Fuentes de Google Fonts que se pueden elegir en el panel.
 * `pesos` son los grosores que existen de verdad: Google rechaza la petición entera si se pide uno que no existe.
 */
export interface Fuente {
  nombre: string
  grupo: 'Serif elegante' | 'Sans moderna' | 'Display'
  pesos: number[]
}

const rango = (desde: number, hasta: number) => Array.from({ length: (hasta - desde) / 100 + 1 }, (_, i) => desde + i * 100)

export const FUENTES: Fuente[] = [
  { nombre: 'Cormorant Garamond', grupo: 'Serif elegante', pesos: rango(300, 700) },
  { nombre: 'Fraunces', grupo: 'Serif elegante', pesos: rango(100, 900) },
  { nombre: 'Libre Baskerville', grupo: 'Serif elegante', pesos: [400, 700] },
  { nombre: 'Marcellus', grupo: 'Serif elegante', pesos: [400] },

  { nombre: 'Outfit', grupo: 'Sans moderna', pesos: rango(100, 900) },
  { nombre: 'DM Sans', grupo: 'Sans moderna', pesos: rango(100, 900) },
  { nombre: 'Onest', grupo: 'Sans moderna', pesos: rango(100, 900) },
  { nombre: 'Figtree', grupo: 'Sans moderna', pesos: rango(300, 900) },

  { nombre: 'Syne', grupo: 'Display', pesos: rango(400, 800) },
]

export const GRUPOS = ['Serif elegante', 'Sans moderna', 'Display'] as const

/** Nombre de cada grosor, para el panel. */
export const NOMBRE_PESO: Record<number, string> = {
  100: 'Ultrafina', 200: 'Extrafina', 300: 'Fina', 400: 'Normal', 500: 'Media', 600: 'Seminegrita', 700: 'Negrita', 800: 'Extranegrita', 900: 'Black',
}

const RESPALDO: Record<Fuente['grupo'], string> = {
  'Serif elegante': 'Georgia, serif',
  'Sans moderna': 'system-ui, sans-serif',
  Display: 'Impact, system-ui, sans-serif',
}

export function fuente(nombre: string): Fuente {
  return FUENTES.find((f) => f.nombre === nombre) ?? { nombre, grupo: 'Sans moderna', pesos: [400] }
}

/** Valor para font-family, con un respaldo parecido mientras carga. */
export function pilaDe(nombre: string): string {
  return `"${nombre}", ${RESPALDO[fuente(nombre).grupo]}`
}

/** El grosor disponible más cercano al pedido. */
export function pesoCercano(nombre: string, deseado: number): number {
  return fuente(nombre).pesos.reduce((best, p) => (Math.abs(p - deseado) < Math.abs(best - deseado) ? p : best))
}

/** Un solo enlace de Google Fonts con las familias y grosores que usa una página. */
export function urlFuentes(pedidos: { nombre: string; pesos: number[] }[]): string {
  const porFamilia = new Map<string, Set<number>>()
  for (const { nombre, pesos } of pedidos) {
    const disponibles = fuente(nombre).pesos
    const set = porFamilia.get(nombre) ?? new Set<number>()
    for (const p of pesos) set.add(disponibles.includes(p) ? p : pesoCercano(nombre, p))
    porFamilia.set(nombre, set)
  }
  const familias = [...porFamilia].map(([nombre, set]) => {
    const pesos = [...set].sort((a, b) => a - b)
    const nombreUrl = nombre.replace(/ /g, '+')
    return fuente(nombre).pesos.length === 1 ? `family=${nombreUrl}` : `family=${nombreUrl}:wght@${pesos.join(';')}`
  })
  return `https://fonts.googleapis.com/css2?${familias.join('&')}&display=swap`
}

/**
 * Para las muestras del panel: cada familia baja solo las letras del texto indicado (muy liviano).
 * Sin argumentos, todas las fuentes con las letras de sus propios nombres (para el selector).
 */
export function urlMuestras(nombres: string[] = FUENTES.map((f) => f.nombre), texto = nombres.join('')): string {
  const letras = [...new Set(texto + 'Aa$0123456789.')].join('')
  const familias = [...new Set(nombres)].map((n) => `family=${n.replace(/ /g, '+')}`)
  return `https://fonts.googleapis.com/css2?${familias.join('&')}&text=${encodeURIComponent(letras)}&display=swap`
}

/** Carga (una vez por URL) una hoja de Google Fonts en el panel. */
export function cargarHoja(href: string) {
  if (document.querySelector(`link[data-muestra][href="${CSS.escape(href)}"]`)) return
  const el = document.createElement('link')
  el.rel = 'stylesheet'
  el.href = href
  el.dataset.muestra = ''
  document.head.appendChild(el)
}
