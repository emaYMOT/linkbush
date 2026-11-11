import { lazy, Suspense } from 'react'
import { createHashRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router-dom'
import ErrorApp from './pages/ErrorApp'
import NotFound from './pages/NotFound'
import SiteLayout from './pages/SiteLayout'

// El panel se descarga solo cuando alguien entra a #/admin.
const Admin = lazy(() => import('./pages/admin/AdminApp'))

// Al volver atrás, cada página recupera la posición donde la persona estaba.
function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

const router = createHashRouter([
  {
    element: <Root />,
    // Cualquier fallo al mostrar una pantalla (también al bajar una parte del panel tras una publicación nueva).
    errorElement: <ErrorApp />,
    children: [
      { path: '/', element: <NotFound /> },
      {
        path: '/admin/*',
        element: (
          <Suspense fallback={<div className="min-h-dvh bg-papel" />}>
            <Admin />
          </Suspense>
        ),
      },
      // Cada página vive en su dirección (/#/pez-y-mar…). Con el comodín, /admin siempre gana sobre una página.
      { path: '/:slug/*', element: <SiteLayout /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
