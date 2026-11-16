/** Independent Three.js skin evaluation of the exported clip, without a GPU. */
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export async function loadMotionGeometry(path: string) {
  const bytes = await readFile(path);
  const length = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + length).toString());
  delete doc.images;
  delete doc.textures;
  delete doc.materials;
  for (const mesh of doc.meshes)
    for (const primitive of mesh.primitives) delete primitive.material;
  const raw = Buffer.from(JSON.stringify(doc));
  const json = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32);
  raw.copy(json);
  const bin = bytes.subarray(20 + length);
  const output = Buffer.alloc(20 + json.length + bin.length);
  bytes.copy(output, 0, 0, 20);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(json.length, 12);
  json.copy(output, 20);
  bin.copy(output, 20 + json.length);
  return new GLTFLoader().parseAsync(
    output.buffer.slice(output.byteOffset, output.byteOffset + output.length),
    "",
  );
}

export async function measureMotion(
  path: string,
  spec: {
    durationSeconds: number;
    rightForefootContacts: number[][];
    toePivotsWorldBind: Record<string, number[]>;
  },
  offset = 0,
) {
  const gltf = await loadMotionGeometry(path);
  const clip = gltf.animations[0];
  if (!clip) throw new Error("Missing motion clip");
  const skins: T.SkinnedMesh[] = [],
    bones: T.Bone[] = [];
  gltf.scene.traverse((o) => {
    if (o instanceof T.SkinnedMesh) skins.push(o);
    if (o instanceof T.Bone) bones.push(o);
  });
  const shoe = skins.find((o) => o.name.includes("shoes01"));
  const hips = bones.find((o) => o.name === "mixamorigHips");
  if (!shoe || !hips) throw new Error("Missing production shoe or hips");
  const attribute = shoe.geometry.getAttribute("position");
  const ids: Record<string, number[]> = { Left: [], Right: [] };
  const pivots: Record<string, number> = {};
  for (const side of ["Left", "Right"]) {
    const point = spec.toePivotsWorldBind[side]!;
    const target = new T.Vector3(point[0]!, point[2]!, -point[1]!);
    let closest = Infinity;
    for (let i = 0; i < attribute.count; i++) {
      const p = new T.Vector3().fromBufferAttribute(attribute, i);
      if (p.y < 0.023 && p.x * (side === "Left" ? 1 : -1) > 0)
        ids[side]!.push(i);
      const distance = p.distanceTo(target);
      if (distance < closest) {
        closest = distance;
        pivots[side] = i;
      }
    }
    if (closest > 0.0001 || !ids[side]!.length)
      throw new Error("Sole bind geometry mismatch");
  }
  const mixer = new T.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(clip);
  action.setLoop(T.LoopOnce, 1);
  action.clampWhenFinished = true;
  const frames: {
    time: number;
    soles: Record<string, number>;
    toes: Record<string, number[]>;
    hips: number[];
    rightContact: boolean;
  }[] = [];
  const boneFrames: { positions: T.Vector3[]; rotations: T.Quaternion[] }[] =
    [];
  const rate = 120; // Includes between-keyframe contact drift, not just baked poses.
  const count = Math.round(spec.durationSeconds * rate);
  for (let f = 0; f <= count; f++) {
    const time = f / rate;
    action.reset().play();
    mixer.setTime(offset + time);
    gltf.scene.updateMatrixWorld(true);
    for (const skin of skins) skin.skeleton.update();
    const soles: Record<string, number> = {};
    const toes: Record<string, number[]> = {};
    for (const side of ["Left", "Right"]) {
      soles[side] = Math.min(
        ...ids[side]!.map(
          (i) =>
            shoe
              .getVertexPosition(i, new T.Vector3())
              .applyMatrix4(shoe.matrixWorld).y,
        ),
      );
      toes[side] = shoe
        .getVertexPosition(pivots[side]!, new T.Vector3())
        .applyMatrix4(shoe.matrixWorld)
        .toArray();
    }
    frames.push({
      time,
      soles,
      toes,
      hips: hips.getWorldPosition(new T.Vector3()).toArray(),
      rightContact: spec.rightForefootContacts.some(
        ([a, b]) => time >= a! - 1e-6 && time <= b! + 1e-6,
      ),
    });
    boneFrames.push({
      positions: bones.map((b) => b.getWorldPosition(new T.Vector3())),
      rotations: bones.map((b) =>
        b.getWorldQuaternion(new T.Quaternion()).normalize(),
      ),
    });
  }
  const contacts = spec.rightForefootContacts.map(([start, end]) => {
    const contact = frames.filter(
      (f) => f.time >= start! - 1e-6 && f.time <= end! + 1e-6,
    );
    const first = contact[0]!.toes["Right"]!;
    return {
      start,
      end,
      samples: contact.length,
      toeHorizontalDriftMetres: Math.max(
        ...contact.map((f) =>
          Math.hypot(
            f.toes["Right"]![0]! - first[0]!,
            f.toes["Right"]![2]! - first[2]!,
          ),
        ),
      ),
      maximumSoleHeightMetres: Math.max(
        ...contact.map((f) => f.soles["Right"]!),
      ),
      minimumSoleHeightMetres: Math.min(
        ...contact.map((f) => f.soles["Right"]!),
      ),
    };
  });
  const first = boneFrames[0]!,
    last = boneFrames[count]!;
  const velocityGap = bones.map((_, i) => {
    const a = boneFrames[1]!.positions[i]!.clone()
      .sub(first.positions[i]!)
      .multiplyScalar(rate);
    const b = last.positions[i]!.clone()
      .sub(boneFrames[count - 1]!.positions[i]!)
      .multiplyScalar(rate);
    return a.distanceTo(b);
  });
  const rootJumps = frames.slice(1).flatMap((f, i) => {
    const delta = new T.Vector3(
      ...(f.hips as [number, number, number]),
    ).distanceTo(
      new T.Vector3(...(frames[i]!.hips as [number, number, number])),
    );
    return (delta * rate) / 30 > 0.04
      ? [{ time: f.time, metresPer30HzFrame: (delta * rate) / 30 }]
      : [];
  });
  const hipIndex = bones.indexOf(hips);
  const hipAngleJumps = boneFrames.slice(1).flatMap((f, i) => {
    const radians =
      (f.rotations[hipIndex]!.angleTo(boneFrames[i]!.rotations[hipIndex]!) *
        rate) /
      30;
    return radians > Math.PI / 12
      ? [
          {
            time: (i + 1) / rate,
            degreesPer30HzFrame: (radians * 180) / Math.PI,
          },
        ]
      : [];
  });
  const summary = {
    bones: bones.length,
    skinnedMeshes: skins.length,
    clips: gltf.animations.length,
    clipDuration: clip.duration,
    clipValid: clip.validate(),
    evaluatedFrames: frames.length,
    samplingHz: rate,
    minimumSoleHeightMetres: Math.min(
      ...frames.flatMap((f) => Object.values(f.soles)),
    ),
    maximumRightContactSoleHeightMetres: Math.max(
      ...contacts.map((c) => c.maximumSoleHeightMetres),
    ),
    maximumRightContactHorizontalDriftMetres: Math.max(
      ...contacts.map((c) => c.toeHorizontalDriftMetres),
    ),
    loopMaximumBonePositionGapMetres: Math.max(
      ...bones.map((_, i) =>
        first.positions[i]!.distanceTo(last.positions[i]!),
      ),
    ),
    loopMaximumBoneAngleGapRadians: Math.max(
      ...bones.map((_, i) => first.rotations[i]!.angleTo(last.rotations[i]!)),
    ),
    loopMaximumBoneVelocityGapMetresPerSecond: Math.max(...velocityGap),
    rootJumpsOver40mmPerFrame: rootJumps,
    hipRotationJumpsOver15DegreesPer30HzFrame: hipAngleJumps,
    contacts,
    frames,
  };
  mixer.stopAllAction();
  return summary;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [model, specPath, out, offset] = process.argv.slice(2);
  if (!model || !specPath || !out)
    throw new Error(
      "Usage: audit-horon-motion.ts MODEL BUILD_SPEC OUT [OFFSET]",
    );
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  const report = await measureMotion(model, spec, Number(offset ?? 0));
  await writeFile(out, JSON.stringify(report, null, 2) + "\n");
  const { frames: omitted, ...summary } = report;
  void omitted;
  console.log(JSON.stringify(summary, null, 2));
}
