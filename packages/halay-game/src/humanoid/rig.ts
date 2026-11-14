import * as T from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

export const QUATERNIUS_RIG = {
  hips: "pelvis",
  spine: "spine_01",
  chest: "spine_03",
  head: "Head",
  upperArmL: "upperarm_l",
  lowerArmL: "lowerarm_l",
  handL: "hand_l",
  upperArmR: "upperarm_r",
  lowerArmR: "lowerarm_r",
  handR: "hand_r",
  thighL: "thigh_l",
  shinL: "calf_l",
  footL: "foot_l",
  thighR: "thigh_r",
  shinR: "calf_r",
  footR: "foot_r",
} as const;
export type Joint = keyof typeof QUATERNIUS_RIG;
export type RigMap = Record<Joint, string>;
export type HumanoidRig = Record<Joint, T.Bone>;

export function bindHumanoid(root: T.Object3D, map: RigMap): HumanoidRig {
  const byName = new Map<string, T.Bone>();
  root.traverse((o) => {
    if (o instanceof T.Bone) {
      if (byName.has(o.name)) throw new Error(`Duplicate bone: ${o.name}`);
      byName.set(o.name, o);
    }
  });
  const rig = {} as HumanoidRig;
  for (const key of Object.keys(map) as Joint[]) {
    const bone = byName.get(map[key]);
    if (!bone)
      throw new Error(`Required humanoid joint missing: ${key}/${map[key]}`);
    rig[key] = bone;
  }
  if (new Set(Object.values(rig)).size !== Object.keys(map).length)
    throw new Error("A humanoid joint may not alias another joint");
  for (const [a, b, c] of [
    ["upperArmL", "lowerArmL", "handL"],
    ["upperArmR", "lowerArmR", "handR"],
    ["thighL", "shinL", "footL"],
    ["thighR", "shinR", "footR"],
  ] as const) {
    if (rig[b].parent !== rig[a] || rig[c].parent !== rig[b])
      throw new Error(`Unsupported limb hierarchy: ${a}`);
  }
  return rig;
}
/** Generic two-segment IK: uses the actual rig lengths and bind axes, never hard-coded .32/.30. */
export function solveLimb(
  a: T.Bone,
  b: T.Bone,
  c: T.Bone,
  target: T.Vector3,
  pole: T.Vector3,
) {
  a.updateWorldMatrix(true, true);
  const start = a.getWorldPosition(new T.Vector3()),
    middle = b.getWorldPosition(new T.Vector3()),
    end = c.getWorldPosition(new T.Vector3());
  const l1 = start.distanceTo(middle),
    l2 = middle.distanceTo(end);
  if (l1 < 1e-6 || l2 < 1e-6) throw new Error("Degenerate humanoid limb");
  const axis = target.clone().sub(start),
    raw = axis.length();
  if (raw < 1e-8) axis.set(0, -1, 0);
  else axis.divideScalar(raw);
  const distance = T.MathUtils.clamp(
    raw,
    Math.abs(l1 - l2) + 1e-5,
    l1 + l2 - 1e-5,
  );
  const bend = pole.clone().addScaledVector(axis, -pole.dot(axis));
  if (bend.lengthSq() < 1e-8) bend.copy(new T.Vector3(0, 0, 1).cross(axis));
  if (bend.lengthSq() < 1e-8) bend.copy(new T.Vector3(1, 0, 0).cross(axis));
  bend.normalize();
  const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
  const elbow = start
    .clone()
    .addScaledVector(axis, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, l1 * l1 - along * along)));
  const reachable = start.clone().addScaledVector(axis, distance);
  const aim = (bone: T.Bone, child: T.Bone, goal: T.Vector3) => {
    const origin = bone.getWorldPosition(new T.Vector3());
    const from = child
      .getWorldPosition(new T.Vector3())
      .sub(origin)
      .normalize();
    const to = goal.clone().sub(origin).normalize();
    const world = bone
      .getWorldQuaternion(new T.Quaternion())
      .premultiply(new T.Quaternion().setFromUnitVectors(from, to));
    const parent = bone.parent!.getWorldQuaternion(new T.Quaternion()).invert();
    bone.quaternion.copy(parent.multiply(world));
    bone.updateWorldMatrix(false, true);
  };
  aim(a, b, elbow);
  aim(b, c, reachable);
  return c.getWorldPosition(new T.Vector3()).distanceTo(target);
}
export function skeletons(root: T.Object3D) {
  const meshes: T.SkinnedMesh[] = [];
  root.traverse((o) => {
    if (o instanceof T.SkinnedMesh) meshes.push(o);
  });
  return meshes;
}
export function cloneHumanoid(template: T.Object3D, map: RigMap) {
  const model = clone(template);
  const rig = bindHumanoid(model, map);
  const skins = skeletons(model);
  if (!skins.length) throw new Error("Humanoid must contain a skinned mesh");
  const shared: T.Skeleton[] = [];
  for (const skin of skins) {
    const own = skin.skeleton;
    const matching = shared.find(
      (s) =>
        s.bones.length === own.bones.length &&
        s.bones.every(
          (b, i) =>
            b === own.bones[i] &&
            s.boneInverses[i]!.elements.every(
              (v, j) => Math.abs(v - own.boneInverses[i]!.elements[j]!) < 1e-6,
            ),
        ),
    );
    if (matching) {
      own.dispose();
      skin.skeleton = matching;
    } else shared.push(own);
  }
  return { model, rig, skins };
}
export async function importMotion(
  bytes: ArrayBuffer,
  format: "glb" | "gltf" | "fbx",
) {
  if (bytes.byteLength > 32 * 1024 * 1024)
    throw new Error("Motion import exceeds 32 MiB");
  // Animation imports are local/self-contained; external glTF buffers/textures are rejected.
  const manager = new T.LoadingManager();
  manager.setURLModifier((url) => {
    if (!url.startsWith("data:") && !url.startsWith("blob:"))
      throw new Error("External asset resource is not allowed");
    return url;
  });
  if (format === "fbx") {
    const scene = new FBXLoader(manager).parse(bytes, "");
    return { scene, animations: scene.animations };
  }
  const json =
    format === "gltf"
      ? new TextDecoder().decode(bytes)
      : new TextDecoder().decode(
          new Uint8Array(bytes, 20, new DataView(bytes).getUint32(12, true)),
        );
  const document = JSON.parse(json) as {
    images?: unknown[];
    nodes?: unknown[];
    animations?: unknown[];
    accessors?: { count: number }[];
  };
  if (document.images?.length)
    throw new Error("Export motion-only glTF/GLB without textures");
  if (
    (document.nodes?.length ?? 0) > 256 ||
    (document.animations?.length ?? 0) > 32 ||
    document.accessors?.some((a) => a.count > 250000)
  )
    throw new Error("Motion node/keyframe budget exceeded");
  return new GLTFLoader(manager).parseAsync(
    format === "gltf" ? new TextDecoder().decode(bytes) : bytes,
    "",
  );
}
