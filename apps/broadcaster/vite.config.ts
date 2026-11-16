import { defineConfig } from "vite";
import { resolve } from "node:path";
import { localPorts } from "../../scripts/local-ports.js";
const ports = localPorts();
export default defineConfig({
  resolve: { conditions: ["development"] },
  server: {
    host: "127.0.0.1",
    port: ports.devScene,
    strictPort: true,
    proxy: {
      "/api": `http://127.0.0.1:${ports.gateway}`,
      "/ws": { target: `ws://127.0.0.1:${ports.gateway}`, ws: true },
    },
  },
  build: {
    outDir: "dist",
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        review: resolve(import.meta.dirname, "review.html"),
        cinematic: resolve(import.meta.dirname, "cinematic.html"),
        character: resolve(import.meta.dirname, "character.html"),
      },
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
