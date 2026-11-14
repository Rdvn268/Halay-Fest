import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { defaultSettings } from "@halay/contracts";
import { recordedBeatWav } from "../helpers/audio.js";
import { motionFixture } from "../helpers/humanoid.js";
import { writeFile } from "node:fs/promises";
import type { ReviewMetrics } from "../../packages/halay-game/src/humanoid/review-scene.js";
const read = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __halayReview: ReviewMetrics }).__halayReview,
  );
test.beforeEach(async ({ request }) => {
  await request.post("/api/settings", {
    data: {
      ...defaultSettings,
      musicMode: "halay",
      randomEvents: false,
      autoCamera: false,
    },
  });
  await request.post("/api/control", { data: { action: "clear_players" } });
  await request.post("/api/control", { data: { action: "resume" } });
});
test("six licensed humanoids complete both contact studies against real audio; front and side are inspectable", async ({
  page,
  request,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const old = await (await request.get("/api/music")).json();
  for (const t of old.tracks)
    await request.post("/api/music/delete", { data: { id: t.id } });
  const uploaded = await request.post(
    "/api/music/upload?filename=Review-calibration.wav",
    { headers: { "Content-Type": "audio/wav" }, data: recordedBeatWav(30) },
  );
  expect(uploaded.status()).toBe(201);
  const track = await uploaded.json();
  expect(
    (
      await request.post(`/api/music/tracks/${track.id}`, {
        data: {
          bpm: 120,
          dance: "halay",
          firstBeatSec: 0.15,
          beatsPerBar: 2,
          beatUnit: 4,
        },
      })
    ).ok(),
  ).toBe(true);
  await request.post("/api/music/library", {
    data: {
      playlists: [
        { id: "festival", name: "Review calibration", trackIds: [track.id] },
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
  await expect.poll(async () => (await read(page)).actors).toBe(6);
  await page
    .getByRole("button", { name: "Ses motorunu aç", exact: true })
    .click();
  // Unlocking owns the audio graph; an explicit play command starts file transport.
  expect(
    (
      await request.post("/api/music/transport", {
        data: { action: "play", trackId: track.id },
      })
    ).ok(),
  ).toBe(true);
  await expect.poll(async () => (await read(page)).playing).toBe(true);
  await page
    .getByRole("button", { name: "9:16 kayıt kadrajı", exact: true })
    .click();
  const samples: ReviewMetrics[] = [];
  // 12 seconds at 120 BPM covers both eight-beat studies and a measure-boundary blend.
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(500);
    samples.push(await read(page));
  }
  expect(new Set(samples.map((s) => s.figure)).size).toBe(2);
  expect(Math.max(...samples.map((s) => s.footDriftMeters))).toBeLessThan(
    0.025,
  );
  expect(Math.max(...samples.map((s) => s.palmGapMeters))).toBeLessThan(0.03);
  expect(samples.every((s) => s.approved === false)).toBe(true);
  await page.screenshot({ path: info.outputPath("review-front.png") });
  await page.keyboard.press("Escape");
  const download = page.waitForEvent("download", { timeout: 25000 });
  await page
    .getByRole("button", { name: "16 sn sesli kayıt", exact: true })
    .click();
  await (await download).saveAs(info.outputPath("review-cycle-av.webm"));
  expect((await read(page)).playing).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Yandan", exact: true }).click();
  await page
    .getByRole("button", { name: "9:16 kayıt kadrajı", exact: true })
    .click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: info.outputPath("review-side.png") });
  expect(errors).toEqual([]);
  await writeFile(
    info.outputPath("contact-samples.json"),
    JSON.stringify(
      { kind: "technical-contact-study-not-approved-halay", samples, errors },
      null,
      2,
    ),
  );
});
test("motion import requires integrity/provenance and retargets a self-contained test GLB without approving it", async ({
  page,
}) => {
  const { glb, manifest } = await motionFixture();
  await page.goto("/review.html");
  await expect(page.locator('canvas[data-asset-ready="true"]')).toBeVisible({
    timeout: 45000,
  });
  await page.getByLabel("Animasyon dosyası", { exact: true }).setInputFiles({
    name: "fixture.glb",
    mimeType: "model/gltf-binary",
    buffer: glb,
  });
  await page.getByLabel("Motion manifest", { exact: true }).setInputFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ ...manifest, sha256: "0".repeat(64) }),
    ),
  });
  await page
    .getByRole("button", { name: "Halay inceleme sekansına ekle", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("SHA-256 mismatch");
  await page.getByLabel("Motion manifest", { exact: true }).setInputFiles({
    name: "fixture.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(manifest)),
  });
  await page
    .getByRole("button", { name: "Halay inceleme sekansına ekle", exact: true })
    .click();
  await expect(page.locator("#notice")).toContainText(
    "İzin ve yöresel doğruluk kabulü açık",
  );
  await expect
    .poll(async () => (await read(page)).figure)
    .toContain("fixture_contact");
  expect((await read(page)).approved).toBe(false);
});
