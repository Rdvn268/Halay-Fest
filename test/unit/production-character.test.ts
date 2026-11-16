import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  PRODUCTION_RIG,
  createProductionInstance,
} from "../../packages/halay-game/src/humanoid/production-character.js";

const path =
  "apps/broadcaster/public/characters/production/wedding-guest-01.glb";
// Texture decoding is exercised in Chromium. Preserve the real mesh/BIN/weights here.
async function geometryOnly() {
  const bytes = await readFile(path);
  const length = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + length).toString());
  delete doc.images;
  delete doc.textures;
  delete doc.materials;
  for (const mesh of doc.meshes)
    for (const primitive of mesh.primitives) delete primitive.material;
  const json = Buffer.from(JSON.stringify(doc)),
    padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
  json.copy(padded);
  const bin = bytes.subarray(20 + length),
    out = Buffer.alloc(20 + padded.length + bin.length);
  out.writeUInt32LE(0x46546c67);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(padded.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  padded.copy(out, 20);
  bin.copy(out, 20 + padded.length);
  return new GLTFLoader().parseAsync(out.buffer, "");
}

it("ships a self-contained licensed GLB and the matching editable Blender source", async () => {
  const info = JSON.parse(
    await readFile(
      "apps/broadcaster/public/characters/production/build-info.json",
      "utf8",
    ),
  );
  for (const [file, record] of Object.entries(info.outputs) as [
    string,
    { sha256: string; bytes: number },
  ][]) {
    const bytes = await readFile(file);
    expect(bytes.byteLength).toBe(record.bytes);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      record.sha256,
    );
  }
  expect(info.license).toBe("CC0-1.0");
  expect(info.artApproved).toBe(false);
  const bytes = await readFile(path);
  expect(bytes.length).toBeLessThan(32 * 1024 * 1024);
  expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
  const doc = JSON.parse(
    bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
  );
  expect(doc.animations ?? []).toHaveLength(0);
  expect(doc.skins).toHaveLength(1);
  expect(doc.skins[0].joints).toHaveLength(52);
  expect(doc.images.length).toBeGreaterThan(5);
  for (const image of doc.images) {
    expect(image.bufferView).toBeTypeOf("number");
    expect(image.uri).toBeUndefined();
  }
  for (const buffer of doc.buffers) expect(buffer.uri).toBeUndefined();
  const clothing = doc.materials.find((m: { name: string }) =>
    m.name.includes("elegantsuit"),
  );
  expect(clothing.alphaMode ?? "OPAQUE").toBe("OPAQUE");
  expect(clothing.pbrMetallicRoughness.roughnessFactor).toBeGreaterThan(0.75);
});

it("keeps every skinned vertex in the native bind pose without the armature-scale export offset", async () => {
  const gltf = await geometryOnly();
  gltf.scene.updateMatrixWorld(true);
  const instance = createProductionInstance(gltf.scene);
  instance.model.updateMatrixWorld(true);
  expect(instance.skins).toHaveLength(9);
  for (const skin of instance.skins) {
    const positions = skin.geometry.getAttribute("position");
    const weights = skin.geometry.getAttribute("skinWeight");
    for (let i = 0; i < positions.count; i++) {
      expect(
        weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i),
      ).toBeCloseTo(1, 5);
      const raw = new T.Vector3().fromBufferAttribute(positions, i);
      expect(
        skin.getVertexPosition(i, new T.Vector3()).distanceTo(raw),
      ).toBeLessThan(0.00001);
    }
  }
  expect(
    new T.Box3().setFromObject(instance.model).getSize(new T.Vector3()).y,
  ).toBeGreaterThan(1.6);
});

it("preserves Blender's fitted attachment bounds, including the actual eye and clothing positions", async () => {
  const info = JSON.parse(
    await readFile(
      "apps/broadcaster/public/characters/production/build-info.json",
      "utf8",
    ),
  ) as {
    meshes: { name: string; boundsYUp: { min: number[]; max: number[] } }[];
  };
  const gltf = await geometryOnly();
  gltf.scene.updateMatrixWorld(true);
  for (const expected of info.meshes) {
    const mesh = gltf.scene.getObjectByName(expected.name.replaceAll(".", ""));
    expect(mesh, expected.name).toBeDefined();
    const actual = new T.Box3().setFromObject(mesh!);
    for (const side of ["min", "max"] as const)
      actual[side]
        .toArray()
        .forEach((value, axis) =>
          expect(value).toBeCloseTo(expected.boundsYUp[side][axis]!, 5),
        );
  }
});

it("creates independent humanoid bones with shared render resources and deformable fingers", async () => {
  const gltf = await geometryOnly();
  const a = createProductionInstance(gltf.scene),
    b = createProductionInstance(gltf.scene);
  expect(a.rig.handL.name).toBe(PRODUCTION_RIG.handL);
  expect(a.rig.handL).not.toBe(b.rig.handL);
  expect(a.skins[0]!.geometry).toBe(b.skins[0]!.geometry);
  a.rig.lowerArmL.rotation.x += 0.4;
  expect(a.rig.lowerArmL.quaternion.equals(b.rig.lowerArmL.quaternion)).toBe(
    false,
  );
  const fingers: T.Bone[] = [];
  a.model.traverse((o) => {
    if (o instanceof T.Bone && /Hand.*[123]$/.test(o.name)) fingers.push(o);
  });
  expect(fingers).toHaveLength(30);
  const finger = fingers.find(
    (bone) => bone.name === "mixamorigLeftHandIndex1",
  )!;
  const body = a.skins.find((skin) => skin.name.includes("Body"))!;
  a.model.updateMatrixWorld(true);
  const before = Array.from(
    { length: body.geometry.getAttribute("position").count },
    (_, index) => body.getVertexPosition(index, new T.Vector3()),
  );
  finger.rotateX(0.6);
  a.model.updateMatrixWorld(true);
  const maximumFingerDeformation = Math.max(
    ...before.map((position, index) =>
      position.distanceTo(body.getVertexPosition(index, new T.Vector3())),
    ),
  );
  expect(maximumFingerDeformation).toBeGreaterThan(0.001);
  const moved = new T.Vector3();
  a.model.updateMatrixWorld(true);
  a.rig.handL.getWorldPosition(moved);
  b.model.updateMatrixWorld(true);
  expect(
    moved.distanceTo(b.rig.handL.getWorldPosition(new T.Vector3())),
  ).toBeGreaterThan(0.01);
});
