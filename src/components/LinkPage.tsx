import { useEffect } from 'react'
import type { Theme } from '../lib/theme'
import { backgroundStyle, buttonStyle, loadFont } from '../lib/theme'
import { Icon, resolveIcon } from '../lib/icons'

export type LinkPageData = {
  title: string
  bio: string
  avatar_url: string | null
  links: { id: string; label: string; url: string; icon: string | null }[]
}

export function normalizeUrl(url: string) {
  const u = url.trim()
  if (!u) return '#'
  if (/^(https?:|mailto:|tel:|sms:)/i.test(u)) return u
  return 'https://' + u
}

/** Renderiza la página del cliente. Se usa igual en la página pública y en la vista previa del editor. */
export default function LinkPage({ data, theme, preview = false }: { data: LinkPageData; theme: Theme; preview?: boolean }) {
  useEffect(() => loadFont(theme.font), [theme.font])

  const btn = buttonStyle(theme)

  return (
    <div
      className={`flex w-full justify-center px-5 py-12 ${preview ? 'min-h-full' : 'min-h-dvh'}`}
      style={{ ...backgroundStyle(theme), color: theme.textColor, fontFamily: `'${theme.font}', system-ui, sans-serif` }}
    >
      <main className="flex w-full max-w-[560px] flex-col items-center text-center">
        {data.avatar_url && (
          <img src={data.avatar_url} alt="" className="mb-4 h-24 w-24 rounded-full object-cover shadow-md" />
        )}
        {data.title && <h1 className="text-2xl font-bold leading-tight">{data.title}</h1>}
        {data.bio && (
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed opacity-85" style={{ fontWeight: theme.bold ? 600 : 400 }}>
            {data.bio}
          </p>
        )}

        <ul className="mt-8 flex w-full flex-col gap-3.5">
          {data.links.map((l) => {
            const icon = resolveIcon(l.icon, l.url)
            return (
              <li key={l.id}>
                <a
                  href={normalizeUrl(l.url)}
                  target={preview ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  style={btn}
                  className="relative flex min-h-14 w-full items-center justify-center px-12 py-3 text-[15px] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {icon && <Icon name={icon} size={20} className="absolute left-4" />}
                  <span className="break-words">{l.label || l.url}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
