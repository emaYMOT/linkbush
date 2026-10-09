import { createClient } from '@supabase/supabase-js'
import type { Theme } from './theme'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && key)

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder')

export type Page = {
  id: string
  slug: string
  title: string
  bio: string
  avatar_url: string | null
  theme: Partial<Theme>
  published: boolean
  created_at: string
  updated_at: string
}

export type Link = {
  id: string
  page_id: string
  label: string
  url: string
  icon: string | null
  position: number
  enabled: boolean
}

/** URL pública de una página, ej. https://usuario.github.io/repo/panaderia-luna */
export function publicUrl(slug: string) {
  return new URL(import.meta.env.BASE_URL + slug, window.location.origin).toString()
}

export function slugify(text: string) {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'pagina'
  )
}
