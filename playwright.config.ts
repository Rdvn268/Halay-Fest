import { defineConfig } from "@playwright/test";
import { localPorts } from "./scripts/local-ports.js";
process.env["HALAY_PORT_OFFSET"] = "10000";
const ports = localPorts();

const production = process.env["TEST_PRODUCTION"] === "1";
export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  projects: [
    {
      name: "panel-ui",
      testMatch: "panel-ui.spec.ts",
      use: {
        baseURL: `http://127.0.0.1:${production ? ports.productionPanel : ports.devPanel}`,
      },
    },
    {
      name: "phase-2-hardware",
      testMatch: "phase2-hardware.spec.ts",
      use: {
        baseURL: `http://127.0.0.1:${production ? ports.productionPanel : ports.devPanel}`,
        channel: "chromium",
        launchOptions: { args: [] },
      },
    },
    {
      name: "phase-2-long",
      testMatch: "phase2-long.spec.ts",
      use: {
        baseURL: `http://127.0.0.1:${production ? ports.productionPanel : ports.devPanel}`,
      },
    },
    { name: "legacy", testMatch: "legacy.spec.ts" },
    {
      name: "phase-1",
      testMatch: "phase1.spec.ts",
      use: {
        baseURL: `http://127.0.0.1:${production ? ports.productionPanel : ports.devPanel}`,
      },
    },
    {
      name: "phase-2",
      testMatch: "phase2.spec.ts",
      use: {
        baseURL: `http://127.0.0.1:${production ? ports.productionPanel : ports.devPanel}`,
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev:legacy",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: !process.env["CI"],
      timeout: 60_000,
    },
    {
      command: production ? "npm start" : "npm run dev",
      url: `http://127.0.0.1:${production ? ports.productionPanel : ports.devPanel}/api/health`,
      env: {
        DATABASE_PATH: "data/e2e.sqlite",
        HALAY_PORT_OFFSET: "10000",
        GATEWAY_PORT: String(ports.gateway),
      },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
