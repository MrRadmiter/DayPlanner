import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
                            VitePWA({
                              registerType: 'autoUpdate',
                              manifest: {
                                name: 'Daymark Planner',
                                short_name: 'Daymark',
                                theme_color: '#0f172a',
                                icons: [
                                  {
                                    src: 'pwa-192x192.png',
                                    sizes: '192x192',
                                    type: 'image/png'
                                  }
                                ]
                              }
                            })
  ]
})
