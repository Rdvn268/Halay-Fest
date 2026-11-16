/** Real engine evidence, one character only. Start npm run dev first. */
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { localPorts } from "./local-ports.js";

const out = "docs/evidence/single-character";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1440 },
    deviceScaleFactor: 1,
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${localPorts().devScene}/character.html`);
  await page
    .locator("button[data-angle=front]:enabled")
    .waitFor({ timeout: 45_000 });
  const metrics = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          __halayCharacter: { metrics: () => Record<string, unknown> };
        }
      ).__halayCharacter.metrics(),
    );
  const frame = () => page.locator("canvas").getAttribute("data-frame");
  for (const angle of ["front", "side", "face", "hands", "feet"]) {
    await page.locator(`[data-angle=${angle}]`).click();
    const previous = Number(await frame());
    await page.waitForFunction(
      (n) =>
        Number(document.querySelector("canvas")?.getAttribute("data-frame")) >
        n + 2,
      previous,
    );
    await page.screenshot({ path: `${out}/engine-${angle}.png` });
  }
  await page.locator("[data-angle=front]").click();
  await page.getByLabel("İskelet", { exact: true }).check();
  await page.screenshot({ path: `${out}/engine-rig.png` });
  await page.getByLabel("İskelet", { exact: true }).uncheck();
  // Warm the real shaders; this is measurement time, not a readiness guess.
  await page.waitForTimeout(5000);
  const samples: Record<string, unknown>[] = [];
  const started = Date.now();
  while (Date.now() - started < 10000) {
    samples.push({ elapsedMs: Date.now() - started, ...(await metrics()) });
    await page.waitForTimeout(500);
  }
  const context = await page.evaluate(() => {
    const gl = document.querySelector("canvas")!.getContext("webgl2")!;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      userAgent: navigator.userAgent,
      gpu: info
        ? (gl.getParameter(info.UNMASKED_RENDERER_WEBGL) as string)
        : "unavailable",
    };
  });
  const hashes: Record<string, string> = {};
  for (const file of [
    "scripts/build-production-character.py",
    "packages/halay-game/src/humanoid/production-character.ts",
    "apps/broadcaster/public/characters/production/wedding-guest-01.glb",
    "assets/characters/wedding-guest-01/wedding-guest-01.blend",
  ])
    hashes[file] = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
  await writeFile(
    `${out}/engine-profile.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        scope: "one static rigged character, not dance/6/100-player acceptance",
        browser: browser.version(),
        durationMs: Date.now() - started,
        context,
        errors,
        hashes,
        samples,
      },
      null,
      2,
    ) + "\n",
  );
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    `Saved 6 real engine screenshots and ${samples.length} samples to ${out}`,
  );
} finally {
  await browser.close();
}
