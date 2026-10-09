import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Field, inputCls, primaryBtn } from './ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Correo o contraseña incorrectos')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <h1 className="text-2xl font-bold text-stone-900">Panel de tarjetas</h1>
        <p className="mt-1 text-sm text-stone-500">Inicia sesión para administrar las páginas.</p>
        <div className="mt-6 space-y-4">
          <Field label="Correo">
            <input type="email" required autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Contraseña">
            <input
              type="password"
              required
              autoComplete="current-password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={loading} className={`${primaryBtn} mt-6 w-full`}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
