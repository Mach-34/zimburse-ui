import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite';
import { aztec } from '@shieldswap/vite-plugin-aztec';

export default defineConfig({
  plugins: [aztec(), react()],
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      target: "esnext",
    },
  },
});