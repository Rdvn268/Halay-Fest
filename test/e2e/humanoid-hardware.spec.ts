import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { defaultSettings } from "@halay/contracts";
import { recordedBeatWav } from "../helpers/audio.js";
import type { ReviewMetrics } from "../../packages/halay-game/src/humanoid/review-scene.js";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { cpus, platform, release } from "node:os";
test.skip(
  process.env["RUN_HUMANOID_PROFILE"] !== "1",
  "Opt-in review GPU/video profile; not a folklore acceptance or five-hour soak.",
);
const read = (p: Page) =>
  p.evaluate(
    () => (window as unknown as { __halayReview: ReviewMetrics }).__halayReview,
  );
test("records a real 1080x1920 audible contact-study cycle and measures six/106 humanoids without an FPS guarantee", async ({
  page,
  request,
  browser,
}, info) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1080, height: 1920 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const library = await (await request.get("/api/music")).json();
  for (const t of library.tracks)
    await request.post("/api/music/delete", { data: { id: t.id } });
  await request.post("/api/settings", {
    data: { ...defaultSettings, musicMode: "halay", randomEvents: false },
  });
  await request.post("/api/control", { data: { action: "clear_players" } });
  await request.post("/api/control", { data: { action: "resume" } });
  const response = await request.post(
    "/api/music/upload?filename=Original-review-calibration.wav",
    { headers: { "Content-Type": "audio/wav" }, data: recordedBeatWav(120) },
  );
  expect(response.status()).toBe(201);
  const track = await response.json();
  await request.post(`/api/music/tracks/${track.id}`, {
    data: {
      bpm: 120,
      bpmSource: "manual",
      dance: "halay",
      firstBeatSec: 0.15,
      beatsPerBar: 2,
      beatUnit: 4,
    },
  });
  await request.post("/api/music/library", {
    data: {
      playlists: [
        {
          id: "festival",
          name: "Original review signal",
          trackIds: [track.id],
        },
      ],
      activePlaylistId: "festival",
      repeat: true,
      autoplay: true,
    },
  });
  await page.goto("/review.html");
  await expect(page.locator('canvas[data-asset-ready="true"]')).toBeVisible({
    timeout: 45000,
  });
  await page
    .getByRole("button", { name: "Ses motorunu aç", exact: true })
    .click();
  await request.post("/api/music/transport", {
    data: { action: "play", trackId: track.id },
  });
  await expect.poll(async () => (await read(page)).playing).toBe(true);
  const download = page.waitForEvent("download", { timeout: 30000 });
  await page
    .getByRole("button", { name: "16 sn sesli kayıt", exact: true })
    .click();
  await page.waitForTimeout(2000);
  const renderer = await page.locator("canvas").evaluate((c) => {
    const canvas = c as HTMLCanvasElement,
      gl = canvas.getContext("webgl2")!,
      ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      name: ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER)),
      width: canvas.width,
      height: canvas.height,
    };
  });
  expect(renderer.name).not.toMatch(/swiftshader|llvmpipe/i);
  expect(renderer.width).toBe(1080);
  expect(renderer.height).toBe(1920);
  const six: ReviewMetrics[] = [];
  const start = performance.now();
  for (let i = 0; i < 26; i++) {
    await page.waitForTimeout(500);
    six.push(await read(page));
  }
  const sixSeconds = (performance.now() - start) / 1000;
  const path = info.outputPath("humanoid-cycle-av.webm");
  await (await download).saveAs(path);
  await page
    .getByRole("button", { name: "9:16 kayıt kadrajı", exact: true })
    .click();
  await page.screenshot({ path: info.outputPath("humanoid-front.png") });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Yandan", exact: true }).click();
  await page
    .getByRole("button", { name: "9:16 kayıt kadrajı", exact: true })
    .click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: info.outputPath("humanoid-side.png") });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Önden", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Yalnızca bu pencerede", exact: true })
    .selectOption("106");
  await expect.poll(async () => (await read(page)).actors).toBe(106);
  await page
    .getByRole("button", { name: "9:16 kayıt kadrajı", exact: true })
    .click();
  await page.waitForTimeout(2000);
  const crowd: ReviewMetrics[] = [];
  const crowdStart = performance.now();
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    crowd.push(await read(page));
  }
  const crowdSeconds = (performance.now() - crowdStart) / 1000;
  await page.screenshot({ path: info.outputPath("humanoid-106.png") });
  const video = await readFile(path);
  expect(video.includes(Buffer.from("A_OPUS"))).toBe(true);
  expect(video.includes(Buffer.from("V_VP8"))).toBe(true);
  const decoded = await page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const ctx = new AudioContext();
    try {
      const buffer = await ctx.decodeAudioData(bytes.buffer),
        channel = buffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < channel.length; i += 16)
        sum += channel[i]! * channel[i]!;
      return {
        audioDuration: buffer.duration,
        sampleRate: buffer.sampleRate,
        rms: Math.sqrt(sum / Math.ceil(channel.length / 16)),
      };
    } finally {
      await ctx.close();
    }
  }, video.toString("base64"));
  expect(decoded.audioDuration).toBeGreaterThan(15);
  expect(decoded.rms).toBeGreaterThan(0.0001);
  const sources: Record<string, string> = {};
  for (const name of [
    "review-scene",
    "rig",
    "contact",
    "studies",
    "retarget",
    "sequence",
    "courtyard",
  ]) {
    sources[name] = createHash("sha256")
      .update(await readFile(`packages/halay-game/src/humanoid/${name}.ts`))
      .digest("hex");
  }
  expect(errors).toEqual([]);
  await writeFile(
    info.outputPath("humanoid-profile.json"),
    JSON.stringify(
      {
        kind: "technical-studies-not-approved-halay",
        recordedAt: new Date().toISOString(),
        platform: platform(),
        release: release(),
        cpu: cpus()[0]?.model,
        browser: browser.version(),
        renderer,
        recording: {
          sha256: createHash("sha256").update(video).digest("hex"),
          bytes: video.length,
          ...decoded,
        },
        sources,
        sixSeconds,
        crowdSeconds,
        six,
        crowd,
        errors,
        limits: [
          "Only short local profiling; no 20-minute/5-hour guarantee",
          "Palm/ankle markers, not mesh collision or pressure",
          "External user-window GPU load was not controlled",
          "Calibration signal is not licensed Halay music",
          "No mocap, regional/expert or user visual acceptance",
        ],
      },
      null,
      2,
    ),
  );
});
