import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Hệ Thống Quản Lý Thư Viện',
        short_name: 'LMS Library',
        description: 'Hệ thống quản lý thư viện trực tuyến - Mượn sách, đọc Ebook, quản lý tài chính',
        theme_color: '#4F46E5',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['education', 'books', 'productivity'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\/.*/, /^\/storage\/.*/],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https?:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-queue',
                options: {
                  maxRetentionTime: 0
                }
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('axios') || id.includes('sonner') || id.includes('framer-motion') || id.includes('lucide')) return 'vendor-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true,
    allowedHosts: ['nonperverted-superable-moon.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      },
      '/sepay-checkout': {
        target: 'https://pay-sandbox.sepay.vn/v1/checkout/init',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sepay-checkout/, ''),
        headers: {
          'Origin': 'https://pay-sandbox.sepay.vn',
          'Referer': 'https://pay-sandbox.sepay.vn/',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
        },
        cookieDomainRewrite: 'localhost',
        secure: false
      },
      '/cdn-cgi': {
        target: 'https://pay-sandbox.sepay.vn',
        changeOrigin: true,
        headers: {
          'Origin': 'https://pay-sandbox.sepay.vn',
          'Referer': 'https://pay-sandbox.sepay.vn/',
        },
        secure: false
      }
    },
    headers: {
      'Content-Security-Policy': [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pay-sandbox.sepay.vn https://static.cloudflareinsights.com https://cdn.jsdelivr.net;",
        "connect-src 'self' ws://localhost:* http://localhost:* https://pay-sandbox.sepay.vn https://cdn.jsdelivr.net;",
        "img-src 'self' * data: blob:;",
        "style-src 'self' 'unsafe-inline' https://pay-sandbox.sepay.vn https://cdn.jsdelivr.net;",
        "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com;",
        "worker-src 'self' blob:;",
        "frame-src 'self' blob:;"
      ].join(' ')
    }
  }
})
