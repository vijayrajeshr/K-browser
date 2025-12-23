import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['jsdom', '@mozilla/readability'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
      },
      renderer: process.env.NODE_ENV === 'test'
        ? undefined
        : {},
    }),
  ],
  // Build optimizations for performance
  build: {
    target: 'esnext',  // Minimize polyfills
    minify: 'esbuild', // Fast minification
    chunkSizeWarningLimit: 600, // Prevent warnings for vendor chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['preact', 'zustand'],
        },
      },
    },
  },
})

