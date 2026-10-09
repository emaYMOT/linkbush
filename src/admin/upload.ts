import { supabase } from '../lib/supabase'

/** Reduce la imagen (máx. `maxSize` px) y la sube al bucket "avatars". Devuelve la URL pública. */
export async function uploadImage(file: File, folder: string, maxSize = 800): Promise<string> {
  const blob = await resize(file, maxSize)
  const path = `${folder}/${Date.now()}.webp`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/webp', upsert: true })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

async function resize(file: File, max: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/webp', 0.85))
}
