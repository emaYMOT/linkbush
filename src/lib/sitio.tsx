import { createContext, useContext, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import type { CartaPublica } from './cartas'
import type { Site, Theme } from './types'
import type { Palabras } from './vocab'

/** La página pública que se está viendo, con su vocabulario y sus rutas. */
export interface SiteCtx {
  site: Site
  theme: Theme // el guardado, o el que manda el panel en la vista previa
  m: Palabras
  home: string // "/pez-y-mar"
  seccion: string // "/pez-y-mar/catalogo": la carta principal
  /** La principal y, cuando terminan de cargar, las cartas adicionales visibles (en orden). */
  cartas: CartaPublica[]
  cartasListas: boolean
  /** Dirección de la carta que abre un botón (null o una carta que ya no existe = la principal). */
  rutaCarta: (menuId: string | null | undefined) => string
}

const Ctx = createContext<SiteCtx | null>(null)
export const SiteProvider = Ctx.Provider

export function useSite(): SiteCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSite fuera de una página')
  return ctx
}

/**
 * La carta de la dirección actual (/#/<slug>/<ruta>…). Si la ruta no es de ninguna carta, vuelve al inicio;
 * mientras cargan las cartas adicionales devuelve null (la pantalla espera sin saltar).
 */
export function useCartaActual(): { carta: CartaPublica | null; base: string; redirect: React.ReactNode | null } {
  const { cartas, cartasListas, home } = useSite()
  const { seccion } = useParams()
  const carta = cartas.find((c) => c.ruta === seccion) ?? null

  // Lectores de pantalla y traductores: la carta en inglés se anuncia en inglés.
  const idioma = carta?.idioma ?? 'es'
  useEffect(() => {
    document.documentElement.lang = idioma
    return () => {
      document.documentElement.lang = 'es'
    }
  }, [idioma])

  const redirect = !carta && cartasListas ? <Navigate to={home} replace /> : null
  return { carta, base: carta ? `${home}/${carta.ruta}` : home, redirect }
}
