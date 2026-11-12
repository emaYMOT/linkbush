export type LinkType = 'url' | 'menu'
export type PriceUnit = 'lb' | 'unidad' | 'kg'

/** Una página publicada (un negocio). Todo su contenido cuelga de aquí con site_id. */
export interface Site {
  id: string
  slug: string // dirección: /<slug>
  name: string
  description: string
  avatar_url: string | null
  published: boolean // false = borrador: solo lo ve el administrador
  theme: Theme
  vocab: Vocab
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type Efecto = 'brasas' | 'luciernagas' | 'polvo' | 'bengalas' | 'burbujas' | 'destellos' | 'mar' | 'luces' | 'estrellas' | 'bokeh' | 'ninguno'
export type EstiloBoton = 'vidrio' | 'solido' | 'borde' | 'degradado' | 'neon' | 'suave' | 'minimal' | 'relieve'
export type FormaBoton = 'pildora' | 'redondeado' | 'suave' | 'recto' | 'hoja'
export type SombraBoton = 'ninguna' | 'suave' | 'marcada' | 'flotante' | 'brillo'
export type TamanoBoton = 'compacto' | 'normal' | 'grande'
export type AroAvatar = 'ninguno' | 'fino' | 'doble' | 'brillo' | 'halo' | 'fuego' | 'resplandor' | 'degradado' | 'historia' | 'giratorio' | 'pulso' | 'punteado'
export type FormaAvatar = 'circulo' | 'redondeado'

/** Diseño de una página: se aplica como variables CSS al abrirla. */
export interface Theme {
  plantilla: string | null // id de la plantilla de la que salió (solo informativo)
  paleta?: string | null // id del tema de color aplicado (solo informativo; se pierde al editar un color)
  colores: {
    fondo: string
    fondo2: string // tarjetas y barras
    fondo3: string
    acento: string
    acento2: string
    texto: string
    textoSuave: string
    alerta: string // "Agotado"
  }
  fuentes: {
    titulos: string
    textos: string
    precios: string
    pesoTitulos: number
    pesoTextos: number
    pesoPrecios: number
  }
  fondo: {
    video: string | null
    efecto: Efecto // se ve mientras carga el video o si no hay video
    tinte: string
    tinteFuerza: number // 0–100
    oscurecerInicio: number // 0–100
    oscurecerCatalogo: number // 0–100
  }
  botones: {
    estilo: EstiloBoton
    forma: FormaBoton
    difuminado: number // 0–100: cuánto desenfocan el video los botones translúcidos
    sombra: SombraBoton
    tamano: TamanoBoton
  }
  avatar: { aro: AroAvatar; forma: FormaAvatar }
}

/** Cómo se llaman las cosas en cada negocio ("Carta"/"plato" o "Catálogo"/"producto"). */
export interface Vocab {
  tipo: 'restaurante' | 'tienda'
  seccion: string // "Carta", "Catálogo", "Menú"
  generoSeccion: 'f' | 'm' // la carta / el catálogo
  titulo: string
  subtitulo: string
  boton: string // texto sugerido del botón que abre la sección
  producto: { uno: string; varios: string; genero: 'f' | 'm' }
  agotado: string
  disponible: { etiqueta: string; ayuda: string }
  unidades: PriceUnit[] // vacío = no se ofrece "precio por"
  unidadPorDefecto: PriceUnit | null
  ejemplos: { producto: string; descripcionProducto: string; categoria: string; boton: string; subcategoria: string }
}

export interface LinkButton {
  id: string
  site_id: string
  label: string
  type: LinkType
  url: string | null
  icon: string
  /** Solo para type 'menu': qué carta abre (null = la principal). */
  menu_id?: string | null
  position: number
  is_active: boolean
}

export type Idioma = 'es' | 'en'

/**
 * Una carta adicional (la carta en inglés, la de bebidas…). La principal no es una fila: son las categorías
 * sin menu_id, con el vocabulario de la página.
 */
export interface Carta {
  id: string
  site_id: string
  name: string // "English menu": se ve en el selector de cartas
  ruta: string // /<slug>/<ruta>
  idioma: Idioma // textos fijos de la carta: Inicio/Home, Agotado/Sold out…
  titulo: string | null
  subtitulo: string | null
  position: number
  is_active: boolean
}

export interface Category {
  id: string
  site_id: string
  /** Carta a la que pertenece (null = la principal). Las páginas guardadas antes no lo traen. */
  menu_id?: string | null
  name: string
  description: string | null
  emoji: string | null
  image_url: string | null
  position: number
  is_active: boolean
}

export interface Subcategory {
  id: string
  site_id: string
  category_id: string
  name: string
  position: number
}

export interface MenuItem {
  id: string
  site_id: string
  category_id: string
  subcategory_id: string | null
  name: string
  description: string | null
  price: number // 0 = "Consultar precio"
  unit: PriceUnit | null // cómo se vende: por libra, por unidad, por kilo (null = no se indica)
  image_url: string | null
  position: number
  is_available: boolean
  is_active: boolean
}

export type Draft<T extends { id: string }> = Omit<T, 'id' | 'position' | 'site_id'> & { id?: string; position?: number; site_id?: string }
