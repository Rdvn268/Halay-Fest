import { defineConfig } from "vite";
export default defineConfig({
  resolve: { conditions: ["development"] },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/ws": { target: "ws://127.0.0.1:8787", ws: true },
    },
  },
  build: {
    outDir: "dist",
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "three-core",
              test: /three\.core\.js$/,
              includeDependenciesRecursively: false,
              priority: 20,
            },
            {
              name: "three-renderer",
              test: /three\.module\.js$/,
              includeDependenciesRecursively: false,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
