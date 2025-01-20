import react from '@vitejs/plugin-react'
import { defineConfig, Plugin, searchForWorkspaceRoot } from "vite";
import { PolyfillOptions, nodePolyfills } from "vite-plugin-node-polyfills";
import topLevelAwait from "vite-plugin-top-level-await";

// Unfortunate, but needed due to https://github.com/davidmyersdev/vite-plugin-node-polyfills/issues/81
// Suspected to be because of the yarn workspace setup, but not sure
const nodePolyfillsFix = (options?: PolyfillOptions | undefined): Plugin => {
  return {
    ...nodePolyfills(options),
    resolveId(source: string) {
      const m = /^vite-plugin-node-polyfills\/shims\/(buffer|global|process)$/.exec(source)
      if (m) {
        return `node_modules/vite-plugin-node-polyfills/shims/${m[1]}/dist/index.cjs`
      }
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("bb-prover")) {
            return "@aztec/bb-prover";
          }
        },
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        "../../../yarn-project/noir-protocol-circuits-types/artifacts",
        "../../../noir/packages/noirc_abi/web",
        "../../../noir/packages/acvm_js/web",
      ],
    },
  },
  plugins: [
    // @ts-expect-error - fs/promises is not in the types
    nodePolyfillsFix({ include: ["buffer", "crypto", 'fs/promises', "process", "path", "stream", "timers", "tty", "util"] }),
    react(),
    topLevelAwait(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      supported: {
        "top-level-await": true,
      },
    },
    exclude: ["@noir-lang/acvm_js", "@noir-lang/noirc_abi", "@aztec/bb-prover"],
  },
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },
});