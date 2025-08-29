// Arquivo: vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 1. Importe o plugin

// https://vite.dev/config/
export default defineConfig({
  // 2. Adicione a configuração do PWA
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // manifest.json
      manifest: {
        name: 'Agenda Autocontrol',
        short_name: 'Autocontrol',
        description: 'Sistema de Agendamento de Instalações',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'logo-icon-192.png', // Caminho para o ícone 192x192 na pasta 'public'
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-icon-512.png', // Caminho para o ícone 512x512 na pasta 'public'
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})