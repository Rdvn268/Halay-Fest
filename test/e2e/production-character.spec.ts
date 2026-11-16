import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Synthetic loader/clock regression fixture, NEVER a claimed dance performance.
async function syntheticInspectionClip() {
  const bytes = await readFile(
    "apps/broadcaster/public/characters/production/wedding-guest-01.glb",
  );
  const jsonSize = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString()) as {
    nodes: { name?: string; rotation?: number[]; translation?: number[] }[];
    buffers: { byteLength: number }[];
    bufferViews: unknown[];
    accessors: unknown[];
    animations?: unknown[];
  };
  const bin = bytes.subarray(28 + jsonSize);
  const hip = doc.nodes.findIndex((n) => n.name === "mixamorig:Hips");
  if (hip < 0) throw new Error("Missing test fixture hips");
  const rotation = doc.nodes[hip]!.rotation ?? [0, 0, 0, 1];
  const translation = doc.nodes[hip]!.translation ?? [0, 0, 0];
  const moved = [...translation];
  moved[0] = moved[0]! + 3;
  const values = Buffer.alloc(64);
  [0, 4, ...rotation, ...rotation, ...translation, ...moved].forEach((v, i) =>
    values.writeFloatLE(v, i * 4),
  );
  const view = doc.bufferViews.length,
    accessor = doc.accessors.length;
  doc.bufferViews.push(
    { buffer: 0, byteOffset: bin.length, byteLength: 8 },
    { buffer: 0, byteOffset: bin.length + 8, byteLength: 32 },
    { buffer: 0, byteOffset: bin.length + 40, byteLength: 24 },
  );
  doc.accessors.push(
    {
      bufferView: view,
      componentType: 5126,
      count: 2,
      type: "SCALAR",
      min: [0],
      max: [4],
    },
    { bufferView: view + 1, componentType: 5126, count: 2, type: "VEC4" },
    { bufferView: view + 2, componentType: 5126, count: 2, type: "VEC3" },
  );
  doc.buffers[0]!.byteLength = bin.length + values.length;
  doc.animations = [
    {
      name: "SYNTHETIC_TEST_ONLY",
      samplers: [
        { input: accessor, output: accessor + 1, interpolation: "LINEAR" },
        { input: accessor, output: accessor + 2, interpolation: "LINEAR" },
      ],
      channels: [
        { sampler: 0, target: { node: hip, path: "rotation" } },
        { sampler: 1, target: { node: hip, path: "translation" } },
      ],
    },
  ];
  const raw = Buffer.from(JSON.stringify(doc)),
    padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 0x20);
  raw.copy(padded);
  const header = Buffer.alloc(20),
    binaryHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + padded.length + 8 + bin.length + values.length, 8);
  header.writeUInt32LE(padded.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  binaryHeader.writeUInt32LE(bin.length + values.length);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, padded, binaryHeader, bin, values]);
}

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

test("local motion import, seek, pause and invalid replacement preserve the 52 bone viewer", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/character.html");
  await page.locator("summary").click();
  await expect(page.locator("#local-motion")).toBeEnabled({ timeout: 30000 });
  await page.locator("#local-motion").setInputFiles({
    name: "synthetic-test-only.glb",
    mimeType: "model/gltf-binary",
    buffer: await syntheticInspectionClip(),
  });
  await expect(page.locator("#motion-status")).toContainText("4.00 sn");
  await page.locator("#motion-time").fill("2");
  const time = () =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __halayCharacter: { metrics: () => { motionTime: number } };
          }
        ).__halayCharacter.metrics().motionTime,
    );
  await expect.poll(time).toBe(2);
  // Translated bones must not disappear behind stale bind-pose mesh bounds.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __halayCharacter: { metrics: () => { triangles: number } };
            }
          ).__halayCharacter.metrics().triangles,
      ),
    )
    .toBeGreaterThan(100000);
  await page.getByRole("button", { name: "Oynat", exact: true }).click();
  await expect.poll(time).toBeGreaterThan(2.1);
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  const paused = await time();
  await page.waitForTimeout(200);
  expect(await time()).toBe(paused);
  await page.locator("#motion-time").fill("0");
  await expect.poll(time).toBe(0);
  // Silent PCM is only a deterministic clock fixture, not music evidence.
  const wave = Buffer.alloc(44 + 32000);
  wave.write("RIFF");
  wave.writeUInt32LE(wave.length - 8, 4);
  wave.write("WAVEfmt ", 8);
  wave.writeUInt32LE(16, 16);
  wave.writeUInt16LE(1, 20);
  wave.writeUInt16LE(1, 22);
  wave.writeUInt32LE(8000, 24);
  wave.writeUInt32LE(16000, 28);
  wave.writeUInt16LE(2, 32);
  wave.writeUInt16LE(16, 34);
  wave.write("data", 36);
  wave.writeUInt32LE(32000, 40);
  await page.locator("#local-audio").setInputFiles({
    name: "silent-clock-test.wav",
    mimeType: "audio/wav",
    buffer: wave,
  });
  await page.getByRole("button", { name: "Oynat", exact: true }).click();
  await expect.poll(time).toBeGreaterThan(0.2);
  // Force media discontinuity: a wall-clock accumulator would stay near .2 s.
  await page.locator("#reference-audio").evaluate((element) => {
    (element as HTMLAudioElement).currentTime = 1.25;
  });
  await expect.poll(time).toBeGreaterThan(1.2);
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  const difference = await page.evaluate(() => {
    const motion = (
      window as unknown as {
        __halayCharacter: { metrics: () => { motionTime: number } };
      }
    ).__halayCharacter.metrics().motionTime;
    return Math.abs(
      document.querySelector<HTMLAudioElement>("#reference-audio")!
        .currentTime - motion,
    );
  });
  // Assert the paused media/pose clock, not a hardware-dependent live frame lag.
  expect(difference).toBeLessThan(0.001);
  const mediaPaused = await time();
  await page.waitForTimeout(200);
  expect(await time()).toBe(mediaPaused);
  await page.locator("#local-motion").setInputFiles({
    name: "bad.glb",
    mimeType: "model/gltf-binary",
    buffer: Buffer.from("invalid"),
  });
  await expect(page.locator("#motion-status")).toContainText("Klip reddedildi");
  await expect(page.locator("#motion-play")).toBeEnabled();
  expect(errors).toEqual([]);
});

test("loads the real 4.63 second contact cleanup in the existing viewer", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/character.html");
  await expect(page.locator("#local-motion")).toBeEnabled({ timeout: 30000 });
  await page.locator("summary").click();
  await page
    .locator("#local-motion")
    .setInputFiles(
      resolve(
        "assets/animation-studies/deli-horon-cleanup/wedding-guest-01-cleaned.glb",
      ),
    );
  await expect(page.locator("#motion-status")).toContainText("4.63 sn");
  await page.getByRole("button", { name: "Oynat", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              __halayCharacter: { metrics: () => { motionTime: number } };
            }
          ).__halayCharacter.metrics().motionTime,
      ),
    )
    .toBeGreaterThan(0.3);
  await page.getByRole("button", { name: "Duraklat", exact: true }).click();
  await page.locator("#motion-time").fill("4.6");
  for (const angle of ["Yandan", "Yüz", "El", "Ayak", "Önden"]) {
    await page.getByRole("button", { name: angle, exact: true }).click();
    await expect(
      page.getByRole("button", { name: angle, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  const metrics = await page.evaluate(() =>
    (
      window as unknown as {
        __halayCharacter: { metrics: () => Record<string, unknown> };
      }
    ).__halayCharacter.metrics(),
  );
  expect(metrics).toMatchObject({
    bones: 52,
    skinnedMeshes: 9,
    clips: 1,
    animationStatus: "local-unvalidated-motion-study",
  });
  expect(errors).toEqual([]);
});
