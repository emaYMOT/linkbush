// Versiones livianas de los medios que viven en la app (public/media):
// - Fotos: <código>.webp → <código>-m.webp, miniatura con el lado corto en 360 px (lo que pide un cuadrito
//   de ~112 px en un celular con pantalla 3x). Si la foto ya es más chica, o la miniatura no pesa menos,
//   se copia la original tal cual, así toda foto tiene su "-m".
// - Videos de fondo: <slug>.mp4 → <slug>-m.mp4, 540×960 y menos bitrate, para celulares.
// La app las usa sola (src/lib/medios.ts) y si alguna falta vuelve a la original.
// Uso: node scripts/medios-livianos.mjs   (se puede repetir: salta lo que ya existe)
import { execFile } from 'node:child_process'
import { copyFileSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const media = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'media')
const LADO_CORTO = 360

async function miniatura(origen) {
  const destino = origen.replace(/\.webp$/, '-m.webp')
  if (existsSync(destino)) return null
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,pix_fmt', '-of', 'json', origen])
  const s = JSON.parse(stdout).streams[0]
  if (Math.min(s.width, s.height) <= LADO_CORTO) {
    copyFileSync(origen, destino)
    return { origen, antes: statSync(origen).size, despues: statSync(destino).size }
  }
  const alfa = /yuva|rgba|argb|bgra|abgr|^ya|gbrap|pal8/.test(s.pix_fmt)
  const escala = s.width <= s.height ? `scale=${LADO_CORTO}:-2:flags=lanczos` : `scale=-2:${LADO_CORTO}:flags=lanczos`
  const tmp = destino + '.tmp.webp'
  await run('ffmpeg', ['-v', 'error', '-y', '-i', origen, '-frames:v', '1', '-vf', escala, '-c:v', 'libwebp', '-quality', '80',
    '-compression_level', '6', '-preset', alfa ? 'picture' : 'photo', '-pix_fmt', alfa ? 'yuva420p' : 'yuv420p', tmp])
  const antes = statSync(origen).size
  if (statSync(tmp).size < antes) copyFileSync(tmp, destino)
  else copyFileSync(origen, destino)
  rmSync(tmp, { force: true })
  return { origen, antes, despues: statSync(destino).size }
}

async function videoLiviano(origen) {
  const destino = origen.replace(/\.mp4$/, '-m.mp4')
  if (existsSync(destino)) return null
  await run('ffmpeg', ['-v', 'error', '-y', '-i', origen, '-vf', 'scale=540:960:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow',
    '-crf', '29', '-maxrate', '650k', '-bufsize', '1300k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', destino])
  return { origen, antes: statSync(origen).size, despues: statSync(destino).size }
}

async function enParalelo(lista, n, fn) {
  const out = []
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < lista.length) {
      const r = await fn(lista[i++])
      if (r) out.push(r)
    }
  }))
  return out
}

const fotos = readdirSync(join(media, 'fotos'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(join(media, 'fotos', d.name)).filter((f) => /^[0-9a-f]{32}\.webp$/.test(f)).map((f) => join(media, 'fotos', d.name, f)))
const videos = readdirSync(join(media, 'videos')).filter((f) => /\.mp4$/.test(f) && !/-m\.mp4$/.test(f)).map((f) => join(media, 'videos', f))

const kb = (b) => `${(b / 1024).toFixed(0)} KB`
const resumen = (nombre, r) => {
  const a = r.reduce((s, x) => s + x.antes, 0)
  const d = r.reduce((s, x) => s + x.despues, 0)
  console.log(`${nombre}: ${r.length} nuevas · originales ${kb(a)} → livianas ${kb(d)}${a ? ` (${Math.round((1 - d / a) * 100)} % menos)` : ''}`)
}

resumen('Fotos', await enParalelo(fotos, 8, miniatura))
const v = await enParalelo(videos, 3, videoLiviano)
for (const x of v) console.log(`  ${x.origen.split(/[\\/]/).pop().padEnd(28)} ${kb(x.antes).padStart(8)} → ${kb(x.despues)}`)
resumen('Videos', v)
