import { test, expect } from "@playwright/test";
import { openPanel } from "../helpers/panel.js";
import { recordedBeatWav } from "../helpers/audio.js";
import type { MusicTrack, MusicLibrary } from "@halay/contracts";

test("section navigation is addressable, keeps game drafts and exposes the actual connection capability", async ({
  page,
}, info) => {
  await page.goto("/#overview");
  await expect(page.getByTestId("connection")).toHaveText("Bağlı");
  await page.screenshot({
    path: info.outputPath("studio-overview.png"),
    fullPage: true,
  });
  await openPanel(page, "Oyun");
  await page.getByLabel("NPC sayısı", { exact: true }).fill("7");
  await openPanel(page, "Müzik");
  await expect(
    page.getByRole("region", { name: "Müzik Yöneticisi" }),
  ).toBeVisible();
  await openPanel(page, "Oyun");
  await expect(page.getByLabel("NPC sayısı", { exact: true })).toHaveValue("7");
  await expect(page).toHaveURL(/#game$/);
  await openPanel(page, "Bağlantı");
  await expect(
    page
      .getByText("Gerçek TikTok bağlantısı bu sürümde desteklenmiyor.", {
        exact: false,
      })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bağlan", exact: true }),
  ).toHaveCount(0);
  await openPanel(page, "Yayın ekranı");
  const link = page.getByRole("link", {
    name: "9:16 sahneyi aç ↗",
    exact: true,
  });
  await expect(link).toHaveAttribute("href", /\?broadcast=1$/);
  await expect(link).toHaveAttribute("target", "_blank");
});

test("music drafts survive section changes and direct hash reload opens the music view", async ({
  page,
  request,
}, info) => {
  const library = (await (
    await request.get("/api/music")
  ).json()) as MusicLibrary;
  for (const track of library.tracks)
    await request.post("/api/music/delete", { data: { id: track.id } });
  const response = await request.post(
    "/api/music/upload?filename=Studio-preview.wav",
    { headers: { "Content-Type": "audio/wav" }, data: recordedBeatWav(16) },
  );
  expect(response.status()).toBe(201);
  const track = (await response.json()) as MusicTrack;
  await page.goto("/#music");
  await expect(page.getByLabel("Parça adı", { exact: true })).toHaveValue(
    track.title,
  );
  await page
    .getByLabel("Parça adı", { exact: true })
    .fill("Kaydedilmemiş prova");
  await openPanel(page, "Oyun");
  await expect(
    page.getByRole("region", { name: "Müzik Yöneticisi" }),
  ).toBeHidden();
  await openPanel(page, "Müzik");
  await expect(page.getByLabel("Parça adı", { exact: true })).toHaveValue(
    "Kaydedilmemiş prova",
  );
  await page
    .getByRole("button", { name: "Parça ayarlarını kaydet", exact: true })
    .click();
  await expect(page.getByTestId("music-notice")).toContainText("metadata");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Müzik", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Parça adı", { exact: true })).toHaveValue(
    "Kaydedilmemiş prova",
  );
  await page.screenshot({
    path: info.outputPath("studio-music.png"),
    fullPage: true,
  });
});

test("mobile navigation and controls fit a 390px viewport", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#overview");
  await expect(page.getByTestId("connection")).toHaveText("Bağlı");
  for (const pane of [
    "Genel bakış",
    "Oyun",
    "Müzik",
    "Test Paneli",
    "Nasıl kullanılır",
  ] as const) {
    await openPanel(page, pane);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  }
  await openPanel(page, "Müzik");
  await page.screenshot({
    path: info.outputPath("studio-mobile.png"),
    fullPage: true,
  });
  const nav = page
    .getByRole("navigation", { name: "Yayıncı kontrolleri" })
    .getByRole("button", { name: /^Müzik/ });
  await expect(nav).toHaveAttribute("aria-current", "page");
  await nav.focus();
  await expect(nav).toBeFocused();
});
