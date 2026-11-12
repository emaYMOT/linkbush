import type { Vocab } from './types'

/** Vocabulario inicial según el tipo de negocio. Después se cambia en Ajustes. */
export const VOCAB_PRESETS: Record<Vocab['tipo'], Vocab> = {
  restaurante: {
    tipo: 'restaurante',
    seccion: 'Carta',
    generoSeccion: 'f',
    titulo: 'Nuestra carta',
    subtitulo: 'Elige una categoría y antójate.',
    boton: 'Nuestra Carta',
    producto: { uno: 'opción', varios: 'opciones', genero: 'f' },
    agotado: 'Agotado por hoy',
    disponible: { etiqueta: 'Disponible hoy', ayuda: 'Apágalo cuando se acabe: se verá como agotado.' },
    unidades: [],
    unidadPorDefecto: null,
    ejemplos: { producto: 'Chicharrón crocante', descripcionProducto: 'Ingredientes o cómo se sirve.', categoria: 'Entradas', boton: 'Reservar por WhatsApp', subcategoria: 'Jugos naturales' },
  },
  tienda: {
    tipo: 'tienda',
    seccion: 'Catálogo',
    generoSeccion: 'm',
    titulo: 'Nuestro catálogo',
    subtitulo: 'Elige tus productos.',
    boton: 'Nuestro Catálogo',
    producto: { uno: 'producto', varios: 'productos', genero: 'm' },
    agotado: 'Agotado',
    disponible: { etiqueta: 'Disponible', ayuda: 'Apágalo cuando no haya existencias: se verá como agotado.' },
    unidades: ['lb', 'unidad', 'kg'],
    unidadPorDefecto: 'lb',
    ejemplos: { producto: 'Filete de tilapia roja', descripcionProducto: 'Presentación, corte o peso. Por ejemplo: bandeja de 500 g.', categoria: 'Mariscos', boton: 'Pedir por WhatsApp', subcategoria: 'Congelados' },
  },
}

/** "Catálogo" -> "catalogo", "Pez y Mar" -> "pezymar": solo minúsculas y números, sin guiones (direcciones de páginas y cartas). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40)
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Frases armadas con el vocabulario: "el catálogo", "del catálogo", "Plato guardado"… */
export function palabras(v: Vocab) {
  const s = v.seccion.trim().toLowerCase() || 'carta'
  const f = v.generoSeccion === 'f'
  const pf = v.producto.genero === 'f'
  const o = pf ? 'a' : 'o'
  const uno = v.producto.uno.trim() || 'producto'
  return {
    ruta: slugify(v.seccion) || 'carta', // /<slug>/<ruta>
    seccion: cap(v.seccion.trim() || 'Carta'),
    el: `${f ? 'la' : 'el'} ${s}`,
    del: f ? `de la ${s}` : `del ${s}`,
    en: `en ${f ? 'la' : 'el'} ${s}`,
    titulo: v.titulo,
    subtitulo: v.subtitulo,
    boton: v.boton,
    uno,
    varios: v.producto.varios.trim() || `${uno}s`,
    Uno: cap(uno),
    o, // terminación: guardad-o / guardad-a
    este: pf ? 'esta' : 'este',
    nuevo: pf ? 'Nueva' : 'Nuevo',
    delProducto: pf ? `de la ${uno}` : `del ${uno}`,
    unoArt: `${pf ? 'la primera' : 'el primer'} ${uno}`,
    agotado: v.agotado,
    disponible: v.disponible,
    unidades: v.unidades,
    unidadPorDefecto: v.unidadPorDefecto,
    ejemplos: v.ejemplos,
  }
}

export type Palabras = ReturnType<typeof palabras>
