/**
 * Optimized Vite configuration for best performance
 * Enable code splitting, tree-shaking, and bundle analysis
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['axios'],
        },
      },
    },
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
      },
    },
    // Source maps for production debugging
    sourcemap: 'hidden',
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  // Optimization hints
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
  },
});
