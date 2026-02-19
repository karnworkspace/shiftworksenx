import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    assetsInlineLimit: 0, // Don't inline any assets, always emit separate files
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    pool: 'threads',
    threads: {
      singleThread: true,
    },
    maxConcurrency: 1,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/utils/**/*.ts',
        'src/stores/**/*.ts',
        'src/pages/ReportsPage.tsx',
        'src/pages/RosterPage.tsx',
        'src/pages/StaffPage.tsx',
        'src/pages/SettingsPage.tsx',
      ],
      exclude: ['src/utils/__tests__/**', 'src/setupTests.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70
      }
    }
  }
});
