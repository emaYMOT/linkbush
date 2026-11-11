import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { bySort } from '../lib/format'
import { LinkIcon } from '../lib/icons'
import { useSite } from '../lib/sitio'
import { store } from '../lib/store'
import { useCached } from '../lib/useCached'

export default function Home() {
  const { site, theme, rutaCarta } = useSite()
  const { data: links, error } = useCached(`links:${site.id}`, async () => (await store.list('links', site.id)).filter((l) => l.is_active).sort(bySort))
  const { estilo, forma, sombra, tamano } = theme.botones

  return (
    <main className="relative flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start px-5 pt-[max(5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:pt-[12vh] sm:pb-16">
        {error && <p className="rounded-xl bg-noche-2/90 p-4 text-sm text-niebla">No pudimos cargar la página. Revisa tu conexión y vuelve a intentarlo.</p>}

        <header className="mb-8 flex flex-col items-center text-center">
          <div className="encender" style={{ ['--i' as string]: 0 }}>
            <Avatar src={site.avatar_url} name={site.name} avatar={theme.avatar} />
          </div>
          <h1 className="encender sombra-texto mt-6 font-display text-[2.6rem] leading-[1.05] text-balance" style={{ ['--i' as string]: 1 }}>
            {site.name}
          </h1>
          {site.description && (
            <p className="encender sombra-texto-suave mt-4 max-w-[36ch] text-base leading-relaxed whitespace-pre-line text-cal/85 text-pretty" style={{ ['--i' as string]: 2 }}>
              {site.description}
            </p>
          )}
        </header>

        <nav className="flex flex-col gap-3" aria-label="Enlaces">
          {links?.map((link, index) => {
            const props = { className: 'boton encender', 'data-estilo': estilo, 'data-forma': forma, 'data-sombra': sombra, 'data-tamano': tamano, style: { ['--i' as string]: index + 3 } }
            const content = (
              <>
                <LinkIcon name={link.icon} size={22} className="icono" />
                <span className="text-center text-balance">{link.label}</span>
              </>
            )
            return link.type === 'menu' ? (
              <Link key={link.id} to={rutaCarta(link.menu_id)} viewTransition data-acento="" {...props}>
                {content}
              </Link>
            ) : (
              <a key={link.id} href={link.url ?? '#'} target="_blank" rel="noopener noreferrer" {...props}>
                {content}
              </a>
            )
          })}
        </nav>
      </div>
    </main>
  )
}
