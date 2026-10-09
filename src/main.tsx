import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PublicPage from './pages/PublicPage'
import './index.css'

// El panel se descarga aparte para que la página pública cargue rápido al escanear la tarjeta.
const AdminApp = lazy(() => import('./admin/AdminApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/:slug" element={<PublicPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
