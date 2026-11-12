import type { SyntheticEvent } from 'react'

/**
 * Versiones livianas de fotos y videos, para que el celular no baje más de lo que muestra.
 *
 * Fotos (miniatura: lado corto de 360 px, lo que pide un cuadrito de ~112 px en una pantalla 3x):
 * - Las que viven en la app (…/media/fotos/<slug>/<código>.webp) tienen al lado <código>-m.webp
 *   (las genera scripts/medios-livianos.mjs).
 * - Las que se suben desde el panel se guardan como <id>-o.webp con su <id>-m.webp al lado.
 * - Las subidas antes de esto no tienen miniatura: se usa la original.
 * Si una miniatura no carga, la foto vuelve sola a la original (alOriginal).
 *
 * Videos de fondo: los de la app (…/media/videos/<slug>.mp4) tienen <slug>-m.mp4, más liviano, para celular.
 */
const FOTO_APP = /\/media\/fotos\/[^/]+\/[0-9a-f]{32}\.webp$/
const FOTO_PANEL = /-o\.webp$/
const VIDEO_APP = /\/media\/videos\/[^/]+\.mp4$/

export function miniatura(url: string): string
export function miniatura(url: string | null): string | null
export function miniatura(url: string | null): string | null {
  if (!url) return url
  if (FOTO_APP.test(url)) return url.replace(/\.webp$/, '-m.webp')
  if (FOTO_PANEL.test(url)) return url.replace(/-o\.webp$/, '-m.webp')
  return url
}

/** En `onError` de una <img> con miniatura: si la miniatura falla, carga la original (una sola vez). */
export const alOriginal = (original: string | null) => (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget
  if (original && img.getAttribute('src') !== original) img.src = original
}

/** Ruta de la miniatura de una foto subida desde el panel ("<id>-o.webp" → "<id>-m.webp"), o null si no tiene. */
export const rutaMiniatura = (ruta: string) => (FOTO_PANEL.test(ruta) ? ruta.replace(FOTO_PANEL, '-m.webp') : null)

/** La versión liviana del video si existe (solo los videos de la app la tienen). */
export const videoLiviano = (url: string) => (VIDEO_APP.test(url) && !url.endsWith('-m.mp4') ? url.replace(/\.mp4$/, '-m.mp4') : url)

/**
 * Espera a que se vea lo principal (la página cargó y sus fotos visibles terminaron, o 2,5 s como máximo)
 * para que lo pesado (el video, la carta por adelantado) no le quite velocidad a lo primero que se ve.
 */
export function esperarLoPrincipal(maxMs = 2500): Promise<void> {
  const cargada = document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => addEventListener('load', () => r(), { once: true }))
  // Un cuadro después, para que ya estén en pantalla las fotos que React acaba de poner.
  // (Con tope de 100 ms: hay navegadores que no dan cuadros a una pestaña que no está al frente.)
  const pintado = () => new Promise<void>((r) => {
    requestAnimationFrame(() => setTimeout(r, 0))
    setTimeout(r, 100)
  })
  return cargada.then(pintado).then(() => {
    const pendientes = [...document.images].filter((i) => i.loading !== 'lazy' && !i.complete)
    const fotos = Promise.all(pendientes.map((i) => new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }) })))
    return Promise.race([fotos.then(() => undefined), new Promise<void>((r) => setTimeout(r, maxMs))])
  })
}
