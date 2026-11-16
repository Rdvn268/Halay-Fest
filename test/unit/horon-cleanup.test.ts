import { beforeAll, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import * as T from "three";
import {
  loadMotionGeometry,
  measureMotion,
} from "../../scripts/audit-horon-motion.js";

const folder = "assets/animation-studies/deli-horon-cleanup";
let measurement: Awaited<ReturnType<typeof measureMotion>>;
beforeAll(async () => {
  const spec = JSON.parse(
    await readFile(`${folder}/quality-report.json`, "utf8"),
  );
  measurement = await measureMotion(
    `${folder}/wedding-guest-01-cleaned.glb`,
    spec,
  );
});

it("keeps the existing anatomical character and a single 4-8 second review clip", async () => {
  expect(measurement).toMatchObject({
    bones: 52,
    skinnedMeshes: 9,
    clips: 1,
    clipValid: true,
    samplingHz: 120,
  });
  expect(measurement.clipDuration).toBeGreaterThanOrEqual(4);
  expect(measurement.clipDuration).toBeLessThanOrEqual(8);
  const original = await loadMotionGeometry(
    "apps/broadcaster/public/characters/production/wedding-guest-01.glb",
  );
  const cleaned = await loadMotionGeometry(
    `${folder}/wedding-guest-01-cleaned.glb`,
  );
  const bounds = (scene: T.Object3D) => {
    const result: Record<string, number[]> = {};
    scene.traverse((o) => {
      if (o instanceof T.SkinnedMesh) {
        o.geometry.computeBoundingBox();
        const box = o.geometry.boundingBox!;
        result[o.name] = [...box.min.toArray(), ...box.max.toArray()];
      }
    });
    return result;
  };
  const a = bounds(original.scene),
    b = bounds(cleaned.scene);
  expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
  for (const name of Object.keys(a))
    for (let i = 0; i < 6; i++)
      expect(b[name]![i]).toBeCloseTo(a[name]![i]!, 5);
});

it("keeps the exported sole above ground and the marked forefoot locked between keys", () => {
  // This checks the actual exported skin, not the Blender solver's own counters.
  // The supplied visual support labels remain estimates, not force-plate truth.
  expect(measurement.evaluatedFrames).toBeGreaterThan(550);
  expect(measurement.minimumSoleHeightMetres).toBeGreaterThan(-0.001);
  expect(measurement.maximumRightContactSoleHeightMetres).toBeLessThan(0.003);
  expect(measurement.maximumRightContactHorizontalDriftMetres).toBeLessThan(
    0.002,
  );
  expect(measurement.rootJumpsOver40mmPerFrame).toEqual([]);
});

it("matches loop position, orientation and incoming/outgoing velocity in the actual rig", () => {
  expect(measurement.loopMaximumBonePositionGapMetres).toBeLessThan(0.0001);
  expect(measurement.loopMaximumBoneAngleGapRadians).toBeLessThan(0.002);
  expect(measurement.loopMaximumBoneVelocityGapMetresPerSecond).toBeLessThan(
    0.02,
  );
});
