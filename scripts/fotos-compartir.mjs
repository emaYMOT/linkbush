// Foto para compartir de cada página: public/media/compartir/<slug>.jpg (600×600, JPG liviano).
// WhatsApp no siempre muestra WebP en la vista previa; la función functions/[[path]].js usa este JPG si existe
// y, si no, la foto de perfil tal cual.
// Uso: node scripts/fotos-compartir.mjs fotos.json   (fotos.json = [{ "slug": "...", "avatar_url": "..." }, …])
// Se puede repetir: rehace todas.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const destino = join(raiz, 'public', 'media', 'compartir')
mkdirSync(destino, { recursive: true })
const paginas = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const PROPIO = 'https://linkbush.pages.dev/'

for (const { slug, avatar_url } of paginas) {
  if (!avatar_url) continue
  let origen = avatar_url.startsWith(PROPIO) ? join(raiz, 'public', avatar_url.slice(PROPIO.length)) : null
  let temporal = null
  if (!origen || !existsSync(origen)) {
    temporal = join(tmpdir(), `compartir-${slug}`)
    execFileSync('curl', ['-sSL', '--fail', '--max-time', '30', '-o', temporal, avatar_url])
    origen = temporal
  }
  const final = join(destino, `${slug}.jpg`)
  // Recorta al centro en cuadrado y lo deja en 600 px (si la foto es más chica, no la agranda de más).
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', origen, '-vf',
    "crop='min(iw,ih)':'min(iw,ih)',scale='min(600,iw)':-2,format=yuvj420p", '-frames:v', '1', '-q:v', '4', final])
  if (temporal) rmSync(temporal, { force: true })
  console.log(slug)
}
