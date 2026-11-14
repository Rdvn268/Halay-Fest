import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createServer, preview } from "vite";
import { localPorts } from "./local-ports.js";

const production = process.argv.includes("--production");
const ports = localPorts();
const gateway = spawn(
  process.execPath,
  production
    ? ["dist/services/live-gateway/src/main.js"]
    : [
        "--conditions=development",
        "--import=tsx",
        "services/live-gateway/src/main.ts",
      ],
  { stdio: ["inherit", "inherit", "inherit", "ipc"], windowsHide: true },
);
const ready = new Promise<void>((resolve, reject) => {
  gateway.once("message", () => resolve());
  gateway.once("error", reject);
  gateway.once("exit", () =>
    reject(new Error("Gateway closed before startup.")),
  );
});
const servers: { close: () => Promise<void> | void }[] = [];
let closing = false;
async function close(code = 0) {
  if (closing) return;
  closing = true;
  gateway.kill();
  await Promise.allSettled(servers.map((server) => server.close()));
  process.exitCode = code;
}
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void close();
  });
gateway.on("exit", (code) => {
  if (!closing) void close(code ?? 1);
});
gateway.on("error", (error) => {
  console.error(error.message);
  void close(1);
});
try {
  await ready;
  for (const [name, port] of [
    ["broadcaster", production ? ports.productionScene : ports.devScene],
    ["control-panel", production ? ports.productionPanel : ports.devPanel],
  ] as const) {
    if (production) {
      const server = await preview({
        root: resolve("apps", name),
        preview: { host: "127.0.0.1", port, strictPort: true },
      });
      servers.push({
        close: () =>
          new Promise<void>((resolve, reject) =>
            server.httpServer.close((error) =>
              error ? reject(error) : resolve(),
            ),
          ),
      });
    } else {
      const server = await createServer({ root: resolve("apps", name) });
      servers.push(server);
      await server.listen();
    }
    console.log(`${name}: http://127.0.0.1:${port}`);
  }
} catch (error) {
  console.error(error);
  await close(1);
}
