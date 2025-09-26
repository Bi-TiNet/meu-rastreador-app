// Arquivo: vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from 'tailwindcss' // Importa o TailwindCSS

export default defineConfig({
  // Adiciona a configuração de CSS diretamente aqui
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Agenda Autocontrol',
        short_name: 'Autocontrol',
        description: 'Sistema de Agendamento de Instalações',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})