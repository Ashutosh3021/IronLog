import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/IronLog/'

/** Precache + offline navigation for GitHub Pages project path and local preview */
const pwaIncludeAssets = [
  'Assets/favicon.ico',
  'Assets/favicon-16x16.png',
  'Assets/favicon-32x32.png',
  'Assets/apple-touch-icon.png',
  'Assets/android-chrome-192x192.png',
  'Assets/android-chrome-512x512.png',
  'Assets/site.webmanifest',
]

export default defineConfig({
  base,
  /**
   * Default `assets` clashes with `public/Assets` on case-insensitive OSes; the SW would
   * precache wrong-cased URLs and break offline on Linux (GitHub Pages).
   */
  build: {
    assetsDir: 'bundle',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: pwaIncludeAssets,
      /**
       * Service worker + manifest on `npm run dev`.
       * Open http://localhost:5173/IronLog/ (same base as production).
       * Allowlist must include `/IronLog/` — default [/^\/$/] only matches site root.
       */
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallbackAllowlist: [/^\/IronLog\/?$/],
        /** Avoid Workbox glob scan on empty `dev-dist` (harmless; production build unchanged). */
        suppressWarnings: true,
      },
      manifest: {
        name: 'IRON LOG — 5/3/1 Weightlifting Tracker',
        short_name: 'IRON LOG',
        description:
          'Comprehensive 5/3/1 Weightlifting Progress Tracker and Calculator for strength athletes.',
        id: 'ironlog-pwa',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#0f0f0f',
        theme_color: '#111111',
        orientation: 'portrait-primary',
        categories: ['fitness', 'sports', 'utilities'],
        shortcuts: [
          {
            name: "Today's Lifts",
            short_name: 'Lifts',
            description: 'Go directly to today’s workout',
            url: `${base}?tab=home`,
            icons: [
              {
                src: `${base}Assets/android-chrome-192x192.png`,
                sizes: '192x192',
                type: 'image/png',
              },
            ],
          },
          {
            name: 'Statistics',
            short_name: 'Stats',
            description: 'View your progress charts',
            url: `${base}?tab=analytics`,
            icons: [
              {
                src: `${base}Assets/android-chrome-192x192.png`,
                sizes: '192x192',
                type: 'image/png',
              },
            ],
          },
        ],
        icons: [
          {
            src: `${base}Assets/android-chrome-192x192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}Assets/android-chrome-512x512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2,webmanifest}'],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\/api\//],
      },
    }),
  ],
  server: {
    /** Open the app under the same base path as production (required when base is set) */
    open: `${base.replace(/\/$/, '')}/`,
  },
})
