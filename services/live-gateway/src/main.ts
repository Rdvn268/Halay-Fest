import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createGateway } from "./server.js";
import { localPorts } from "../../../scripts/local-ports.js";

const ports = localPorts();
const port = Number(process.env["GATEWAY_PORT"] ?? ports.gateway);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid GATEWAY_PORT");
const path = resolve(process.env["DATABASE_PATH"] ?? "data/halay-fest.sqlite");
mkdirSync(dirname(path), { recursive: true });
const gateway = createGateway({
  databasePath: path,
  // Keep test/dev libraries isolated even when their databases share a parent.
  musicDirectory: `${path}.music`,
  allowedOrigins: [
    ports.devScene,
    ports.devPanel,
    ports.productionScene,
    ports.productionPanel,
  ].map((port) => `http://127.0.0.1:${port}`),
});
gateway.server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
  void gateway.close();
});
gateway.server.listen(port, "127.0.0.1", () => {
  console.log(`Mock gateway http://127.0.0.1:${port} — TikTok desteklenmiyor`);
  process.send?.({ ready: true });
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void gateway.close();
  });
