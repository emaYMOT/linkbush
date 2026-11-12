import { alOriginal, miniatura } from '../lib/medios'
import type { Theme } from '../lib/types'

/** Foto de perfil (o el nombre, si no hay foto) con la forma y el aro elegidos en el panel. */
export default function Avatar({ src, name, size = 104, avatar }: { src: string | null; name: string; size?: number; avatar: Theme['avatar'] }) {
  return (
    <div className="avatar" data-aro={avatar.aro} data-forma={avatar.forma} style={{ width: size, height: size }}>
      <div className="avatar-foto">
        {src ? (
          <img src={miniatura(src)} onError={alOriginal(src)} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center px-[14%] text-center font-display text-[length:calc(var(--s)*var(--f))] leading-[1.05] text-balance italic text-cal [overflow-wrap:anywhere]" style={{ ['--s' as string]: `${size}px`, ['--f' as string]: name.length > 8 ? 0.17 : 0.24 }}>
            {name}
          </div>
        )}
      </div>
    </div>
  )
}
