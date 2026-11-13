import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { expect, it } from "vitest";
import {
  FIGURES,
  figureAt,
  formationFor,
} from "../../packages/halay-game/src/rigged-dancers.js";
import { advanceRound } from "../../packages/halay-game/src/round-time.js";
import { BeatClock } from "../../packages/halay-game/src/beat-clock.js";
it("keeps a joining seventh dancer in the circle and supports all 130 configured slots", () => {
  const seven = formationFor(7);
  expect(new Set(seven.map((s) => s.ring)).size).toBe(1);
  const full = formationFor(130);
  expect(full).toHaveLength(130);
  for (let i = 1; i < full.length; i++)
    if (full[i]!.ring === full[i - 1]!.ring) {
      const a = full[i]!,
        b = full[i - 1]!;
      const distance = Math.hypot(
        Math.cos(a.angle) * a.radius - Math.cos(b.angle) * b.radius,
        Math.sin(a.angle) * a.radius - Math.sin(b.angle) * b.radius,
      );
      expect(distance).toBeGreaterThan(1.4);
      expect(distance).toBeLessThan(1.75);
    }
});
it("advances the local twenty-minute timer by wall time even after slow/missing render frames", () => {
  expect(advanceRound(1200.4, 1, 20, true)).toEqual({
    period: 1200.4 % 1200,
    round: 2,
    stopped: false,
  });
  expect(advanceRound(3601, 1, 20, true)).toEqual({
    period: 1,
    round: 4,
    stopped: false,
  });
  expect(advanceRound(1201, 1, 20, false)).toEqual({
    period: 1200,
    round: 1,
    stopped: true,
  });
});

it("loads the shipped GLB as a weighted skeleton and evaluates distinct joint animation", async () => {
  const file = await readFile(
    "apps/broadcaster/public/characters/festival-dancer.glb",
  );
  const manifest = JSON.parse(
    await readFile(
      "apps/broadcaster/public/characters/festival-dancer.manifest.json",
      "utf8",
    ),
  ) as { sha256: string; generatorSha256: string };
  expect(createHash("sha256").update(file).digest("hex")).toBe(manifest.sha256);
  expect(
    createHash("sha256")
      .update(await readFile("scripts/create-character.ts"))
      .digest("hex"),
  ).toBe(manifest.generatorSha256);
  const gltf = await new GLTFLoader().parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    "",
  );
  const skins: T.SkinnedMesh[] = [];
  gltf.scene.traverse((o) => {
    if (o instanceof T.SkinnedMesh) skins.push(o);
  });
  expect(skins).toHaveLength(1);
  const mesh = skins[0]!;
  gltf.scene.position.y = formationFor(6)[0]!.y;
  gltf.scene.updateMatrixWorld(true);
  expect(new T.Box3().setFromObject(gltf.scene).min.y).toBeGreaterThan(0.22);
  expect(mesh.skeleton.bones).toHaveLength(17);
  expect(mesh.geometry.getAttribute("skinWeight").count).toBe(
    mesh.geometry.getAttribute("position").count,
  );
  expect(gltf.animations.map((c) => c.name)).toEqual(
    Object.values(FIGURES).flat(),
  );
  const bone = mesh.skeleton.bones.find((b) => b.name === "Thigh_L")!;
  const mixer = new T.AnimationMixer(gltf.scene);
  const halay = mixer.clipAction(gltf.animations[0]!).play();
  halay.paused = true;
  halay.time = 0.25;
  mixer.update(0);
  const before = bone.quaternion.clone();
  halay.time = 0.65;
  mixer.update(0);
  expect(before.angleTo(bone.quaternion)).toBeGreaterThan(0.05);
  halay.stop();
  const horon = mixer.clipAction(gltf.animations[3]!).play();
  horon.paused = true;
  horon.time = 0.25;
  mixer.update(0);
  expect(before.angleTo(bone.quaternion)).toBeGreaterThan(0.02);
  expect(mesh.geometry.getAttribute("position").count / 3).toBeLessThan(8000);
});
it("changes figures only after four whole measures and gives new players the current shared phase", () => {
  const clock = new BeatClock();
  clock.anchor(0, 0, true);
  expect(figureAt(clock.frame(3.999))).toBe("halay_ThreeStep");
  expect(figureAt(clock.frame(4))).toBe("halay_HeelTap");
  const joiningClock = new BeatClock();
  joiningClock.anchor(4.25, 4.25, true);
  expect(joiningClock.frame(4.5)).toEqual(clock.frame(4.5));
});
