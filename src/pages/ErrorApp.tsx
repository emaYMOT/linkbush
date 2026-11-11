import { useEffect, useState } from 'react'
import { useRouteError } from 'react-router-dom'
import { esErrorDeVersion, recargarPorVersion } from '../lib/version'

/**
 * Lo que se ve si algo falla al mostrar una pantalla (en vez del «Unexpected Application Error!» de React Router).
 * Si el fallo es por una versión vieja de la app abierta, recarga sola y no se alcanza a ver.
 */
export default function ErrorApp() {
  const error = useRouteError()
  const deVersion = esErrorDeVersion(error)
  const [recargando] = useState(() => deVersion && recargarPorVersion())

  useEffect(() => {
    if (!recargando) console.error(error)
  }, [error, recargando])

  if (recargando) return <div className="min-h-dvh bg-noche" />

  return (
    <main className="grid min-h-dvh place-items-center bg-noche px-6 text-center text-cal">
      <div>
        <p className="font-display text-[2.2rem] leading-tight">Algo no cargó bien</p>
        <p className="mx-auto mt-3 max-w-[36ch] text-niebla">
          {deVersion
            ? 'Hay una versión nueva de la página. Recarga para verla.'
            : 'Recarga la página. Si vuelve a pasar, revisa tu conexión o inténtalo en un rato.'}
        </p>
        <button
          type="button"
          onClick={() => location.reload()}
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-cobre px-6 font-semibold text-noche"
        >
          Recargar
        </button>
      </div>
    </main>
  )
}
