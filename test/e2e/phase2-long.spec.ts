import { test, expect } from "@playwright/test";
import type {
  MusicLibrary,
  MusicTrack,
  MusicTelemetry,
} from "@halay/contracts";
import { defaultSettings } from "@halay/contracts";
import { recordedBeatWav } from "../helpers/audio.js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { cpus, totalmem, platform, release } from "node:os";
import { performance } from "node:perf_hooks";

test("real ten-minute audio sync followed by 100-player 1080x1920 profiling", async ({
  page,
  request,
  browser,
}) => {
  test.skip(
    process.env["RUN_LONG_SYNC"] !== "1",
    "Explicit opt-in: this test takes at least twelve real minutes.",
  );
  test.setTimeout(900_000);
  await page.setViewportSize({ width: 1080, height: 1920 });
  const initial = (await (
    await request.get("/api/music")
  ).json()) as MusicLibrary;
  for (const track of initial.tracks)
    await request.post("/api/music/delete", { data: { id: track.id } });
  await request.post("/api/control", { data: { action: "clear_players" } });
  await request.post("/api/control", { data: { action: "resume" } });
  await request.post("/api/settings", {
    data: { ...defaultSettings, randomEvents: false, autoCamera: true },
  });
  const track = (await (
    await request.post(
      "/api/music/upload?filename=Original-calibration-720s.wav",
      { headers: { "Content-Type": "audio/wav" }, data: recordedBeatWav(720) },
    )
  ).json()) as MusicTrack;
  await request.post(`/api/music/tracks/${track.id}`, {
    data: { bpm: 120, bpmSource: "manual", firstBeatSec: 0.15 },
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const origin = `http://127.0.0.1:${(process.env["TEST_PRODUCTION"] === "1" ? 4174 : 5173) + Number(process.env["HALAY_PORT_OFFSET"] ?? 0)}`;
  await page.goto(`${origin}/?broadcast=1`);
  await expect(page.locator("canvas")).toHaveAttribute("data-rigs", "6");
  await page
    .getByRole("button", { name: "Ses motorunu aç", exact: true })
    .click();
  await request.post("/api/music/transport", {
    data: { action: "play", trackId: track.id },
  });
  const getTelemetry = async () =>
    (await (
      await request.get("/api/music/telemetry")
    ).json()) as MusicTelemetry;
  await expect
    .poll(async () => (await getTelemetry())?.playing, { timeout: 20_000 })
    .toBe(true);
  const start = performance.now(),
    samples: { elapsed: number; telemetry: MusicTelemetry }[] = [];
  let nextLog = 0;
  while (performance.now() - start < 600_000) {
    const elapsed = (performance.now() - start) / 1000;
    const telemetry = await getTelemetry();
    samples.push({ elapsed, telemetry });
    if (elapsed >= nextLog) {
      console.log(
        JSON.stringify({
          syncSeconds: Math.round(elapsed),
          media: telemetry.mediaSeconds,
          driftP95Ms: telemetry.driftP95Ms,
          onsetP95Ms: telemetry.onsetErrorP95Ms,
          fps: telemetry.fps,
        }),
      );
      nextLog += 30;
    }
    await page.waitForTimeout(10_000);
  }
  const final = await getTelemetry();
  samples.push({
    elapsed: (performance.now() - start) / 1000,
    telemetry: final,
  });
  const directory = "docs/evidence/phase-2";
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: `${directory}/halay-1080x1920.png` });
  await request.post(`/api/music/tracks/${track.id}`, {
    data: { dance: "horon", beatsPerBar: 7, beatUnit: 8 },
  });
  await expect(page.locator("canvas")).toHaveAttribute("data-clip", /^horon_/, {
    timeout: 15_000,
  });
  await page.screenshot({ path: `${directory}/horon-1080x1920.png` });
  await request.post(`/api/music/tracks/${track.id}`, {
    data: { dance: "halay", beatsPerBar: 2, beatUnit: 4 },
  });
  await expect(page.locator("canvas")).toHaveAttribute("data-clip", /^halay_/, {
    timeout: 15_000,
  });
  const renderer = await page.locator("canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      width: (canvas as HTMLCanvasElement).width,
      height: (canvas as HTMLCanvasElement).height,
      renderer: ext
        ? String(gl?.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : "Unavailable",
    };
  });
  const crowd: { elapsed: number; telemetry: MusicTelemetry }[] = [];
  for (let i = 0; i < 100; i++)
    expect(
      (
        await request.post("/api/mock", {
          data: {
            type: "chat",
            userId: `profile-${i}`,
            displayName: `Oyuncu ${i + 1}`,
            message: "katıl",
          },
        })
      ).ok(),
    ).toBe(true);
  await expect(page.locator("canvas")).toHaveAttribute("data-rigs", "106", {
    timeout: 30_000,
  });
  const crowdStart = performance.now();
  while (performance.now() - crowdStart < 60_000) {
    crowd.push({
      elapsed: (performance.now() - crowdStart) / 1000,
      telemetry: await getTelemetry(),
    });
    await page.waitForTimeout(5000);
  }
  await page.screenshot({ path: `${directory}/crowd-106-1080x1920.png` });
  const environment = {
    productionIndex: await readFile("apps/broadcaster/dist/index.html", "utf8"),
    characterManifest: JSON.parse(
      await readFile(
        "apps/broadcaster/public/characters/festival-dancer.manifest.json",
        "utf8",
      ),
    ) as Record<string, unknown>,
    date: new Date().toISOString(),
    platform: platform(),
    release: release(),
    cpu: cpus()[0]?.model,
    logicalCPUs: cpus().length,
    totalMemoryMiB: Math.round(totalmem() / 1048576),
    browser: browser.version(),
    renderer,
    mode: process.env["TEST_PRODUCTION"] === "1" ? "production" : "development",
    audio: "Original 120 BPM / 0.15 s test recording; not folk music",
    fiveHourSoak: "NOT RUN",
    realTwentyMinuteRound: "NOT RUN",
  };
  await writeFile(
    `${directory}/sync-and-performance.json`,
    JSON.stringify({ environment, samples, crowd, errors }, null, 2),
  );
  expect(errors).toEqual([]);
  expect(final.playing).toBe(true);
  expect(final.mediaSeconds).toBeGreaterThan(590);
  expect(final.onsetSamples).toBeGreaterThan(500);
  expect(final.onsetErrorP95Ms!).toBeLessThan(100);
  expect(final.driftP95Ms).toBeLessThan(100);
  expect(crowd.at(-1)!.telemetry.rigs).toBe(106);
  expect(crowd.at(-1)!.telemetry.playing).toBe(true);
});
