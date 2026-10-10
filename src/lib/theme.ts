import type { CSSProperties } from 'react'

export type ButtonStyle = 'filled' | 'outline' | 'soft' | 'shadow'
export type ButtonShape = 'square' | 'rounded' | 'pill'

export type Theme = {
  bgType: 'color' | 'gradient' | 'image'
  bgColor: string
  bgGradient: [string, string, number]
  bgImage: string
  textColor: string
  font: string
  buttonStyle: ButtonStyle
  buttonShape: ButtonShape
  buttonColor: string
  buttonTextColor: string
  /** Solo para el estilo "Sombra". Si no está definido se usa el color del texto. */
  shadowColor?: string
  /** Si no está definido, cada estilo usa su borde por defecto (ver defaultBorderColor). */
  borderColor?: string
  /** Texto de botones y descripción en negrita. */
  bold?: boolean
}

export const DEFAULT_THEME: Theme = {
  bgType: 'color',
  bgColor: '#f5f5f4',
  bgGradient: ['#f5f5f4', '#e7e5e4', 180],
  bgImage: '',
  textColor: '#1c1917',
  font: 'Inter',
  buttonStyle: 'filled',
  buttonShape: 'rounded',
  buttonColor: '#1c1917',
  buttonTextColor: '#ffffff',
}

export type FontCategory = 'Moderna' | 'Elegante' | 'Llamativa' | 'Manuscrita'

// `w`: grosores disponibles en Google Fonts. Si se piden grosores que la fuente no tiene, Google rechaza la hoja entera.
export const FONTS: { name: string; cat: FontCategory; w?: string }[] = [
  { name: 'Inter', cat: 'Moderna' },
  { name: 'Poppins', cat: 'Moderna' },
  { name: 'Montserrat', cat: 'Moderna' },
  { name: 'Nunito', cat: 'Moderna' },
  { name: 'Raleway', cat: 'Moderna' },
  { name: 'Roboto', cat: 'Moderna' },
  { name: 'Open Sans', cat: 'Moderna' },
  { name: 'Quicksand', cat: 'Moderna' },
  { name: 'Outfit', cat: 'Moderna' },
  { name: 'Manrope', cat: 'Moderna' },
  { name: 'Space Grotesk', cat: 'Moderna' },
  { name: 'Josefin Sans', cat: 'Moderna' },
  { name: 'Playfair Display', cat: 'Elegante' },
  { name: 'Lora', cat: 'Elegante' },
  { name: 'Merriweather', cat: 'Elegante' },
  { name: 'Cormorant Garamond', cat: 'Elegante' },
  { name: 'Libre Baskerville', cat: 'Elegante', w: '400;700' },
  { name: 'DM Serif Display', cat: 'Elegante', w: '' },
  { name: 'Abril Fatface', cat: 'Elegante', w: '' },
  { name: 'Bebas Neue', cat: 'Llamativa', w: '' },
  { name: 'Oswald', cat: 'Llamativa' },
  { name: 'Anton', cat: 'Llamativa', w: '' },
  { name: 'Archivo Black', cat: 'Llamativa', w: '' },
  { name: 'Righteous', cat: 'Llamativa', w: '' },
  { name: 'Fredoka', cat: 'Llamativa' },
  { name: 'Comfortaa', cat: 'Llamativa' },
  { name: 'Syne', cat: 'Llamativa' },
  { name: 'Pacifico', cat: 'Manuscrita', w: '' },
  { name: 'Dancing Script', cat: 'Manuscrita' },
  { name: 'Great Vibes', cat: 'Manuscrita', w: '' },
  { name: 'Caveat', cat: 'Manuscrita' },
  { name: 'Lobster', cat: 'Manuscrita', w: '' },
  { name: 'Satisfy', cat: 'Manuscrita', w: '' },
]

export function resolveTheme(t: Partial<Theme> | null | undefined): Theme {
  return { ...DEFAULT_THEME, ...(t || {}) }
}

const loadedFonts = new Set<string>()
export function loadFont(font: string) {
  if (loadedFonts.has(font)) return
  loadedFonts.add(font)
  const w = FONTS.find((f) => f.name === font)?.w ?? '400;600;700'
  const family = encodeURIComponent(font) + (w ? `:wght@${w}` : '')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
  document.head.appendChild(link)
}

export function backgroundStyle(t: Theme): CSSProperties {
  if (t.bgType === 'gradient') {
    const [a, b, angle] = t.bgGradient
    return { background: `linear-gradient(${angle}deg, ${a}, ${b})` }
  }
  if (t.bgType === 'image' && t.bgImage) {
    return {
      backgroundColor: t.bgColor,
      backgroundImage: `url("${t.bgImage}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { background: t.bgColor }
}

const RADIUS: Record<ButtonShape, string> = { square: '4px', rounded: '14px', pill: '999px' }

/** Color de borde que usa cada estilo cuando no se ha elegido uno. */
export function defaultBorderColor(t: Theme) {
  if (t.buttonStyle === 'shadow') return t.textColor
  if (t.buttonStyle === 'soft') return 'transparent'
  return t.buttonColor
}

export function buttonStyle(t: Theme): CSSProperties {
  const base: CSSProperties = {
    borderRadius: RADIUS[t.buttonShape],
    border: `2px solid ${t.borderColor || defaultBorderColor(t)}`,
    fontWeight: t.bold ? 700 : 600,
  }
  switch (t.buttonStyle) {
    case 'outline':
      return { ...base, background: 'transparent', color: t.buttonColor }
    case 'soft':
      return { ...base, background: hexAlpha(t.buttonColor, 0.18), color: t.textColor }
    case 'shadow':
      return {
        ...base,
        background: t.buttonColor,
        color: t.buttonTextColor,
        boxShadow: `4px 4px 0 ${t.shadowColor || t.textColor}`,
      }
    default:
      return { ...base, background: t.buttonColor, color: t.buttonTextColor }
  }
}

function hexAlpha(hex: string, alpha: number) {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
