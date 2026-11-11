/**
 * Cada publicación cambia el nombre de los archivos de la app (y borra los viejos). Si alguien tiene abierta
 * una versión anterior —en el celular es lo normal: la pestaña queda viva días— y abre una parte que se descarga
 * aparte (Diseño, Ajustes, el panel…), ese archivo ya no existe. La solución es recargar para traer la versión nueva.
 *
 * Se recarga una sola vez por minuto: si el archivo sigue sin aparecer, se muestra el error en vez de entrar en bucle.
 */
const CLAVE = 'link-bush-recarga-por-version'

export function esErrorDeVersion(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return /dynamically imported module|importing a module script failed|error loading dynamically imported|failed to fetch dynamically|preload/i.test(msg)
}

/** Recarga la página si no se recargó por lo mismo hace menos de un minuto. Devuelve si recargó. */
export function recargarPorVersion(): boolean {
  let ultima = 0
  try {
    ultima = Number(sessionStorage.getItem(CLAVE)) || 0
  } catch {
    // Sin sessionStorage (modo privado estricto): se recarga igual una vez.
  }
  if (Date.now() - ultima < 60_000) return false
  try {
    sessionStorage.setItem(CLAVE, String(Date.now()))
  } catch {
    // Sin dónde guardar la marca: se recarga igual.
  }
  location.reload()
  return true
}

/** Vite avisa con este evento cuando no puede bajar una parte de la app. */
export function escucharVersionNueva() {
  window.addEventListener('vite:preloadError', (event) => {
    if (recargarPorVersion()) event.preventDefault()
  })
}
