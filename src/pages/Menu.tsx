import { ArrowRight, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoryCover from '../components/CategoryCover'
import { useCartaActual, useSite } from '../lib/sitio'
import { loadPublicMenu } from '../lib/store'
import { useCached } from '../lib/useCached'
import { useRouteFocus } from '../lib/useRouteFocus'

export default function Menu() {
  const { site, home, cartas } = useSite()
  const { carta, base, redirect } = useCartaActual()
  const { data, error } = useCached(`menu:${site.id}:${carta?.id ?? 'principal'}`, () => loadPublicMenu(site.id, carta?.id ?? null))
  const main = useRouteFocus<HTMLElement>()

  if (redirect) return redirect
  if (!carta) return <div className="min-h-dvh" />
  const { t } = carta

  return (
    <main ref={main} tabIndex={-1} aria-labelledby="titulo-carta" className="min-h-dvh outline-none">
      <div className="mx-auto max-w-3xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-16 sm:px-6">
        <Link to={home} viewTransition className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-niebla transition-colors hover:text-cal">
          <ChevronLeft size={18} aria-hidden />
          {t.inicio}
        </Link>

        <header className="mt-6 px-1">
          <h1 id="titulo-carta" className="font-display text-[3.25rem] leading-none text-balance sm:text-[4.5rem]">{carta.titulo}</h1>
          {carta.subtitulo && <p className="mt-4 text-niebla">{carta.subtitulo}</p>}
        </header>

        {/* Con más de una carta (por ejemplo, en inglés), se cambia entre ellas desde aquí. */}
        {cartas.length > 1 && (
          <nav aria-label={t.otrasCartas} className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6">
            {cartas.map((c) => {
              const activa = c.ruta === carta.ruta
              return (
                <Link
                  key={c.ruta}
                  to={`${home}/${c.ruta}`}
                  replace
                  viewTransition
                  lang={c.idioma}
                  aria-current={activa ? 'page' : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activa ? 'bg-cobre text-noche' : 'vidrio border border-cal/12 bg-noche/50 text-cal/85 hover:border-cobre/50 hover:text-cal'
                  }`}
                >
                  {c.nombre}
                </Link>
              )
            })}
          </nav>
        )}

        {error && <p className="mt-10 px-1 text-niebla">{t.error}</p>}
        {data && data.categories.length === 0 && <p className="mt-10 px-1 text-niebla">{t.vacia}</p>}

        {!data && !error && (
          <div className="mt-9 flex flex-col gap-4 sm:gap-5" aria-busy="true" aria-label={t.cargando}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[clamp(13.5rem,62vw,22rem)] rounded-[1.75rem] bg-noche-2/50 motion-safe:animate-pulse" />
            ))}
          </div>
        )}

        <ul className="mt-9 flex flex-col gap-4 sm:gap-5">
          {(data?.categories ?? []).map((category, index) => (
            <li key={category.id}>
              <Link
                to={`${base}/${category.id}`}
                viewTransition
                className="group relative isolate block h-[clamp(13.5rem,62vw,22rem)] overflow-hidden rounded-[1.75rem] bg-noche-2/30 transition [clip-path:inset(0_round_1.75rem)] active:scale-[.99]"
              >
                <CategoryCover category={category} index={index} eager={index < 2} />
                {/* Difuminado para que el nombre se lea sobre cualquier foto. */}
                <div className="absolute -inset-px bg-gradient-to-t from-noche/95 via-noche/45 via-45% to-noche/5" />
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-7">
                  <div className="min-w-0 flex-1">
                    <span className="etiqueta inline-block rounded-full bg-noche/60 px-2.5 py-1 text-cobre-2 backdrop-blur-md">
                      {category.items.length} {category.items.length === 1 ? t.uno : t.varios}
                    </span>
                    <h2 className="mt-2 font-display text-[2.1rem] leading-[1.02] text-cal text-balance sm:text-[2.75rem]">{category.name}</h2>
                    {category.description && <p className="mt-2 line-clamp-1 max-w-[46ch] text-sm text-cal/70">{category.description}</p>}
                  </div>
                  <span className="sombra-acento grid size-12 shrink-0 place-items-center rounded-full bg-cobre text-noche transition group-hover:translate-x-1">
                    <ArrowRight size={20} aria-hidden />
                  </span>
                </div>
                {/* Borde fino por dentro y encima de la foto: así la esquina no deja ver un hilo sin oscurecer. */}
                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-cal/8 ring-inset transition group-hover:ring-cobre/50" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
