import { expect, test } from "@playwright/test";
import type {
  MusicLibrary,
  MusicTrack,
  MusicTelemetry,
} from "@halay/contracts";
import { defaultSettings } from "@halay/contracts";
import { recordedBeatWav } from "../helpers/audio.js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { cpus, platform, release } from "node:os";
import { createHash } from "node:crypto";

test.skip(
  process.env["RUN_GPU_PROFILE"] !== "1",
  "Opt-in hardware profile: requires full Chromium and an actual GPU.",
);
test("measures ten-minute sync and profiles six and 106 rigs on the actual GPU at 1080x1920", async ({
  page,
  request,
  browser,
}) => {
  test.setTimeout(900_000);
  await page.setViewportSize({ width: 1080, height: 1920 });
  const library = (await (
    await request.get("/api/music")
  ).json()) as MusicLibrary;
  for (const track of library.tracks)
    await request.post("/api/music/delete", { data: { id: track.id } });
  await request.post("/api/control", { data: { action: "clear_players" } });
  await request.post("/api/control", { data: { action: "resume" } });
  await request.post("/api/settings", {
    data: { ...defaultSettings, randomEvents: false, autoCamera: true },
  });
  const track = (await (
    await request.post("/api/music/upload?filename=Hardware-calibration.wav", {
      headers: { "Content-Type": "audio/wav" },
      data: recordedBeatWav(720),
    })
  ).json()) as MusicTrack;
  await request.post(`/api/music/tracks/${track.id}`, {
    data: { bpm: 120, bpmSource: "manual", firstBeatSec: 0.15 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    `http://127.0.0.1:${process.env["TEST_PRODUCTION"] === "1" ? 4174 : 5173}/?broadcast=1`,
  );
  await expect(page.locator("canvas")).toHaveAttribute("data-rigs", "6");
  const renderer = await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2")!;
    const ext = gl.getExtension("WEBGL_debug_renderer_info")!;
    return {
      name: String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)),
      width: (canvas as HTMLCanvasElement).width,
      height: (canvas as HTMLCanvasElement).height,
    };
  });
  expect(renderer.name).not.toMatch(
    /SwiftShader|llvmpipe|Software|Microsoft Basic/i,
  );
  expect(renderer.width).toBe(1080);
  expect(renderer.height).toBe(1920);
  await page
    .getByRole("button", { name: "Ses motorunu aç", exact: true })
    .click();
  await page.mouse.click(1050, 30);
  await request.post("/api/music/transport", {
    data: { action: "play", trackId: track.id },
  });
  const telemetry = async () =>
    (await (
      await request.get("/api/music/telemetry")
    ).json()) as MusicTelemetry | null;
  await expect.poll(async () => (await telemetry())?.playing).toBe(true);
  const measure = async (count: number, durationMs: number) => {
    await expect
      .poll(async () => (await telemetry())?.rigs, { timeout: 20_000 })
      .toBe(count);
    await page.waitForTimeout(10_000);
    if (count === 6) {
      await mkdir("docs/evidence/phase-2", { recursive: true });
      await page.screenshot({
        path: "docs/evidence/phase-2/hardware-preview-6.png",
      });
    }
    const start = performance.now();
    const samples: { elapsed: number; telemetry: MusicTelemetry }[] = [];
    let nextLog = 0;
    while (performance.now() - start < durationMs) {
      const current = (await telemetry())!;
      expect(current.rigs).toBe(count);
      expect(current.playing).toBe(true);
      samples.push({
        elapsed: (performance.now() - start) / 1000,
        telemetry: current,
      });
      if (performance.now() - start >= nextLog) {
        console.log(
          JSON.stringify({
            rigs: count,
            seconds: Math.round((performance.now() - start) / 1000),
            fps: current.fps,
            frameP95Ms: current.frameP95Ms,
            driftP95Ms: current.driftP95Ms,
            onsetP95Ms: current.onsetErrorP95Ms,
          }),
        );
        nextLog += 30_000;
      }
      await page.waitForTimeout(5000);
    }
    samples.push({
      elapsed: (performance.now() - start) / 1000,
      telemetry: (await telemetry())!,
    });
    console.log(
      JSON.stringify({
        rigs: count,
        renderer: renderer.name,
        first: samples[0]?.telemetry,
        last: samples.at(-1)?.telemetry,
      }),
    );
    return samples;
  };
  const baseline = await measure(6, 600_000);
  expect(baseline.at(-1)!.telemetry.onsetSamples).toBeGreaterThan(500);
  expect(baseline.at(-1)!.telemetry.mediaSeconds).toBeGreaterThan(590);
  expect(baseline.at(-1)!.telemetry.driftP95Ms).toBeLessThan(100);
  expect(baseline.at(-1)!.telemetry.onsetErrorP95Ms!).toBeLessThan(100);
  const directory = "docs/evidence/phase-2";
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: `${directory}/hardware-6-1080x1920.png` });
  await request.post(`/api/music/tracks/${track.id}`, {
    data: { dance: "horon", beatsPerBar: 7, beatUnit: 8 },
  });
  await expect(page.locator("canvas")).toHaveAttribute("data-clip", /^horon_/);
  await page.screenshot({ path: `${directory}/hardware-horon-1080x1920.png` });
  await request.post(`/api/music/tracks/${track.id}`, {
    data: { dance: "halay", beatsPerBar: 2, beatUnit: 4 },
  });
  await expect(page.locator("canvas")).toHaveAttribute("data-clip", /^halay_/);
  for (let i = 0; i < 100; i++)
    expect(
      (
        await request.post("/api/mock", {
          data: {
            type: "chat",
            userId: `hardware-${i}`,
            displayName: `GPU Oyuncu ${i + 1}`,
            message: "katıl",
          },
        })
      ).ok(),
    ).toBe(true);
  const crowd = await measure(106, 60_000);
  await page.screenshot({ path: `${directory}/hardware-106-1080x1920.png` });
  await writeFile(
    `${directory}/hardware-performance.json`,
    JSON.stringify(
      {
        environment: {
          date: new Date().toISOString(),
          platform: platform(),
          release: release(),
          cpu: cpus()[0]?.model,
          browser: browser.version(),
          renderer,
          productionIndex: await readFile(
            "apps/broadcaster/dist/index.html",
            "utf8",
          ),
          workletSha256: createHash("sha256")
            .update(
              await readFile("apps/broadcaster/dist/audio-level-worklet.js"),
            )
            .digest("hex"),
          characterManifest: JSON.parse(
            await readFile(
              "apps/broadcaster/public/characters/festival-dancer.manifest.json",
              "utf8",
            ),
          ) as Record<string, unknown>,
          fiveHourSoak: "NOT RUN",
          realTwentyMinuteRound: "NOT RUN",
          scene: "one active scene, real file playback, no panel",
        },
        baseline,
        crowd,
        errors,
      },
      null,
      2,
    ),
  );
  expect(errors).toEqual([]);
});
