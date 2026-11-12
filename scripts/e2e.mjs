// Prueba de punta a punta del panel único en modo demo (sin Supabase).
// Uso: con el servidor corriendo (npm run dev), `node scripts/e2e.mjs [url] [carpeta-capturas]`.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] ?? 'http://localhost:5180/'
const shots = process.argv[3] ?? 'screenshots'
mkdirSync(shots, { recursive: true })
const ejemplo = fileURLToPath(new URL('./ejemplo-carta.json', import.meta.url))

const browser = await chromium.launch({ channel: 'msedge' })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light' })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
// Si algo falla, deja una captura de cómo estaba la pantalla.
process.on('uncaughtException', async (e) => {
  console.error(e)
  for (const [i, p] of context.pages().entries()) await p.screenshot({ path: `${shots}/fallo-${i}.png` }).catch(() => {})
  console.error('Errores de la página:', errors)
  process.exit(1)
})
const step = (name) => console.log('✓', name)
const dialog = () => page.locator('dialog[open]').last()
const toast = (text) => page.getByText(text).last().waitFor()
const cssVar = (p, name) => p.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)

async function entrar() {
  await page.goto(base + 'admin')
  await page.getByRole('button', { name: 'Entrar al modo demo' }).click()
  await page.getByRole('heading', { level: 1, name: 'Mis páginas' }).waitFor()
  await page.locator('main > ul > li').first().waitFor()
}

await page.goto(base + 'admin')
await page.evaluate(() => localStorage.clear())
await entrar()
assert.equal(await page.locator('main > ul > li').count(), 2)
await page.screenshot({ path: `${shots}/1-mis-paginas.png` })
step('entra al panel y ve las 2 páginas de ejemplo')

// Página nueva: tienda con el tema de color Océano.
await page.getByRole('button', { name: 'Nueva página' }).click()
await dialog().getByRole('button', { name: 'Crear página' }).click()
await page.getByText('Escribe el nombre del negocio.').waitFor()
await page.getByRole('textbox', { name: /^Nombre del negocio/ }).fill('Pez Fresco')
assert.equal(await page.getByRole('textbox', { name: /^Dirección/ }).inputValue(), 'pezfresco')
await dialog().getByRole('button', { name: /^Tienda/ }).click()
await dialog().getByRole('button', { name: 'Océano' }).click()
await page.screenshot({ path: `${shots}/2-nueva-pagina.png` })
await dialog().getByRole('button', { name: 'Crear página' }).click()
await page.waitForURL(/\/perfil$/)
await toast('Página creada en borrador')
step('crea una página (dirección automática, tipo tienda, tema Océano)')

await page.getByRole('textbox', { name: /^Descripción/ }).first().fill('Pescados frescos todos los días.')
await page.getByRole('button', { name: 'Guardar perfil' }).click()
await toast('Perfil guardado')
step('edita el perfil')

// Botones de una página nueva: los cinco de siempre, con «Nuestro Catálogo» por ser tienda.
await page.getByRole('link', { name: 'Botones', exact: true }).click()
await page.locator('main ul > li').nth(4).waitFor()
const botones = await page.locator('main ul > li').allInnerTexts()
for (const texto of ['Nuestro Catálogo', 'Déjanos una reseña!', 'Haz tu reserva', 'Cómo llegar', 'Síguenos en Instagram']) {
  assert.ok(botones.some((b) => b.includes(texto)), `falta el botón «${texto}»`)
}
assert.equal(botones.length, 5)
step('la página nueva trae los 5 botones de siempre')

// Catálogo con subcategoría y producto por libra.
await page.getByRole('link', { name: 'Catálogo', exact: true }).click()
await page.getByRole('button', { name: 'Agregar categoría' }).click()
await page.getByRole('textbox', { name: /^Nombre/ }).fill('Mariscos')
await dialog().getByRole('button', { name: 'Agregar categoría' }).click()
await toast('Categoría agregada')
await page.getByRole('link', { name: /Mariscos/ }).click()
await page.getByRole('button', { name: 'Subcategoría', exact: true }).click()
await page.getByRole('textbox', { name: /^Nombre/ }).fill('Congelados')
await dialog().getByRole('button', { name: 'Agregar subcategoría' }).click()
await toast('Subcategoría agregada')
await page.getByRole('button', { name: 'Agregar producto en Congelados' }).click()
await page.getByRole('textbox', { name: /^Nombre/ }).fill('Camarón tigre')
await page.getByRole('textbox', { name: /^Precio/ }).fill('32000')
assert.equal(await dialog().getByRole('button', { name: 'Libra' }).getAttribute('aria-pressed'), 'true')
await dialog().getByRole('button', { name: 'Agregar producto' }).click()
await toast('Producto agregado')
await page.locator('section[aria-label="Congelados"]').getByText('Camarón tigre').waitFor()
await page.screenshot({ path: `${shots}/3-categoria.png` })
step('crea categoría, subcategoría y producto por libra')

// Diseño: acento y fuente de títulos.
await page.getByRole('link', { name: 'Diseño', exact: true }).click()
await page.getByRole('textbox', { name: /^Acento Precios/ }).fill('#ff3366')
await page.getByRole('button', { name: 'Libre Baskerville', exact: true }).first().click()
await dialog().getByRole('button', { name: 'Fraunces', exact: true }).click()
await page.getByRole('group', { name: 'Grosor de los textos' }).getByRole('button', { name: 'Media', exact: true }).click()
await page.getByRole('button', { name: /^Neón Contorno/ }).click()
await page.getByRole('button', { name: /^Flotante/ }).click()
await page.getByRole('button', { name: /^Sin aro/ }).click()
await page.getByRole('button', { name: /^Estrellas/ }).click()
await page.getByText('Cambios sin guardar').waitFor()
await page.getByRole('button', { name: 'Guardar diseño' }).click()
await toast('Diseño guardado y publicado')
step('cambia acento, letra y grosor, estilo y sombra de botones, aro y efecto de fondo')

// Un tema de color cambia todos los colores; descartar vuelve a lo guardado.
await page.getByRole('button', { name: 'Morado', exact: true }).click()
await page.getByText('Cambios sin guardar').waitFor()
assert.equal(await page.getByRole('textbox', { name: /^Acento Precios/ }).inputValue(), '#a77bff')
await page.getByRole('button', { name: 'Descartar' }).click()
await page.getByText('Todo guardado').waitFor()
assert.equal(await page.getByRole('textbox', { name: /^Acento Precios/ }).inputValue(), '#ff3366')
step('aplica un tema de color y lo descarta')

await page.getByRole('link', { name: 'Ajustes', exact: true }).click()
await page.getByRole('switch', { name: /^Página publicada/ }).click({ force: true })
await toast('Página publicada')
step('publica la página')

// Página pública con el diseño nuevo.
const pub = await context.newPage()
await pub.goto(base + 'pezfresco')
await pub.getByRole('heading', { level: 1, name: 'Pez Fresco' }).waitFor()
assert.equal(await cssVar(pub, '--color-cobre'), '#ff3366')
assert.equal(await cssVar(pub, '--peso-textos'), '500')
assert.match(await pub.getByRole('heading', { level: 1 }).evaluate((h) => getComputedStyle(h).fontFamily), /Fraunces/)
const boton = pub.getByRole('link', { name: 'Nuestro catálogo' })
assert.equal(await boton.getAttribute('data-estilo'), 'neon')
assert.equal(await boton.getAttribute('data-sombra'), 'flotante')
assert.equal(await pub.locator('.avatar').getAttribute('data-aro'), 'ninguno')
await pub.locator('.fugaz').first().waitFor({ state: 'attached' })
await pub.getByRole('link', { name: 'Nuestro catálogo' }).click()
await pub.getByRole('link', { name: /Mariscos/ }).click()
await pub.getByRole('heading', { level: 2, name: 'Congelados' }).waitFor()
await pub.getByText('$32.000').waitFor()
await pub.getByText('/ lb').waitFor()
assert.match(await pub.locator('.font-precio').first().evaluate((e) => getComputedStyle(e).fontFamily), /Fraunces/)
await pub.waitForTimeout(800)
await pub.screenshot({ path: `${shots}/4-publica-categoria.png` })
step('la página pública usa el diseño, la sección y la unidad')

// Borrador: sin sesión, "no encontrada".
await page.getByRole('switch', { name: /^Página publicada/ }).click({ force: true })
await toast('Página en borrador')
await page.getByRole('button', { name: 'Cerrar sesión' }).click()
await pub.goto(base + 'pezfresco')
await pub.reload()
await pub.getByText('Página no encontrada').waitFor()
step('despublicada: sin sesión se ve «Página no encontrada»')

// Duplicar y eliminar.
await entrar()
await page.locator('main > ul > li', { hasText: 'Pez Fresco' }).getByRole('button', { name: 'Duplicar' }).click()
await dialog().getByRole('button', { name: 'Duplicar', exact: true }).click()
await toast('Página duplicada (en borrador)')
await page.getByRole('link', { name: 'Mis páginas' }).first().click()
await page.getByRole('heading', { level: 1, name: 'Mis páginas' }).waitFor()
assert.equal(await page.locator('main > ul > li').count(), 4)
await page.locator('main > ul > li', { hasText: 'Pez Fresco (copia)' }).getByRole('button', { name: 'Eliminar' }).click()
assert.equal(await dialog().getByRole('button', { name: 'Eliminar para siempre' }).isDisabled(), true)
await dialog().getByRole('textbox').fill('Pez Fresco (copia)')
await dialog().getByRole('button', { name: 'Eliminar para siempre' }).click()
await toast('Página eliminada')
assert.equal(await page.locator('main > ul > li').count(), 3)
step('duplica una página con su contenido y la elimina confirmando el nombre')

// Importar un catálogo JSON (formato con subcategorías).
await page.locator('main > ul > li', { hasText: 'Pez Fresco' }).getByRole('link', { name: 'Editar', exact: true }).click()
await page.getByRole('link', { name: 'Ajustes', exact: true }).click()
await page.locator('input[type=file][accept*=json]').setInputFiles(ejemplo)
await dialog().getByText('El archivo trae').waitFor()
await dialog().getByRole('button', { name: 'Importar' }).click()
await toast('Catálogo importado')
await page.getByRole('link', { name: 'Catálogo', exact: true }).click()
await page.getByRole('link', { name: /Bebidas/ }).waitFor()
assert.equal(await page.locator('main ul > li').count(), 3)
step('importa un catálogo JSON con subcategorías')

// Modo oscuro del panel: se recuerda al recargar.
const oscuro = () => page.evaluate(() => document.documentElement.classList.contains('oscuro'))
await page.getByRole('button', { name: 'Oscuro', exact: true }).click()
assert.equal(await oscuro(), true)
await page.reload()
await page.getByRole('link', { name: 'Catálogo', exact: true }).waitFor()
assert.equal(await oscuro(), true)
await page.screenshot({ path: `${shots}/5-catalogo-oscuro.png` })
await page.getByRole('button', { name: 'Agregar categoría' }).click()
await page.screenshot({ path: `${shots}/6-modal-oscuro.png` })
await page.keyboard.press('Escape')
await page.getByRole('button', { name: 'Claro', exact: true }).click()
assert.equal(await oscuro(), false)
step('modo oscuro del panel, recordado al recargar')

// Vista previa en vivo (escritorio): el iframe recibe el diseño sin guardar.
const desk = await context.newPage()
await desk.setViewportSize({ width: 1366, height: 900 })
await desk.goto(page.url().replace(/catalogo$/, 'diseno'))
await desk.getByRole('heading', { level: 1, name: 'Diseño' }).waitFor()
const frame = await (await desk.locator('iframe').elementHandle()).contentFrame()
await frame.getByRole('heading', { level: 1, name: 'Pez Fresco' }).waitFor()
await desk.getByRole('textbox', { name: /^Acento Precios/ }).fill('#00aa55')
await frame.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--color-cobre').trim() === '#00aa55')
await desk.waitForTimeout(600)
await desk.screenshot({ path: `${shots}/7-diseno-escritorio.png` })
await desk.getByRole('button', { name: 'Oscuro', exact: true }).click()
await desk.waitForTimeout(300)
await desk.screenshot({ path: `${shots}/8-diseno-escritorio-oscuro.png` })
await desk.getByRole('button', { name: 'Claro', exact: true }).click()
step('la vista previa cambia al instante, antes de guardar')

assert.deepEqual(errors, [])
console.log('\nTodo bien.')
await browser.close()
