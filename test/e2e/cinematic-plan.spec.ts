import { test, expect } from "@playwright/test";

test("preproduction cannot present drafts as a finished scene or load rejected assets", async ({
  page,
}) => {
  const assets: string[] = [];
  page.on("request", (request) => {
    if (/\.(?:glb|fbx|mp3|ogg|wav)(?:\?|$)/i.test(request.url()))
      assets.push(request.url());
  });
  await page.goto("/cinematic.html");
  await expect(
    page.getByRole("heading", { name: /Önce gerçek insanlar/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Üretim sahnesi hazır değil · sanatsal kabul açık"),
  ).toBeVisible();
  await expect(page.locator("article")).toHaveCount(8);
  await page.getByLabel("Dans araştırması").selectOption("kolbasti");
  await expect(page.locator("article")).toHaveCount(2);
  await expect(page.locator("article").first()).toContainText("Kadın icracı");
  await page.locator("#time").fill("18");
  await expect(page.locator("#shot")).toContainText("Başçeken");
  await page.locator("#time").fill("45");
  await expect(page.locator("#shot")).toContainText("Önden");
  await page.getByText("45 saniye / ölçü uyumunu kontrol et").click();
  await expect(page.locator("#grid-result")).toContainText("tam ölçü: hayır");
  await page.locator("#bpm").fill("128");
  await expect(page.locator("#grid-result")).toContainText("tam ölçü: evet");
  await expect(page.locator("#grid-result")).toContainText(
    "Ses ve hareket dikişi doğrulanmadı",
  );
  await page.locator("#bar").fill("0");
  await expect(page.locator("#grid-result")).toContainText("Geçerli bir BPM");
  await expect(page.locator("canvas, video, audio")).toHaveCount(0);
  expect(assets).toEqual([]);
});

test("preparation remains usable at mobile width without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cinematic.html");
  await page.getByLabel("Dans araştırması").selectOption("pop");
  await expect(page.locator("article")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
