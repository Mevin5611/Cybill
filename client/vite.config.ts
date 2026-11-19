import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const proxy = {
  '/api': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [react()],

  base: './',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  server: {
    port: 5173,
    strictPort: true,
    proxy
  },

  preview: {
    port: 4173,
    strictPort: true,
    proxy
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});