import { test, expect } from "@playwright/test";

test("renders the real licensed character with working skin, textures, inspection angles and no dance fallback", async ({
  page,
}) => {
  const errors: string[] = [],
    rejectedAssets: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      /festival-dancer|humanoid\/(male|female)|calibration/.test(request.url())
    )
      rejectedAssets.push(request.url());
  });
  await page.goto("/character.html");
  await expect(
    page.getByRole("button", { name: "Önden", exact: true }),
  ).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByRole("status")).toContainText("GLB hazır");
  const canvas = page.locator("canvas");
  const first = Number(await canvas.getAttribute("data-frame"));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-frame")))
    .toBeGreaterThan(first + 3);
  for (const name of ["Yandan", "Yüz", "El", "Ayak", "Önden"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByLabel("İskelet", { exact: true }).check();
  await expect(page.getByLabel("İskelet", { exact: true })).toBeChecked();
  const metrics = await page.evaluate(() =>
    (
      window as unknown as {
        __halayCharacter: { metrics: () => Record<string, unknown> };
      }
    ).__halayCharacter.metrics(),
  );
  expect(metrics).toMatchObject({
    loaded: true,
    bones: 52,
    skinnedMeshes: 9,
    clips: 0,
    animationStatus: "no-licensed-halay-performance",
  });
  expect(metrics["triangles"]).toBeGreaterThan(50000);
  expect(errors).toEqual([]);
  expect(rejectedAssets).toEqual([]);
});

test("missing character is an explicit failure instead of a procedural substitute", async ({
  page,
}) => {
  await page.route("**/characters/production/wedding-guest-01.glb", (route) =>
    route.fulfill({ status: 404 }),
  );
  await page.goto("/character.html");
  await expect(page.getByRole("status")).toContainText("Karakter yüklenemedi");
  await expect(
    page.getByRole("button", { name: "Önden", exact: true }),
  ).toBeDisabled();
});
