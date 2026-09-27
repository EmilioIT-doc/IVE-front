import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Todo lo que empiece con /api se reenvía al back (Express en :3000).
    // Para el navegador front y API quedan en el MISMO origen: sin problemas
    // de CORS y las cookies httpOnly viajan solas.
    proxy: {
      '/api': 'http://localhost:3000',
      // Fotos que suben los administradores (las guarda el back en back/uploads)
      '/uploads': 'http://localhost:3000',
    },
  },
})
