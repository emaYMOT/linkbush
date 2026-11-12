import { useEffect } from 'react'

/** Dirección sin página (o con una página en borrador). También es la portada de la app (/). */
export default function NotFound() {
  useEffect(() => {
    document.title = 'Página no encontrada'
  }, [])
  return (
    <main className="grid min-h-dvh place-items-center bg-noche px-6 text-center">
      <div>
        <p className="font-display text-[2.6rem] leading-tight">Página no encontrada</p>
        <p className="mx-auto mt-3 max-w-[34ch] text-niebla">Esta dirección no tiene una página, o todavía no está publicada. Revisa el enlace o escanea de nuevo el código QR.</p>
      </div>
    </main>
  )
}
