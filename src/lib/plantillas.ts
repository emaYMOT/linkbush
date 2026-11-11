import type { Theme } from './types'

/** Un tema de color: los colores de la página y el tinte del video. Sirve con cualquier plantilla. */
export interface TemaColor {
  id: string
  nombre: string
  colores: Theme['colores']
  tinte: string
}

/** Una plantilla: letras, efecto de fondo, botones y aro de la foto. Los colores van aparte (temas de color). */
export interface Plantilla {
  id: string
  descripcion: string // solo para el texto de ayuda: las plantillas no llevan nombre
  temaColor: string // el tema de color con el que arranca una página nueva
  estilo: {
    fuentes: Theme['fuentes']
    fondo: Pick<Theme['fondo'], 'efecto' | 'tinteFuerza' | 'oscurecerInicio' | 'oscurecerCatalogo'>
    botones: Theme['botones']
    avatar: Theme['avatar']
  }
}

/** Todas comparten el fondo de brasas, el tinte y los velos; cambian letras, sombra, difuminado y aro. */
const FONDO: Plantilla['estilo']['fondo'] = { efecto: 'brasas', tinteFuerza: 25, oscurecerInicio: 10, oscurecerCatalogo: 20 }

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'al-aire',
    descripcion: 'Títulos clásicos en Libre Baskerville negrita y textos en Outfit.',
    temaColor: 'cobre',
    estilo: {
      fuentes: { titulos: 'Libre Baskerville', textos: 'Outfit', precios: 'Fraunces', pesoTitulos: 700, pesoTextos: 400, pesoPrecios: 500 },
      fondo: FONDO,
      botones: { estilo: 'vidrio', forma: 'pildora', difuminado: 47, sombra: 'marcada', tamano: 'normal' },
      avatar: { aro: 'fino', forma: 'circulo' },
    },
  },
  {
    id: 'pez-y-mar',
    descripcion: 'Títulos elegantes en Cormorant Garamond y textos en Onest.',
    temaColor: 'oceano',
    estilo: {
      fuentes: { titulos: 'Cormorant Garamond', textos: 'Onest', precios: 'Fraunces', pesoTitulos: 600, pesoTextos: 400, pesoPrecios: 500 },
      fondo: FONDO,
      botones: { estilo: 'vidrio', forma: 'pildora', difuminado: 47, sombra: 'marcada', tamano: 'normal' },
      avatar: { aro: 'fino', forma: 'circulo' },
    },
  },
  {
    id: 'qhubole',
    descripcion: 'Todo en Outfit, con títulos extra gruesos y botones de sombra suave.',
    temaColor: 'lavanda',
    estilo: {
      fuentes: { titulos: 'Outfit', textos: 'Outfit', precios: 'Fraunces', pesoTitulos: 800, pesoTextos: 400, pesoPrecios: 500 },
      fondo: FONDO,
      botones: { estilo: 'vidrio', forma: 'pildora', difuminado: 40, sombra: 'suave', tamano: 'normal' },
      avatar: { aro: 'brillo', forma: 'circulo' },
    },
  },
  {
    id: 'mia-rooftop',
    descripcion: 'Títulos extra gruesos en Outfit, textos en Onest y botones más transparentes.',
    temaColor: 'cafe',
    estilo: {
      fuentes: { titulos: 'Outfit', textos: 'Onest', precios: 'Fraunces', pesoTitulos: 800, pesoTextos: 400, pesoPrecios: 500 },
      fondo: FONDO,
      botones: { estilo: 'vidrio', forma: 'pildora', difuminado: 20, sombra: 'marcada', tamano: 'normal' },
      avatar: { aro: 'brillo', forma: 'circulo' },
    },
  },
]

/** Los mismos temas para todas las plantillas. Fondos oscuros: así lucen las brasas y los botones de vidrio. */
export const TEMAS_COLOR: TemaColor[] = [
  {
    id: 'cobre',
    nombre: 'Cobre nocturno',
    colores: { fondo: '#110d0a', fondo2: '#1d1712', fondo3: '#2b221b', acento: '#f0a070', acento2: '#f8b487', texto: '#f2eadf', textoSuave: '#b3a593', alerta: '#e8705e' },
    tinte: '#3a1d0c',
  },
  {
    id: 'oceano',
    nombre: 'Océano',
    colores: { fondo: '#06121d', fondo2: '#0c1f30', fondo3: '#143049', acento: '#38bfc6', acento2: '#6fd6dc', texto: '#eaf5f8', textoSuave: '#a3bccb', alerta: '#ff8a7a' },
    tinte: '#0a3a5c',
  },
  {
    id: 'lavanda',
    nombre: 'Lavanda',
    colores: { fondo: '#0a0a0f', fondo2: '#16161f', fondo3: '#22222e', acento: '#b3b8cc', acento2: '#b2bdf5', texto: '#f1f2f7', textoSuave: '#a9adbf', alerta: '#e98a6c' },
    tinte: '#1a1d33',
  },
  {
    id: 'cafe',
    nombre: 'Café tostado',
    colores: { fondo: '#16100c', fondo2: '#241a14', fondo3: '#34261d', acento: '#c8a27a', acento2: '#e0c29e', texto: '#f5ece2', textoSuave: '#b9a794', alerta: '#e98a6c' },
    tinte: '#3b2412',
  },
  {
    id: 'brasa',
    nombre: 'Brasa roja',
    colores: { fondo: '#120a08', fondo2: '#221310', fondo3: '#331c17', acento: '#ef5a2f', acento2: '#ff8550', texto: '#fbeee6', textoSuave: '#c4a598', alerta: '#ffb347' },
    tinte: '#4a1408',
  },
  {
    id: 'vino',
    nombre: 'Vino tinto',
    colores: { fondo: '#14090b', fondo2: '#231114', fondo3: '#341a1f', acento: '#e07a8b', acento2: '#f0a3b0', texto: '#f7ecee', textoSuave: '#c09ca3', alerta: '#ffb35c' },
    tinte: '#4a0f1c',
  },
  {
    id: 'mango',
    nombre: 'Mango',
    colores: { fondo: '#0f0d07', fondo2: '#1c180d', fondo3: '#2b2414', acento: '#f5b83d', acento2: '#ffd27a', texto: '#fbf3e1', textoSuave: '#c4b48f', alerta: '#ff7a6b' },
    tinte: '#4a3608',
  },
  {
    id: 'oro',
    nombre: 'Carbón y oro',
    colores: { fondo: '#0b0b0c', fondo2: '#161617', fondo3: '#232325', acento: '#d4af37', acento2: '#e8c766', texto: '#f3f0e8', textoSuave: '#a9a49a', alerta: '#e5735f' },
    tinte: '#1a1405',
  },
  {
    id: 'selva',
    nombre: 'Selva',
    colores: { fondo: '#08130e', fondo2: '#102219', fondo3: '#183326', acento: '#9fd356', acento2: '#c2ea84', texto: '#eef6ea', textoSuave: '#a4bba8', alerta: '#ff9a76' },
    tinte: '#123d22',
  },
  {
    id: 'menta',
    nombre: 'Pizarra y menta',
    colores: { fondo: '#0d1013', fondo2: '#171c21', fondo3: '#222a31', acento: '#6fe0b4', acento2: '#9cf0cf', texto: '#eef3f5', textoSuave: '#a3b0b8', alerta: '#ff8a7a' },
    tinte: '#12303a',
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    colores: { fondo: '#120c18', fondo2: '#1f1528', fondo3: '#2e2039', acento: '#ff9e7d', acento2: '#ffc2a8', texto: '#f8eef5', textoSuave: '#bba7bf', alerta: '#ffd166' },
    tinte: '#3d1a4a',
  },
  {
    id: 'neon',
    nombre: 'Neón',
    colores: { fondo: '#0a0614', fondo2: '#150d26', fondo3: '#21143b', acento: '#ff3ec8', acento2: '#4de4ff', texto: '#f4efff', textoSuave: '#b6a8d6', alerta: '#ffcf4d' },
    tinte: '#3a0a5c',
  },
  {
    id: 'morado',
    nombre: 'Morado',
    colores: { fondo: '#0f0a18', fondo2: '#1a1229', fondo3: '#271b3d', acento: '#a77bff', acento2: '#c7a8ff', texto: '#f3eefc', textoSuave: '#b0a4c8', alerta: '#ff8a7a' },
    tinte: '#2e1460',
  },
  {
    id: 'zafiro',
    nombre: 'Zafiro',
    colores: { fondo: '#070b1a', fondo2: '#0f1630', fondo3: '#18224a', acento: '#6e9bff', acento2: '#a4c0ff', texto: '#eef2ff', textoSuave: '#a3add0', alerta: '#ff8a7a' },
    tinte: '#0d1a52',
  },
  {
    id: 'coral',
    nombre: 'Coral',
    colores: { fondo: '#0a1414', fondo2: '#122222', fondo3: '#1c3232', acento: '#ff7f6b', acento2: '#ffa898', texto: '#f2f7f5', textoSuave: '#a6bab5', alerta: '#ffd166' },
    tinte: '#0f3a3a',
  },
  {
    id: 'cacao',
    nombre: 'Cacao y rosa',
    colores: { fondo: '#120b0a', fondo2: '#1f1412', fondo3: '#2e1e1b', acento: '#e8a598', acento2: '#f5c6bc', texto: '#f8eeeb', textoSuave: '#bfa29c', alerta: '#ffb35c' },
    tinte: '#3d1a14',
  },
  {
    id: 'hielo',
    nombre: 'Hielo',
    colores: { fondo: '#0b0e12', fondo2: '#151a21', fondo3: '#1f2630', acento: '#9fd8ff', acento2: '#cdeeff', texto: '#f0f6fb', textoSuave: '#a5b2bf', alerta: '#ff8a7a' },
    tinte: '#14304a',
  },
  {
    id: 'fucsia',
    nombre: 'Fucsia',
    colores: { fondo: '#13070f', fondo2: '#22101c', fondo3: '#33182b', acento: '#ff6fb5', acento2: '#ffa3d1', texto: '#fbeef6', textoSuave: '#c39fb4', alerta: '#ffd166' },
    tinte: '#4a0f35',
  },
]

const temaColor = (id: string) => TEMAS_COLOR.find((t) => t.id === id) ?? TEMAS_COLOR[0]

/** Le pone a un diseño los colores y el tinte de un tema de color; lo demás queda igual. */
export function conTemaColor(theme: Theme, id: string): Theme {
  const t = temaColor(id)
  return { ...theme, paleta: t.id, colores: { ...t.colores }, fondo: { ...theme.fondo, tinte: t.tinte } }
}

/**
 * El diseño de una plantilla. Sobre una página que ya existe (`actual`) cambia letras, fondo, botones y aro,
 * y conserva sus colores, su tinte y el video. Sin `actual`, usa el tema de color de la plantilla
 * (o el indicado en `paleta`).
 */
export function temaDePlantilla(id: string, actual?: Theme, paleta?: string): Theme {
  const p = PLANTILLAS.find((x) => x.id === id) ?? PLANTILLAS[0]
  const t = temaColor(paleta ?? p.temaColor)
  const e = structuredClone(p.estilo)
  return {
    plantilla: p.id,
    paleta: actual ? (actual.paleta ?? null) : t.id,
    colores: actual ? { ...actual.colores } : { ...t.colores },
    fuentes: e.fuentes,
    fondo: { ...e.fondo, tinte: actual ? actual.fondo.tinte : t.tinte, video: actual?.fondo.video ?? null },
    botones: e.botones,
    avatar: e.avatar,
  }
}
