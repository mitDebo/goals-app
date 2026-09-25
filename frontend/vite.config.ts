/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // During local development, pass any /api request on to the backend
    // (dotnet run on port 5200). In production, nginx does this job instead.
    proxy: {
      '/api': 'http://localhost:5200',
    },
  },
  test: {
    // Fake browser page for component tests
    environment: 'jsdom',
    // Adds DOM matchers like toBeInTheDocument()
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
