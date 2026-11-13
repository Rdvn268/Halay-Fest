import { expect, test } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { defaultSettings } from "@halay/contracts";
import type {
  MusicLibrary,
  MusicTelemetry,
  MusicTrack,
} from "@halay/contracts";
import { recordedBeatWav } from "../helpers/audio.js";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";

const sceneUrl = `http://127.0.0.1:${process.env["TEST_PRODUCTION"] === "1" ? 4174 : 5173}`;
async function library(request: APIRequestContext) {
  return (await (await request.get("/api/music")).json()) as MusicLibrary;
}
async function telemetry(request: APIRequestContext) {
  return (await (
    await request.get("/api/music/telemetry")
  ).json()) as MusicTelemetry | null;
}
test.beforeEach(async ({ request, page }) => {
  for (const track of (await library(request)).tracks)
    expect(
      (
        await request.post("/api/music/delete", { data: { id: track.id } })
      ).ok(),
    ).toBe(true);
  await request.post("/api/control", { data: { action: "clear_players" } });
  await request.post("/api/control", { data: { action: "resume" } });
  await request.post("/api/settings", {
    data: { ...defaultSettings, autoCamera: false, randomEvents: false },
  });
  await request.post("/api/music/library", {
    data: {
      playlists: [{ id: "festival", name: "Şenlik listesi", trackIds: [] }],
      activePlaylistId: "festival",
      repeat: true,
      autoplay: true,
    },
  });
  await page.goto("/");
  await expect(page.getByTestId("connection")).toHaveText("Bağlı");
});

test("uploads and really decodes WAV/MP3/OGG, edits playlists, persists metadata and shows storage failures", async ({
  page,
  context,
  request,
}, info) => {
  test.setTimeout(100_000);
  const manager = page.getByRole("region", { name: "Müzik Yöneticisi" });
  await manager
    .getByLabel("Müzik dosyası ekle", { exact: true })
    .setInputFiles([
      {
        name: "Original WAV.wav",
        mimeType: "audio/wav",
        buffer: recordedBeatWav(24),
      },
      {
        name: "calibration.mp3",
        mimeType: "audio/mpeg",
        buffer: await readFile(resolve("test/fixtures/audio/calibration.mp3")),
      },
      {
        name: "calibration.ogg",
        mimeType: "audio/ogg",
        buffer: await readFile(resolve("test/fixtures/audio/calibration.ogg")),
      },
    ]);
  await expect(manager.getByTestId("music-notice")).toHaveText(
    "Müzik dosyaları yerel kütüphaneye kaydedildi.",
  );
  expect((await library(request)).tracks).toHaveLength(3);
  await manager.getByLabel("Yeni liste adı").fill("Gece listesi");
  await manager
    .getByRole("button", { name: "Liste oluştur", exact: true })
    .click();
  await expect(manager.getByTestId("music-notice")).toContainText(
    "oluşturuldu",
  );
  const items = manager
    .getByRole("list", { name: "Müzik kütüphanesi" })
    .getByRole("listitem");
  for (let i = 0; i < 3; i++) {
    await items
      .nth(i)
      .getByRole("button", { name: "Listeye ekle", exact: true })
      .click();
    await expect(manager.getByTestId("music-notice")).toHaveText(
      "Parça listeye eklendi.",
    );
  }
  await manager
    .getByRole("button", { name: "Aşağı Original WAV", exact: true })
    .click();
  await expect(manager.getByTestId("music-notice")).toHaveText(
    "Liste sırası kaydedildi.",
  );
  let state = await library(request);
  const active = state.playlists.find((p) => p.id === state.activePlaylistId)!;
  expect(active.trackIds[1]).toBe(state.tracks[0]!.id);
  await manager.getByLabel("Parça dans türü").selectOption("horon");
  await manager.getByLabel("Manuel BPM").fill("108");
  await manager.getByLabel("İlk vuruş", { exact: true }).fill(".15");
  await manager.getByLabel("Ritim kalibrasyonu").fill("25");
  await manager
    .getByRole("button", { name: "Parça ayarlarını kaydet", exact: true })
    .click();
  await expect(manager.getByTestId("music-notice")).toContainText("metadata");
  await page.reload();
  await expect(manager.getByLabel("Etkin liste")).toHaveValue(active.id);
  await expect(manager.getByLabel("Manuel BPM")).toHaveValue("108");
  await expect(manager.getByLabel("Parça dans türü")).toHaveValue("horon");
  const scene = await context.newPage();
  const errors: string[] = [];
  scene.on("pageerror", (e) => errors.push(e.message));
  await scene.goto(sceneUrl);
  await expect(scene.locator("canvas")).toHaveAttribute(
    "data-asset-ready",
    "true",
  );
  await scene
    .getByRole("button", { name: "Ses motorunu aç", exact: true })
    .click();
  state = await library(request);
  for (const track of state.tracks) {
    expect(
      (
        await request.post("/api/music/transport", {
          data: { action: "play", trackId: track.id },
        })
      ).ok(),
    ).toBe(true);
    await expect
      .poll(
        async () => {
          const t = await telemetry(request);
          return t?.trackId === track.id && t.playing && t.mediaSeconds > 0.1;
        },
        { timeout: 20_000 },
      )
      .toBe(true);
  }
  await request.post("/api/music/transport", { data: { action: "pause" } });
  await expect
    .poll(async () => (await telemetry(request))?.playing)
    .toBe(false);
  await manager.getByLabel("Parçada konum").fill("1");
  await manager
    .getByRole("button", { name: "Konuma git", exact: true })
    .click();
  await expect
    .poll(async () => (await telemetry(request))?.mediaSeconds ?? 0)
    .toBeGreaterThan(0.9);
  await manager.getByLabel("Müzik ses seviyesi", { exact: true }).focus();
  await manager.getByLabel("Müzik ses seviyesi", { exact: true }).press("Home");
  await manager
    .getByRole("button", { name: "Ses düzeyini uygula", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (
          (await (await request.get("/api/state")).json()) as {
            settings: { musicVolume: number };
          }
        ).settings.musicVolume,
    )
    .toBe(0);
  await page.route("**/api/music/upload*", (route) =>
    route.fulfill({
      status: 507,
      contentType: "application/json",
      body: JSON.stringify({ error: "Test disk dolu" }),
    }),
  );
  await manager
    .getByLabel("Müzik dosyası ekle", { exact: true })
    .setInputFiles({
      name: "No space.wav",
      mimeType: "audio/wav",
      buffer: recordedBeatWav(),
    });
  await expect(manager.getByTestId("music-error")).toHaveText("Test disk dolu");
  expect((await library(request)).tracks).toHaveLength(3);
  await page.screenshot({
    path: info.outputPath("music-manager.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("estimates BPM from streamed decoded audio while dance stays administrator-selected", async ({
  page,
  context,
  request,
}, info) => {
  test.setTimeout(65_000);
  const track = (await (
    await request.post("/api/music/upload?filename=Original-108.wav", {
      headers: { "Content-Type": "audio/wav" },
      data: recordedBeatWav(32, 108, 0.15),
    })
  ).json()) as MusicTrack;
  await request.post(`/api/music/tracks/${track.id}`, {
    data: { dance: "govend", beatsPerBar: 4, beatUnit: 4 },
  });
  const scene = await context.newPage();
  const errors: string[] = [];
  scene.on("pageerror", (e) => errors.push(e.message));
  await scene.addInitScript(() => {
    AudioContext.prototype.createOscillator = () => {
      throw new Error("File playback must not synthesize replacement music");
    };
  });
  await scene.goto(sceneUrl);
  await expect(scene.locator("canvas")).toHaveAttribute(
    "data-asset-ready",
    "true",
  );
  await scene
    .getByRole("button", { name: "Ses motorunu aç", exact: true })
    .click();
  await request.post("/api/music/transport", {
    data: { action: "play", trackId: track.id },
  });
  await expect
    .poll(async () => (await library(request)).tracks[0]?.bpmSource, {
      timeout: 35_000,
    })
    .toBe("analysis");
  const analyzed = (await library(request)).tracks[0]!;
  expect(analyzed.bpm).toBeGreaterThanOrEqual(107);
  expect(analyzed.bpm).toBeLessThanOrEqual(109);
  expect(analyzed.dance).toBe("govend");
  expect(analyzed.analysis?.confidence).toBeGreaterThanOrEqual(0.65);
  await expect(page.getByTestId("rhythm-analysis")).toContainText("108 BPM");
  await expect(scene.locator("canvas")).toHaveAttribute(
    "data-clip",
    /^govend_/,
  );
  await request.post(`/api/music/tracks/${track.id}`, {
    data: {
      dance: "zeybek",
      beatsPerBar: 9,
      beatUnit: 8,
      bpm: 108,
      bpmSource: "manual",
    },
  });
  await expect(scene.locator("canvas")).toHaveAttribute(
    "data-clip",
    /^zeybek_/,
  );
  await scene.screenshot({
    path: info.outputPath("zeybek-study.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("audio owns beat-clock, auto-advances, uses different rig figures and keeps playing after panel closes", async ({
  page,
  context,
  request,
}, info) => {
  test.setTimeout(85_000);
  const first = (await (
    await request.post("/api/music/upload?filename=Halay.wav", {
      headers: { "Content-Type": "audio/wav" },
      data: recordedBeatWav(8),
    })
  ).json()) as MusicTrack;
  const second = (await (
    await request.post("/api/music/upload?filename=Horon.wav", {
      headers: { "Content-Type": "audio/wav" },
      data: recordedBeatWav(35),
    })
  ).json()) as MusicTrack;
  await request.post(`/api/music/tracks/${first.id}`, {
    data: { bpm: 120, bpmSource: "manual", firstBeatSec: 0.15 },
  });
  await request.post(`/api/music/tracks/${second.id}`, {
    data: {
      bpm: 120,
      bpmSource: "manual",
      firstBeatSec: 0.15,
      dance: "horon",
      beatsPerBar: 7,
      beatUnit: 8,
    },
  });
  const scene = await context.newPage();
  await scene.goto(sceneUrl);
  await expect(scene.locator("canvas")).toHaveAttribute("data-rigs", "6");
  await scene
    .getByRole("button", { name: "Ses motorunu aç", exact: true })
    .click();
  await request.post("/api/music/transport", {
    data: { action: "play", trackId: first.id },
  });
  await expect
    .poll(async () => {
      const t = await telemetry(request);
      return (
        t?.trackId === first.id && t.playing && t.clip.startsWith("halay_")
      );
    })
    .toBe(true);
  await request.post("/api/mock", {
    data: {
      type: "chat",
      userId: "phase2-join",
      displayName: "Dansçı",
      message: "katıl",
    },
  });
  await expect(scene.locator("canvas")).toHaveAttribute("data-rigs", "7");
  await page.close();
  await expect
    .poll(
      async () => {
        const t = await telemetry(request);
        return (
          t?.trackId === second.id && t.playing && t.clip.startsWith("horon_")
        );
      },
      { timeout: 20_000 },
    )
    .toBe(true);
  await expect
    .poll(async () => (await telemetry(request))?.onsetSamples ?? 0, {
      timeout: 18_000,
    })
    .toBeGreaterThan(8);
  const measured = (await telemetry(request))!;
  expect(measured.driftP95Ms).toBeLessThan(100);
  expect(measured.onsetErrorP95Ms).not.toBeNull();
  expect(measured.onsetErrorP95Ms!).toBeLessThan(120);
  expect(measured.rigs).toBe(7);
  expect(measured.error).toBeNull();
  await scene.screenshot({
    path: info.outputPath("horon-rigs.png"),
    fullPage: true,
  });
  await request.post("/api/music/transport", { data: { action: "next" } });
  await expect
    .poll(async () => (await telemetry(request))?.trackId)
    .toBe(first.id);
});
