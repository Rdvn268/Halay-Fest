import { it, expect } from "vitest";
import * as T from "three";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { bareHumanoid } from "../helpers/humanoid.js";
import { sequenceFrame } from "../../packages/halay-game/src/humanoid/sequence.js";
import {
  QUATERNIUS_RIG,
  bindHumanoid,
  cloneHumanoid,
  solveLimb,
  importMotion,
} from "../../packages/halay-game/src/humanoid/rig.js";
import { FootContacts } from "../../packages/halay-game/src/humanoid/contact.js";
import { bakeContactStudy } from "../../packages/halay-game/src/humanoid/studies.js";
import { retargetHumanoid } from "../../packages/halay-game/src/humanoid/retarget.js";
import {
  parseMotionManifest,
  productionGate,
  danceLibraries,
} from "../../packages/halay-game/src/humanoid/motion-manifest.js";

it("verifies bundled model bytes against the official archive conversion and CC0 evidence", async () => {
  for (const name of ["manifest.json", "outfits-manifest.json"]) {
    const m = JSON.parse(
      await readFile(
        `apps/broadcaster/public/characters/humanoid/${name}`,
        "utf8",
      ),
    );
    expect(m.license).toBe("CC0-1.0");
    expect(m.productionApproved).toBe(false);
    expect(await readFile(m.licenseEvidence, "utf8")).toContain(
      "CC0 1.0 Universal",
    );
    for (const a of m.assets) {
      const b = await readFile(
        `apps/broadcaster/public/characters/humanoid/${a.path}`,
      );
      expect(createHash("sha256").update(b).digest("hex")).toBe(a.sha256);
    }
  }
});
it("loads multiple meshes and a 65-bone humanoid, shares skin resources but isolates clone joints", async () => {
  const source = await bareHumanoid(),
    a = cloneHumanoid(source, QUATERNIUS_RIG),
    b = cloneHumanoid(source, QUATERNIUS_RIG);
  expect(a.skins).toHaveLength(3);
  expect(a.skins[0]!.skeleton.bones).toHaveLength(65);
  expect(a.skins[0]!.geometry).toBe(b.skins[0]!.geometry);
  expect(a.rig.handL).not.toBe(b.rig.handL);
  const before = b.rig.handL.quaternion.clone();
  a.rig.handL.rotateX(0.5);
  expect(b.rig.handL.quaternion.equals(before)).toBe(true);
  expect(() =>
    bindHumanoid(source, { ...QUATERNIUS_RIG, footL: "missing" }),
  ).toThrow("Required");
});
it("solves actual unequal rig segments without changing bone lengths, exposing unreachable residual", async () => {
  const model = await bareHumanoid(),
    r = bindHumanoid(model, QUATERNIUS_RIG);
  model.updateMatrixWorld(true);
  const start = r.thighL.getWorldPosition(new T.Vector3()),
    oldLength = r.shinL.position.length();
  const target = start.clone().add(new T.Vector3(0.1, -0.65, 0.12));
  expect(
    solveLimb(r.thighL, r.shinL, r.footL, target, new T.Vector3(0, 0, 1)),
  ).toBeLessThan(1e-4);
  expect(r.shinL.position.length()).toBe(oldLength);
  expect(
    solveLimb(
      r.thighL,
      r.shinL,
      r.footL,
      start.clone().add(new T.Vector3(0, -10, 0)),
      new T.Vector3(0, 0, 1),
    ),
  ).toBeGreaterThan(8);
});
it("locks planted ankles in world space across root travel and releases swing feet", async () => {
  const model = await bareHumanoid(),
    rig = bindHumanoid(model, QUATERNIUS_RIG),
    contacts = new FootContacts();
  model.updateMatrixWorld(true);
  contacts.apply(rig, { L: "plant", R: null }, 1 / 60);
  const anchor = rig.footL.getWorldPosition(new T.Vector3());
  model.position.x += 0.06;
  model.updateMatrixWorld(true);
  const m = contacts.apply(rig, { L: "plant", R: null }, 1 / 60);
  expect(m.drift).toBeLessThan(1e-3);
  expect(
    rig.footL.getWorldPosition(new T.Vector3()).distanceTo(anchor),
  ).toBeLessThan(1e-3);
  expect(contacts.apply(rig, { L: null, R: null }, 1 / 60).count).toBe(0);
});
it("bakes two distinct explicit-contact engineering clips and never calls them approved folk performance", async () => {
  const model = await bareHumanoid();
  const a = bakeContactStudy(model, QUATERNIUS_RIG, 0),
    b = bakeContactStudy(model, QUATERNIUS_RIG, 1);
  expect(a.clip.duration).toBe(4);
  expect(a.clip.tracks).toHaveLength(66);
  expect(a.contactsAt(0.05, 0).L).toBe(null);
  expect(a.contactsAt(0.05, 0).R).not.toBe(null);
  expect(a.rootAt(1).length()).toBeLessThan(1e-8);
  expect(a.rootAt(0.3).distanceTo(b.rootAt(0.3))).toBeGreaterThan(0.1);
  expect(a.provenance.regionalApproval).toBe(false);
  expect(
    productionGate(
      [
        {
          kind: a.provenance.kind,
          licenseVerified: true,
          regionalApproved: false,
        },
      ],
      false,
    ).accepted,
  ).toBe(false);
  for (const style of ["horon", "govend", "zeybek"] as const)
    expect(danceLibraries[style].status).toBe("locked");
});
it("retargets motion between different bind poses and restores source/target including unmapped bones", async () => {
  const source = await bareHumanoid(),
    target = await bareHumanoid("female");
  const r = bindHumanoid(source, QUATERNIUS_RIG);
  const before = r.shinL.quaternion.clone();
  const rest = r.shinL.quaternion.clone(),
    moved = rest
      .clone()
      .multiply(
        new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), 0.3),
      );
  const clavicle = source.getObjectByName("clavicle_l") as T.Bone,
    clavicleRest = clavicle.quaternion.clone();
  const clip = new T.AnimationClip("fixture", 1, [
    new T.QuaternionKeyframeTrack(
      "calf_l.quaternion",
      [0, 1],
      [...rest.toArray(), ...moved.toArray()],
    ),
    new T.QuaternionKeyframeTrack(
      "clavicle_l.quaternion",
      [0, 1],
      [
        ...clavicleRest.toArray(),
        ...clavicleRest.clone().multiply(moved).toArray(),
      ],
    ),
  ]);
  const baked = retargetHumanoid(
    source,
    target,
    clip,
    QUATERNIUS_RIG,
    QUATERNIUS_RIG,
  );
  const track = baked.tracks.find((t) => t.name === "calf_l.quaternion")!;
  expect(track.values.length).toBeGreaterThan(100);
  expect(Math.abs(track.values[0]! - track.values.at(-4)!)).toBeGreaterThan(
    0.01,
  );
  expect(r.shinL.quaternion.toArray()).toEqual(before.toArray());
  expect(clavicle.quaternion.toArray()).toEqual(clavicleRest.toArray());
  expect(() =>
    retargetHumanoid(
      source,
      target,
      new T.AnimationClip("invalid", 200, []),
      QUATERNIUS_RIG,
      QUATERNIUS_RIG,
    ),
  ).toThrow("budget");
});
function manifest() {
  return {
    version: 1,
    dance: "halay",
    clip: "take-1",
    beats: 8,
    sha256: "a".repeat(64),
    rig: QUATERNIUS_RIG,
    provenance: {
      author: "Fixture author",
      source: "local fixture",
      license: "CC0-1.0",
      commercialUse: true,
      redistribution: true,
      kind: "authored-study",
      evidence: "test fixture",
    },
    contacts: [
      { side: "L", start: 0, end: 0.5 },
      { side: "R", start: 0.5, end: 1 },
    ],
    rootMotion: [
      { phase: 0, x: 0, z: 0 },
      { phase: 1, x: 0, z: 0 },
    ],
  };
}
it("switches complete figures on bar boundaries and retains accumulated root travel across the sequence loop", () => {
  const figures = [
    { beats: 6, rootAt: (p: number) => new T.Vector3(p, 0, 0) },
    { beats: 4, rootAt: (p: number) => new T.Vector3(0, 0, p * 0.5) },
  ];
  expect(sequenceFrame(figures, 7.9, 4).index).toBe(0);
  const boundary = sequenceFrame(figures, 8, 4);
  expect(boundary.index).toBe(1);
  expect(boundary.phase).toBe(0);
  expect(boundary.travel.x).toBe(1);
  const loop = sequenceFrame(figures, 12, 4);
  expect(loop.travel.toArray()).toEqual([1, 0, 0.5]);
  expect(loop.phase).toBe(0);
});
it("rejects unlicensed imports, overlapping contacts and non-Halay metadata before parsing animation", () => {
  expect(parseMotionManifest(manifest()).beats).toBe(8);
  expect(() => parseMotionManifest({ ...manifest(), dance: "horon" })).toThrow(
    "Halay",
  );
  expect(() =>
    parseMotionManifest({
      ...manifest(),
      provenance: { ...manifest().provenance, redistribution: false },
    }),
  ).toThrow("permission");
  expect(() =>
    parseMotionManifest({
      ...manifest(),
      contacts: [...manifest().contacts, { side: "L", start: 0.4, end: 0.8 }],
    }),
  ).toThrow("overlapping");
  expect(() =>
    parseMotionManifest({ ...manifest(), sha256: "missing" }),
  ).toThrow("SHA");
});
it("imports a self-contained motion glTF and refuses remote buffers", async () => {
  const doc = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: "Root" }],
  };
  const buffer = new TextEncoder().encode(JSON.stringify(doc)).buffer;
  expect(
    (await importMotion(buffer, "gltf")).scene.getObjectByName("Root"),
  ).toBeDefined();
  const remote = {
    ...doc,
    buffers: [{ uri: "https://example.invalid/steal.bin", byteLength: 12 }],
    bufferViews: [{ buffer: 0, byteLength: 12 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 1, type: "VEC3" }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ mesh: 0 }],
  };
  await expect(
    importMotion(
      new TextEncoder().encode(JSON.stringify(remote)).buffer,
      "gltf",
    ),
  ).rejects.toThrow("External");
});
