import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx}'],
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
      '^react-router-dom$': '<rootDir>/__mocks__/react-router-dom.js',
      '^axios$': '<rootDir>/__mocks__/axios.js',
      '^sonner$': '<rootDir>/__mocks__/sonner.js',
      '^@/lib/utils$': '<rootDir>/src/lib/utils.jsx',
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        '**/*.config.js',
        '**/*.config.jsx',
        'vite.config.js',
      ],
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 5000,
    open: false,
  },
  preview: {
    port: 5000,
  },
})