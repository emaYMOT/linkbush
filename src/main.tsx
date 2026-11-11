import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { escucharVersionNueva } from './lib/version'

// Tras una publicación, una pestaña vieja que pide un archivo que ya no existe recarga sola.
escucharVersionNueva()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
