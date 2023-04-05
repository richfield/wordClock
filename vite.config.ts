import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import eslint from 'vite-plugin-eslint';
import macrosPlugin from 'vite-plugin-babel-macros';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },
  build: {
    chunkSizeWarningLimit: 1024
  },
  plugins: [
    react(),
    eslint(),
    macrosPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [ 'favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'favicon-16x16.png', 'favicon-32x32.png' ],
      manifest: {
        name: 'Woordklok',
        short_name: 'WoordKlok',
        description: 'Woordklok',
        theme_color: '#222',
        orientation: 'any',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});

