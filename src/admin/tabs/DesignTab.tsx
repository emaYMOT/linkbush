import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Page } from '../../lib/supabase'
import { FONTS, type FontCategory, backgroundStyle, buttonStyle, defaultBorderColor, loadFont, type ButtonShape, type ButtonStyle, type Theme } from '../../lib/theme'
import { TEMPLATES } from '../../lib/templates'
import { uploadImage } from '../upload'
import { ColorInput, Segmented, secondaryBtn } from '../ui'

export default function DesignTab({ page, theme, onChange }: { page: Page; theme: Theme; onChange: (t: Theme) => void }) {
  const set = (patch: Partial<Theme>) => onChange({ ...theme, ...patch })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    FONTS.forEach((f) => loadFont(f.name))
  }, [])

  async function onFile(file?: File) {
    if (!file) return
    setUploading(true)
    try {
      set({ bgType: 'image', bgImage: await uploadImage(file, `${page.id}/bg`, 1600) })
    } catch {
      alert('No se pudo subir la imagen.')
    }
    setUploading(false)
  }

  return (
    <div className="max-w-xl space-y-8">
      <Section title="Plantillas" subtitle="Elige una como punto de partida y luego ajústala a tu gusto.">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {TEMPLATES.map((tpl) => {
            const active = JSON.stringify(tpl.theme) === JSON.stringify(theme)
            return (
              <button key={tpl.name} onClick={() => onChange(tpl.theme)} className="group text-left">
                <div
                  className={`flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl px-3 ring-2 transition ${
                    active ? 'ring-stone-900' : 'ring-transparent group-hover:ring-stone-300'
                  }`}
                  style={backgroundStyle(tpl.theme)}
                >
                  <span className="mb-0.5 text-lg leading-none" style={{ color: tpl.theme.textColor, fontFamily: `'${tpl.theme.font}'` }}>
                    Aa
                  </span>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-3 w-full" style={{ ...buttonStyle(tpl.theme), borderWidth: 1, boxShadow: 'none' }} />
                  ))}
                </div>
                <p className="mt-1.5 text-center text-xs font-medium text-stone-600">{tpl.name}</p>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Fondo">
        <Segmented
          value={theme.bgType}
          onChange={(v) => set({ bgType: v })}
          options={[
            { value: 'color', label: 'Color' },
            { value: 'gradient', label: 'Degradado' },
            { value: 'image', label: 'Imagen' },
          ]}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {theme.bgType === 'color' && <ColorInput label="Color de fondo" value={theme.bgColor} onChange={(v) => set({ bgColor: v })} />}
          {theme.bgType === 'gradient' && (
            <>
              <ColorInput label="Color 1" value={theme.bgGradient[0]} onChange={(v) => set({ bgGradient: [v, theme.bgGradient[1], theme.bgGradient[2]] })} />
              <ColorInput label="Color 2" value={theme.bgGradient[1]} onChange={(v) => set({ bgGradient: [theme.bgGradient[0], v, theme.bgGradient[2]] })} />
              <label className="sm:col-span-2">
                <span className="text-xs text-stone-500">Dirección ({theme.bgGradient[2]}°)</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={theme.bgGradient[2]}
                  onChange={(e) => set({ bgGradient: [theme.bgGradient[0], theme.bgGradient[1], Number(e.target.value)] })}
                  className="w-full accent-stone-900"
                />
              </label>
            </>
          )}
          {theme.bgType === 'image' && (
            <>
              <div className="flex items-center gap-3 sm:col-span-2">
                {theme.bgImage && <img src={theme.bgImage} alt="" className="h-16 w-12 rounded-lg object-cover ring-1 ring-stone-200" />}
                <button className={secondaryBtn} disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? 'Subiendo…' : theme.bgImage ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              </div>
              <ColorInput label="Color mientras carga" value={theme.bgColor} onChange={(v) => set({ bgColor: v })} />
            </>
          )}
        </div>
      </Section>

      <Section title="Texto">
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorInput label="Color del texto" value={theme.textColor} onChange={(v) => set({ textColor: v })} />
          <div className="flex flex-col justify-center">
            <span className="mb-1 text-xs text-stone-500">Grosor (botones y descripción)</span>
            <Segmented
              value={theme.bold ? 'bold' : 'normal'}
              onChange={(v) => set({ bold: v === 'bold' })}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'bold', label: 'Negrita' },
              ]}
            />
          </div>
        </div>
        {(['Moderna', 'Elegante', 'Llamativa', 'Manuscrita'] as FontCategory[]).map((cat) => (
          <div key={cat} className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">{cat}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONTS.filter((f) => f.cat === cat).map(({ name }) => (
                <button
                  key={name}
                  onClick={() => set({ font: name })}
                  style={{ fontFamily: `'${name}'` }}
                  className={`truncate rounded-xl border px-3 py-2.5 text-[15px] transition ${
                    theme.font === name ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white hover:border-stone-900'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Botones">
        <div className="space-y-3">
          <Segmented<ButtonStyle>
            value={theme.buttonStyle}
            onChange={(v) => set({ buttonStyle: v })}
            options={[
              { value: 'filled', label: 'Relleno' },
              { value: 'outline', label: 'Borde' },
              { value: 'soft', label: 'Suave' },
              { value: 'shadow', label: 'Sombra' },
            ]}
          />
          <Segmented<ButtonShape>
            value={theme.buttonShape}
            onChange={(v) => set({ buttonShape: v })}
            options={[
              { value: 'square', label: 'Recto' },
              { value: 'rounded', label: 'Redondeado' },
              { value: 'pill', label: 'Píldora' },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorInput label="Color del botón" value={theme.buttonColor} onChange={(v) => set({ buttonColor: v })} />
            {theme.buttonStyle !== 'outline' && theme.buttonStyle !== 'soft' && (
              <ColorInput label="Texto del botón" value={theme.buttonTextColor} onChange={(v) => set({ buttonTextColor: v })} />
            )}
            {theme.buttonStyle === 'shadow' && (
              <ColorInput label="Color de la sombra" value={theme.shadowColor || theme.textColor} onChange={(v) => set({ shadowColor: v })} />
            )}
            <div>
              <ColorInput
                label={theme.borderColor || theme.buttonStyle !== 'soft' ? 'Color del borde' : 'Color del borde (sin borde)'}
                value={theme.borderColor || (defaultBorderColor(theme) === 'transparent' ? theme.buttonColor : defaultBorderColor(theme))}
                onChange={(v) => set({ borderColor: v })}
              />
              {theme.borderColor && (
                <button className="mt-1 text-xs text-stone-500 underline hover:text-stone-900" onClick={() => set({ borderColor: undefined })}>
                  Volver al borde automático
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}
