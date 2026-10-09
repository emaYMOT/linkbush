// Íconos estilo línea (basados en Lucide, licencia ISC). Se guardan como marcado SVG interno.
const P = (d: string) => `<path d="${d}"/>`

export const ICONS: Record<string, { label: string; svg: string }> = {
  instagram: {
    label: 'Instagram',
    svg: '<rect x="2" y="2" width="20" height="20" rx="5"/>' + P('M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z') + P('M17.5 6.5h.01'),
  },
  whatsapp: { label: 'WhatsApp', svg: P('M7.9 20A9 9 0 1 0 4 16.1L2 22Z') },
  facebook: { label: 'Facebook', svg: P('M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z') },
  tiktok: { label: 'TikTok', svg: P('M9 18V5l12-2v13') + '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
  youtube: {
    label: 'YouTube',
    svg:
      P('M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17') +
      P('m10 15 5-3-5-3z'),
  },
  x: { label: 'X / Twitter', svg: P('M4 4l16 16') + P('M20 4L4 20') },
  linkedin: {
    label: 'LinkedIn',
    svg: P('M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z') + '<rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  },
  review: { label: 'Reseñas', svg: P('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z') },
  map: { label: 'Ubicación', svg: P('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z') + '<circle cx="12" cy="10" r="3"/>' },
  email: { label: 'Correo', svg: '<rect x="2" y="4" width="20" height="16" rx="2"/>' + P('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7') },
  phone: {
    label: 'Teléfono',
    svg: P(
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    ),
  },
  menu: {
    label: 'Menú / Carta',
    svg: P('M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2') + P('M7 2v20') + P('M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'),
  },
  shop: { label: 'Tienda', svg: P('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z') + P('M3 6h18') + P('M16 10a4 4 0 0 1-8 0') },
  calendar: { label: 'Reservas', svg: '<rect x="3" y="4" width="18" height="18" rx="2"/>' + P('M16 2v4') + P('M8 2v4') + P('M3 10h18') },
  web: { label: 'Sitio web', svg: '<circle cx="12" cy="12" r="10"/>' + P('M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20') + P('M2 12h20') },
  link: {
    label: 'Enlace',
    svg: P('M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71') + P('M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'),
  },
}

const RULES: [RegExp, string][] = [
  [/instagram\.com|instagr\.am/i, 'instagram'],
  [/wa\.me|whatsapp\.com/i, 'whatsapp'],
  [/facebook\.com|fb\.com|fb\.me/i, 'facebook'],
  [/tiktok\.com/i, 'tiktok'],
  [/youtube\.com|youtu\.be/i, 'youtube'],
  [/(^|\/\/|\.)(x|twitter)\.com/i, 'x'],
  [/linkedin\.com/i, 'linkedin'],
  [/g\.page\/r\/|writereview|search\.google\.com\/local\/writereview/i, 'review'],
  [/maps\.app\.goo\.gl|google\.[a-z.]+\/maps|goo\.gl\/maps|waze\.com/i, 'map'],
  [/^mailto:/i, 'email'],
  [/^tel:/i, 'phone'],
]

/** Ícono a usar: el elegido manualmente, o autodetectado por la URL. 'none' = sin ícono. */
export function resolveIcon(icon: string | null, url: string): string | null {
  if (icon === 'none') return null
  if (icon && ICONS[icon]) return icon
  for (const [re, name] of RULES) if (re.test(url)) return name
  return 'link'
}

export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const icon = ICONS[name] || UI[name]
  if (!icon) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  )
}

// Íconos de interfaz del panel
const UI: Record<string, { label: string; svg: string }> = {
  grip: { label: '', svg: '<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>' },
  trash: { label: '', svg: P('M3 6h18') + P('M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6') + P('M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2') },
  plus: { label: '', svg: P('M12 5v14') + P('M5 12h14') },
  copy: { label: '', svg: '<rect x="8" y="8" width="14" height="14" rx="2"/>' + P('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2') },
  external: { label: '', svg: P('M15 3h6v6') + P('M10 14 21 3') + P('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6') },
  back: { label: '', svg: P('m15 18-6-6 6-6') },
  check: { label: '', svg: P('M20 6 9 17l-5-5') },
  eye: { label: '', svg: P('M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z') + '<circle cx="12" cy="12" r="3"/>' },
  eyeOff: { label: '', svg: P('M9.88 9.88a3 3 0 1 0 4.24 4.24') + P('M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68') + P('M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61') + P('m2 2 20 20') },
  logout: { label: '', svg: P('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4') + P('m16 17 5-5-5-5') + P('M21 12H9') },
  duplicate: { label: '', svg: '<rect x="8" y="8" width="14" height="14" rx="2"/>' + P('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2') + P('M15 12v6') + P('M12 15h6') },
}
