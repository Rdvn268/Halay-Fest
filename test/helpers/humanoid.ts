import { readFile } from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createHash } from "node:crypto";
import { QUATERNIUS_RIG } from "../../packages/halay-game/src/humanoid/rig.js";

export async function motionFixture() {
  const bytes = await readFile(
    "apps/broadcaster/public/characters/humanoid/male.glb",
  );
  const length = bytes.readUInt32LE(12),
    original = JSON.parse(bytes.subarray(20, 20 + length).toString("utf8"));
  const nodes = original.nodes.map((n: Record<string, unknown>) => {
    const c = { ...n };
    delete c["mesh"];
    delete c["skin"];
    return c;
  });
  const shin = nodes.findIndex((n: { name: string }) => n.name === "calf_l"),
    q = nodes[shin].rotation ?? [0, 0, 0, 1];
  const data = Buffer.alloc(8 + 32);
  data.writeFloatLE(0, 0);
  data.writeFloatLE(1, 4);
  const values = [...q, ...[Math.sin(0.2), 0, 0, Math.cos(0.2)]];
  values.forEach((v, i) => data.writeFloatLE(v, 8 + i * 4));
  const doc = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: original.scenes,
    nodes,
    skins: [{ joints: original.skins[0].joints }],
    buffers: [{ byteLength: data.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 8 },
      { buffer: 0, byteOffset: 8, byteLength: 32 },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 2,
        type: "SCALAR",
        min: [0],
        max: [1],
      },
      { bufferView: 1, componentType: 5126, count: 2, type: "VEC4" },
    ],
    animations: [
      {
        name: "fixture_contact",
        samplers: [{ input: 0, output: 1, interpolation: "LINEAR" }],
        channels: [{ sampler: 0, target: { node: shin, path: "rotation" } }],
      },
    ],
  };
  const json = Buffer.from(JSON.stringify(doc)),
    pad = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
  const h = Buffer.alloc(20);
  h.writeUInt32LE(0x46546c67);
  h.writeUInt32LE(2, 4);
  h.writeUInt32LE(28 + pad.length + data.length, 8);
  h.writeUInt32LE(pad.length, 12);
  h.writeUInt32LE(0x4e4f534a, 16);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(data.length);
  bh.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([h, pad, bh, data]);
  const manifest = {
    version: 1,
    dance: "halay",
    clip: "fixture_contact",
    beats: 8,
    sha256: createHash("sha256").update(glb).digest("hex"),
    rig: QUATERNIUS_RIG,
    provenance: {
      author: "Halay Fest test fixture; Quaternius rest skeleton",
      source: "test/helpers/humanoid.ts",
      license: "CC0-1.0",
      commercialUse: true,
      redistribution: true,
      kind: "authored-study",
      evidence: "assets/licenses/quaternius-base-characters-CC0.txt",
    },
    contacts: [
      { side: "L", start: 0, end: 0.4 },
      { side: "R", start: 0.4, end: 1 },
    ],
    rootMotion: [
      { phase: 0, x: 0, z: 0 },
      { phase: 1, x: 0, z: 0 },
    ],
  };
  return { glb, manifest };
}
/** Node tests exercise original geometry/skin, omitting image decoding (covered in Chromium). */
export async function bareHumanoid(name = "male") {
  const bytes = await readFile(
    `apps/broadcaster/public/characters/humanoid/${name}.glb`,
  );
  const jsonLength = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
  const binStart = 20 + jsonLength + 8;
  doc.buffers = [{ byteLength: bytes.length - binStart }];
  delete doc.images;
  delete doc.textures;
  delete doc.materials;
  for (const mesh of doc.meshes)
    for (const p of mesh.primitives) delete p.material;
  const json = Buffer.from(JSON.stringify(doc));
  const padded = Buffer.concat([
    json,
    Buffer.alloc((4 - (json.length % 4)) % 4, 32),
  ]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + padded.length + bytes.length - binStart, 8);
  header.writeUInt32LE(padded.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(bytes.length - binStart);
  bh.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([header, padded, bh, bytes.subarray(binStart)]);
  return (
    await new GLTFLoader().parseAsync(
      glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength),
      "",
    )
  ).scene;
}
