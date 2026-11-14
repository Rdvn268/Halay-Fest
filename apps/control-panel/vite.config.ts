import { defineConfig } from "vite";
import { localPorts } from "../../scripts/local-ports.js";
const ports = localPorts();
export default defineConfig({
  resolve: { conditions: ["development"] },
  server: {
    host: "127.0.0.1",
    port: ports.devPanel,
    strictPort: true,
    proxy: {
      "/api": `http://127.0.0.1:${ports.gateway}`,
      "/ws": { target: `ws://127.0.0.1:${ports.gateway}`, ws: true },
    },
  },
  build: { outDir: "dist" },
});
