/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig(() => {
  const proxyTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'
  return {
  plugins: [
    react(),
    compression({ algorithm: 'gzip', threshold: 1024 }),
    compression({ algorithm: 'brotliCompress', threshold: 1024 }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces para evitar problemas de IPv6
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: false, // Deshabilitar overlay de errores de HMR
    },
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.dev', '.ngrok.io'],
    // Force cache invalidation in development
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    watch: {
      ignored: ['**/backend/**', '**/target/**', '**/node_modules/**']
    },
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        // Kong handles routing to backend - path stays as-is
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Avoid backend CORS rejection in local proxy mode:
            // browser sends Origin localhost:517x, but backend whitelist may differ.
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
            // Estos logs aparecen en la terminal del servidor de Vite
            console.log('[Vite Proxy] Proxying:', req.method, req.url, '->', proxyReq.path, `target=${proxyTarget}`);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy] Error:', err.message, 'for', req.url, `target=${proxyTarget}`);
          });
        },
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-chakra': ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-signalr': ['@microsoft/signalr'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-utils': ['dompurify', 'html2canvas'],
        }
      }
    }
  }
  }
})
