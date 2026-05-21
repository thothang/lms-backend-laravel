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
      filename: 'pwa-sw.js',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'LMS - Quản Lý Thư Viện',
        short_name: 'LMS',
        description: 'Hệ thống quản lý thư viện trực tuyến - Mượn sách, đọc Ebook',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('pdfjs-dist')) return 'vendor-pdf';
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
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pay-sandbox.sepay.vn https://static.cloudflareinsights.com https://cdn.jsdelivr.net https://unpkg.com;",
        "connect-src 'self' ws://localhost:* http://localhost:* https://pay-sandbox.sepay.vn https://cdn.jsdelivr.net https://unpkg.com;",
        "img-src 'self' * data: blob:;",
        "style-src 'self' 'unsafe-inline' https://pay-sandbox.sepay.vn https://cdn.jsdelivr.net https://fonts.googleapis.com;",
        "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com;",
        "worker-src 'self' blob: https://unpkg.com;",
        "frame-src 'self' blob:;"
      ].join(' '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
})
