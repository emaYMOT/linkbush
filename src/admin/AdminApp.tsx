import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'
import Login from './Login'
import Dashboard from './Dashboard'
import Editor from './Editor'

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    document.title = 'Panel · Links'
    loadInter()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg p-8 text-stone-700">
        <h1 className="text-xl font-bold">Falta configurar Supabase</h1>
        <p className="mt-2 text-sm">
          Crea un archivo <code className="rounded bg-stone-200 px-1">.env</code> con <code>VITE_SUPABASE_URL</code> y{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> (ver <code>.env.example</code> y el README).
        </p>
      </div>
    )
  }

  if (session === undefined) return null
  if (!session) return <Login />

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900">
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="p/:id" element={<Editor />} />
      </Routes>
    </div>
  )
}

function loadInter() {
  if (document.getElementById('inter-font')) return
  const l = document.createElement('link')
  l.id = 'inter-font'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  document.head.appendChild(l)
}
