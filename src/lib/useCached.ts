import { useEffect, useState } from 'react'

// Caché simple para la vista pública: ir del catálogo a una categoría y volver no vuelve a pedir datos.
const values = new Map<string, unknown>()
const pending = new Map<string, Promise<unknown>>()

export function clearPublicCache() {
  values.clear()
  pending.clear()
}

/** Deja un dato ya listo en la caché (llegó junto con otro), para que quien lo pida no vuelva a consultarlo. */
export function primeCache<T>(key: string, value: T) {
  values.set(key, value)
  pending.set(key, Promise.resolve(value))
}

/** Pide un dato por adelantado (si no está ya pedido), para que esté listo cuando se navegue hacia él. */
export function prefetch<T>(key: string, loader: () => Promise<T>) {
  if (pending.has(key)) return
  const promise = loader()
  pending.set(key, promise)
  promise.then(
    (data) => values.set(key, data),
    () => pending.delete(key),
  )
}

export function useCached<T>(key: string, loader: () => Promise<T>) {
  // El estado recuerda de qué clave es: al cambiar de página o de carta en la misma pestaña,
  // no se muestran ni un instante los datos de la anterior (eso mandaba al inicio de la página vieja).
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>(() => ({ key, data: values.get(key) as T | undefined }))

  useEffect(() => {
    let alive = true
    let promise = pending.get(key) as Promise<T> | undefined
    if (!promise) {
      promise = loader()
      pending.set(key, promise)
    }
    promise.then(
      (data) => {
        values.set(key, data)
        if (alive) setState({ key, data })
      },
      (error: Error) => {
        pending.delete(key)
        if (alive) setState({ key, error: error.message })
      },
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (state.key !== key) return { data: values.get(key) as T | undefined }
  return { data: state.data, error: state.error }
}
