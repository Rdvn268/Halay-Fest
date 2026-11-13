import { expect, test } from "@playwright/test";
import { defaultSettings } from "@halay/contracts";

const sceneUrl = `http://127.0.0.1:${process.env["TEST_PRODUCTION"] === "1" ? 4174 : 5173}`;
test.beforeEach(async ({ page, request }) => {
  await request.post("/api/control", { data: { action: "clear_players" } });
  await request.post("/api/control", { data: { action: "resume" } });
  await request.post("/api/settings", { data: defaultSettings });
  await page.goto("/");
  await expect(page.getByTestId("connection")).toHaveText("Bağlı");
});

test("React panel routes mock joins/gifts to independent Three.js; closing panel keeps rendering", async ({
  page,
  context,
}, testInfo) => {
  const scene = await context.newPage();
  const errors: string[] = [];
  scene.on("pageerror", (error) => errors.push(error.message));
  await scene.goto(sceneUrl);
  await expect(scene.locator("#connection")).toContainText(
    "Yerel servis bağlı",
  );
  await expect(scene.locator("#scene canvas")).toBeVisible();
  await page.getByLabel("Demo kullanıcı ID").fill("phase1-stable-user");
  await page.getByLabel("Görünen ad").fill("şenlik_izleyicisi");
  await page
    .getByRole("button", { name: "💬 Yorum gönder", exact: true })
    .click();
  await expect(scene.locator("#scene canvas")).toHaveAttribute(
    "data-player-count",
    "1",
  );
  await expect(page.getByTestId("players")).toHaveText("1 / 100");
  await page
    .getByRole("button", { name: "👤 Mock takip", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Mock olay yerel servise kaydedildi.",
  );
  await expect(scene.locator("#players")).toHaveText("1");
  await page.getByRole("button", { name: "🌹 Gül", exact: true }).click();
  await expect(scene.locator("#banner")).toContainText("gift · rose");
  await page.screenshot({
    path: testInfo.outputPath("phase1-panel.png"),
    fullPage: true,
  });
  await scene.screenshot({
    path: testInfo.outputPath("phase1-scene.png"),
    fullPage: true,
  });
  const frame = Number(
    await scene.locator("canvas").getAttribute("data-frame"),
  );
  const clock = await scene.locator("#clock").textContent();
  await page.close();
  await expect
    .poll(async () =>
      Number(await scene.locator("canvas").getAttribute("data-frame")),
    )
    .toBeGreaterThan(frame + 3);
  await expect(scene.locator("#clock")).not.toHaveText(clock!, {
    timeout: 20_000,
  });
  expect(errors).toEqual([]);
});

test("saved music/volume settings reach the scene, native audio and panel controls work", async ({
  page,
  context,
}, testInfo) => {
  const scene = await context.newPage();
  await scene.addInitScript(() => {
    const Native = AudioContext;
    const contexts: AudioContext[] = [];
    Object.assign(window, { __phase1Contexts: contexts });
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    };
  });
  await scene.goto(sceneUrl);
  await expect(scene.locator("#connection")).toContainText(
    "Yerel servis bağlı",
  );
  await page.getByLabel("Dans ve müzik", { exact: true }).selectOption("horon");
  await page
    .getByRole("button", { name: "Ayarları kaydet", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Ayarlar SQLite’a kaydedildi.",
  );
  await expect(scene.locator("#dance")).toHaveText("Horon · 7/8");
  await scene
    .getByRole("button", { name: "Müziği başlat", exact: true })
    .click();
  await expect(
    scene.getByRole("button", { name: "Müziği durdur", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      scene.evaluate(
        () =>
          (window as unknown as { __phase1Contexts: AudioContext[] })
            .__phase1Contexts[0]?.state,
      ),
    )
    .toBe("running");
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  await expect(scene.locator("#state")).toHaveText("Duraklatıldı");
  await expect
    .poll(() =>
      scene.evaluate(
        () =>
          (window as unknown as { __phase1Contexts: AudioContext[] })
            .__phase1Contexts[0]?.state,
      ),
    )
    .toBe("suspended");
  await page.getByRole("button", { name: "Devam et", exact: true }).click();
  await expect(scene.locator("#state")).toHaveText("Oyun çalışıyor");
  const previousRound = Number(
    (await scene.locator("#round").textContent())!.split("#")[1],
  );
  await page.getByRole("button", { name: "Yeni döngü", exact: true }).click();
  await expect(scene.locator("#round")).toHaveText(
    `Döngü #${previousRound + 1}`,
  );
  await page.reload();
  await expect(page.getByLabel("Dans ve müzik", { exact: true })).toHaveValue(
    "horon",
  );
  await scene.screenshot({
    path: testInfo.outputPath("phase1-horon.png"),
    fullPage: true,
  });
  await scene
    .getByRole("button", { name: "Müziği durdur", exact: true })
    .click();
  await expect
    .poll(() =>
      scene.evaluate(
        () =>
          (window as unknown as { __phase1Contexts: AudioContext[] })
            .__phase1Contexts[0]?.state,
      ),
    )
    .toBe("suspended");
  await page
    .getByRole("button", { name: "Varsayılanları yükle", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ayarları kaydet", exact: true })
    .click();
  await expect(scene.locator("#dance")).toHaveText("Halay · 2/4");
});

test("a refused settings update is visible and does not show false saved state", async ({
  page,
}) => {
  await page.route("**/api/settings", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Test kayıt hatası" }),
    }),
  );
  await page.getByLabel("NPC sayısı", { exact: true }).fill("7");
  await page
    .getByRole("button", { name: "Ayarları kaydet", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveText("Test kayıt hatası");
  await expect(page.getByRole("status")).not.toContainText("kaydedildi");
});

test("scene keeps rendering during a socket outage and reconnects with the latest snapshot", async ({
  context,
  request,
}) => {
  await request.post("/api/mock", {
    data: {
      type: "chat",
      userId: "reconnect-user",
      displayName: "Bağlantı testi",
      message: "katıl",
    },
  });
  const scene = await context.newPage();
  let block = false;
  let disconnect: (() => Promise<void>) | undefined;
  await scene.routeWebSocket("**/ws", (route) => {
    if (block) {
      void route.close({ code: 1000, reason: "Test outage" });
      return;
    }
    const server = route.connectToServer();
    disconnect = async () => {
      await route.close({ code: 1000, reason: "Test reconnect" });
      await server.close({ code: 1000, reason: "Test reconnect" });
    };
  });
  await scene.goto(sceneUrl);
  await expect(scene.locator("#connection")).toContainText(
    "Yerel servis bağlı",
  );
  await expect(scene.locator("#scene canvas")).toHaveAttribute(
    "data-player-count",
    "1",
  );
  const frame = Number(
    await scene.locator("canvas").getAttribute("data-frame"),
  );
  block = true;
  await disconnect!();
  await expect(scene.locator("#connection")).toContainText(
    "bağlantısı kesildi",
  );
  await expect
    .poll(async () =>
      Number(await scene.locator("canvas").getAttribute("data-frame")),
    )
    .toBeGreaterThan(frame + 3);
  block = false;
  await expect(scene.locator("#connection")).toContainText(
    "Yerel servis bağlı",
    { timeout: 10_000 },
  );
  await expect(scene.locator("#scene canvas")).toHaveAttribute(
    "data-player-count",
    "1",
  );
});
