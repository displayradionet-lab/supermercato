import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Aumenta il limite del warning da 500 kB a 1000 kB (1 MB)
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    exclude: ['@icons-pack/react-simple-icons'], // Prevents Vite from parsing this massive dependency
  },
});
