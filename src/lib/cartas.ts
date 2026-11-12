import type { Carta, Idioma } from './types'
import { slugify, type Palabras } from './vocab'

/** Textos fijos de la carta pública. La principal los arma con el vocabulario de la página; una carta en inglés, en inglés. */
export interface TextosCarta {
  inicio: string
  volver: string // aria-label de la flecha que vuelve a la lista de categorías
  uno: string
  varios: string
  agotado: string
  consultar: string
  precioAgotado: string // solo lectores de pantalla
  error: string
  vacia: string
  cargando: string
  categorias: string
  secciones: (categoria: string) => string
  otrasCartas: string
}

/** Una carta tal como la ve el público: la principal (id null) o una adicional. */
export interface CartaPublica {
  id: string | null
  ruta: string
  nombre: string // en el selector de cartas
  idioma: Idioma
  titulo: string
  subtitulo: string
  t: TextosCarta
}

function textosEs(m: Palabras): TextosCarta {
  return {
    inicio: 'Inicio',
    volver: `Volver a ${m.el}`,
    uno: m.uno,
    varios: m.varios,
    agotado: m.agotado,
    consultar: 'Consultar precio',
    precioAgotado: 'Precio, agotado: ',
    error: `No pudimos cargar ${m.el}. Revisa tu conexión y vuelve a intentarlo.`,
    vacia: `Estamos actualizando ${m.el}. Vuelve en un rato.`,
    cargando: `Cargando ${m.el}`,
    categorias: 'Categorías',
    secciones: (c) => `Secciones de ${c}`,
    otrasCartas: 'Otras cartas',
  }
}

const TEXTOS_EN: TextosCarta = {
  inicio: 'Home',
  volver: 'Back to the menu',
  uno: 'item',
  varios: 'items',
  agotado: 'Sold out',
  consultar: 'Ask for price',
  precioAgotado: 'Price, sold out: ',
  error: "We couldn't load the menu. Check your connection and try again.",
  vacia: "We're updating the menu. Please check back soon.",
  cargando: 'Loading the menu',
  categorias: 'Categories',
  secciones: (c) => `Sections of ${c}`,
  otrasCartas: 'Other menus',
}

export function textosCarta(idioma: Idioma, m: Palabras): TextosCarta {
  return idioma === 'en' ? TEXTOS_EN : textosEs(m)
}

export function cartaPrincipal(m: Palabras): CartaPublica {
  return { id: null, ruta: m.ruta, nombre: m.seccion, idioma: 'es', titulo: m.titulo, subtitulo: m.subtitulo, t: textosEs(m) }
}

export function cartaPublica(c: Carta, m: Palabras): CartaPublica {
  const en = c.idioma === 'en'
  return {
    id: c.id,
    ruta: c.ruta,
    nombre: c.name,
    idioma: c.idioma,
    titulo: c.titulo?.trim() || (en ? 'Our menu' : c.name),
    subtitulo: c.subtitulo?.trim() ?? '',
    t: textosCarta(c.idioma, m),
  }
}

export const IDIOMAS: { value: Idioma; label: string; hint: string }[] = [
  { value: 'es', label: 'Español', hint: 'Inicio, Agotado, Consultar precio…' },
  { value: 'en', label: 'Inglés', hint: 'Home, Sold out, Ask for price…' },
]

/** Error de la dirección de una carta ("" si está bien). No puede repetir la de la principal ni la de otra carta. */
export function rutaCartaError(ruta: string, principal: string, cartas: Carta[], except?: string): string {
  if (!ruta) return 'Escribe la dirección de la carta.'
  if (ruta.length < 2) return 'Usa al menos 2 letras.'
  if (!/^[a-z0-9]+$/.test(ruta)) return 'Solo minúsculas y números (sin guiones, tildes ni espacios).'
  if (ruta === principal) return 'Esa es la dirección de la carta principal. Elige otra.'
  if (cartas.some((c) => c.ruta === ruta && c.id !== except)) return 'Ya hay otra carta con esa dirección.'
  return ''
}

/** Sugerencia de dirección a partir del nombre: "English menu" -> "englishmenu". */
export const rutaSugerida = (nombre: string) => slugify(nombre)
