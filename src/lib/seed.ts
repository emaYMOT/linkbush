import { temaDePlantilla } from './plantillas'
import type { Carta, Category, LinkButton, MenuItem, Site, Subcategory } from './types'
import { VOCAB_PRESETS } from './vocab'

// Dos páginas de ejemplo para el modo demo (sin Supabase): un restaurante y una pescadería.

const creada = '2026-11-01T12:00:00.000Z'

const sites: Site[] = [
  {
    id: 's-mar',
    slug: 'maradentro',
    name: 'Mar Adentro',
    description: 'Pescados y mariscos frescos.\nAl por mayor y al detal, con domicilios.',
    avatar_url: null,
    published: true,
    theme: temaDePlantilla('pez-y-mar'),
    vocab: VOCAB_PRESETS.tienda,
    seo_title: null,
    seo_description: null,
    created_at: creada,
    updated_at: creada,
  },
  {
    id: 's-brasa',
    slug: 'brasaybarra',
    name: 'Brasa & Barra',
    description: 'Parrilla a la leña y coctelería de autor.\nAbierto todos los días desde las 12 m.',
    avatar_url: null,
    published: true,
    theme: temaDePlantilla('al-aire', undefined, 'brasa'),
    vocab: VOCAB_PRESETS.restaurante,
    seo_title: null,
    seo_description: null,
    created_at: '2026-11-01T12:05:00.000Z',
    updated_at: '2026-11-01T12:05:00.000Z',
  },
]

const link = (site_id: string, id: string, position: number, label: string, type: LinkButton['type'], icon: string, url: string | null = null): LinkButton => ({
  id, site_id, label, type, url, icon, position, is_active: true,
})

const links: LinkButton[] = [
  link('s-mar', 'l-mar-1', 0, 'Ver catálogo', 'menu', 'catalogo'),
  link('s-mar', 'l-mar-2', 1, 'Pedir por WhatsApp', 'url', 'whatsapp', 'https://wa.me/573000000000'),
  link('s-mar', 'l-mar-3', 2, 'Síguenos en Instagram', 'url', 'instagram', 'https://www.instagram.com/'),
  link('s-mar', 'l-mar-4', 3, 'Cómo llegar', 'url', 'map', 'https://maps.google.com/'),
  link('s-brasa', 'l-br-1', 0, 'Ver la carta', 'menu', 'menu'),
  link('s-brasa', 'l-br-2', 1, 'Reservar por WhatsApp', 'url', 'whatsapp', 'https://wa.me/573000000000'),
  link('s-brasa', 'l-br-3', 2, 'Instagram', 'url', 'instagram', 'https://www.instagram.com/'),
]

const cat = (site_id: string, id: string, position: number, name: string, emoji: string, description: string | null, image_url: string | null = null): Category => ({
  id, site_id, name, emoji, description, image_url, position, is_active: true,
})

const categories: Category[] = [
  cat('s-mar', 'c-mar-1', 0, 'Pescados', '🐟', 'Frescos y congelados, por libra o por unidad.', 'media/demo/portada-pescados.webp'),
  cat('s-mar', 'c-mar-2', 1, 'Mariscos', '🦐', 'Camarón, calamar y más.', 'media/demo/portada-mariscos.webp'),
  cat('s-brasa', 'c-br-1', 0, 'Entradas', '🥟', 'Para abrir el apetito.'),
  cat('s-brasa', 'c-br-2', 1, 'De la parrilla', '🔥', 'Cortes a la leña con papa criolla y chimichurri.'),
  cat('s-brasa', 'c-br-3', 2, 'Bebidas', '🍹', null),
]

const subcategories: Subcategory[] = [
  { id: 'sc-br-1', site_id: 's-brasa', category_id: 'c-br-3', name: 'Jugos naturales', position: 0 },
  { id: 'sc-br-2', site_id: 's-brasa', category_id: 'c-br-3', name: 'Cervezas', position: 1 },
]

let n = 0
const item = (site_id: string, category_id: string, name: string, price: number, extra: Partial<MenuItem> = {}): MenuItem => ({
  id: `i${++n}`, site_id, category_id, subcategory_id: null, name, description: null, price, unit: null, image_url: null,
  position: n, is_available: true, is_active: true, ...extra,
})

const items: MenuItem[] = [
  item('s-mar', 'c-mar-1', 'Filete de tilapia', 14500, { unit: 'lb', image_url: 'media/demo/filete-de-tilapia.webp' }),
  item('s-mar', 'c-mar-1', 'Pargo rojo', 18900, { unit: 'lb', image_url: 'media/demo/pargo-rojo.webp', description: 'Entero, limpio y listo para freír.' }),
  item('s-mar', 'c-mar-1', 'Filete de salmón', 52000, { unit: 'lb', image_url: 'media/demo/filete-de-salmon.webp' }),
  item('s-mar', 'c-mar-2', 'Camarón crudo', 32000, { unit: 'lb', image_url: 'media/demo/camaron-crudo.webp', description: 'Pelado y desvenado, talla mediana.' }),
  item('s-mar', 'c-mar-2', 'Anillos de calamar', 0, { unit: 'lb', is_available: false }),
  item('s-brasa', 'c-br-1', 'Empanadas de cañón', 16000, { description: 'Tres empanadas con ají de la casa.' }),
  item('s-brasa', 'c-br-1', 'Chorizo santarrosano', 14000),
  item('s-brasa', 'c-br-2', 'Punta de anca', 48000, { description: '350 g a la leña, término a tu gusto.' }),
  item('s-brasa', 'c-br-2', 'Costillas BBQ', 42000, { description: 'Cocción lenta de 6 horas, glaseadas en panela.' }),
  item('s-brasa', 'c-br-3', 'Limonada de coco', 12000, { subcategory_id: 'sc-br-1' }),
  item('s-brasa', 'c-br-3', 'Jugo de lulo', 9000, { subcategory_id: 'sc-br-1' }),
  item('s-brasa', 'c-br-3', 'Club Colombia', 9000, { subcategory_id: 'sc-br-2' }),
  item('s-brasa', 'c-br-3', 'Corona', 12000, { subcategory_id: 'sc-br-2' }),
]

export const demoSeed = { sites, links, menus: [] as Carta[], menu_categories: categories, menu_subcategories: subcategories, menu_items: items }
