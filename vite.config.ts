import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base '/': las direcciones son reales (linkbush.pages.dev/pezymar/carta), así que el código se pide desde la raíz.
// Cloudflare Pages entrega index.html para cualquier dirección que no sea un archivo.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
