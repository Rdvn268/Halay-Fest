import { defineConfig } from "vite";
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
