import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite';
// import { aztec } from '@shieldswap/vite-plugin-aztec';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [nodePolyfills(), react()],
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});