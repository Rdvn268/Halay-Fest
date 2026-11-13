import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createGateway } from "./server.js";

const port = Number(process.env["GATEWAY_PORT"] ?? 8787);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid GATEWAY_PORT");
const path = resolve(process.env["DATABASE_PATH"] ?? "data/halay-fest.sqlite");
mkdirSync(dirname(path), { recursive: true });
const gateway = createGateway({
  databasePath: path,
  allowedOrigins: [
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:4174",
    "http://127.0.0.1:4175",
  ],
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
