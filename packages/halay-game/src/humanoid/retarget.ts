import * as T from "three";
import { bindHumanoid } from "./rig.js";
import type { Joint, RigMap } from "./rig.js";

/** Offline rest-pose/world-axis retargeting. Bake once per asset, share clips across instances.
 * Requires an explicit mapping and a source rig in bind pose. Does not infer folklore or foot contacts.
 */
export function retargetHumanoid(
  source: T.Object3D,
  target: T.Object3D,
  clip: T.AnimationClip,
  sourceMap: RigMap,
  targetMap: RigMap,
  fps = 30,
) {
  if (
    !Number.isFinite(clip.duration) ||
    clip.duration <= 0 ||
    clip.duration > 120 ||
    fps < 1 ||
    fps > 120
  )
    throw new Error("Invalid motion sampling budget");
  const from = bindHumanoid(source, sourceMap),
    to = bindHumanoid(target, targetMap);
  const keys = Object.keys(from) as Joint[];
  source.updateMatrixWorld(true);
  target.updateMatrixWorld(true);
  const capture = (root: T.Object3D) => {
    const result: { b: T.Bone; p: T.Vector3; q: T.Quaternion }[] = [];
    root.traverse((b) => {
      if (b instanceof T.Bone)
        result.push({ b, p: b.position.clone(), q: b.quaternion.clone() });
    });
    return result;
  };
  const savedSource = capture(source),
    savedTarget = capture(target);
  const sourceRest = new Map(
    keys.map((k) => [k, from[k].getWorldQuaternion(new T.Quaternion())]),
  );
  const targetRest = new Map(
    keys.map((k) => [k, to[k].getWorldQuaternion(new T.Quaternion())]),
  );
  const sourceHip = from.hips.position.clone(),
    targetHip = to.hips.position.clone();
  const leg = (r: typeof from) =>
    r.hips
      .getWorldPosition(new T.Vector3())
      .distanceTo(r.footL.getWorldPosition(new T.Vector3()));
  const ratio = leg(to) / leg(from);
  if (!Number.isFinite(ratio) || ratio <= 0)
    throw new Error("Invalid rig scale");
  const mixer = new T.AnimationMixer(source);
  const action = mixer.clipAction(clip).setLoop(T.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  const frames = Math.ceil(clip.duration * fps),
    times: number[] = [],
    values = new Map(keys.map((k) => [k, [] as number[]])),
    positions: number[] = [];
  try {
    for (let i = 0; i <= frames; i++) {
      const t = Math.min(clip.duration, i / fps);
      times.push(t);
      // setTime resets mixer state, so seek is deterministic and independent of render delta.
      mixer.setTime(t);
      source.updateMatrixWorld(true);
      // Parent-before-child, including unmapped spine/clavicle joints in target's rest hierarchy.
      const depth = (b: T.Object3D) => {
        let n = 0;
        while (b.parent) {
          n++;
          b = b.parent;
        }
        return n;
      };
      for (const k of [...keys].sort((a, b) => depth(to[a]) - depth(to[b]))) {
        const world = from[k]
          .getWorldQuaternion(new T.Quaternion())
          .multiply(sourceRest.get(k)!.clone().invert())
          .multiply(targetRest.get(k)!);
        to[k].quaternion.copy(
          to[k]
            .parent!.getWorldQuaternion(new T.Quaternion())
            .invert()
            .multiply(world),
        );
        to[k].updateWorldMatrix(false, true);
        values.get(k)!.push(...to[k].quaternion.toArray());
      }
      const displacement = from.hips.position
        .clone()
        .sub(sourceHip)
        .multiplyScalar(ratio);
      // Convert source parent-local displacement through world into the target parent's axes.
      displacement
        .applyQuaternion(
          from.hips.parent!.getWorldQuaternion(new T.Quaternion()),
        )
        .applyQuaternion(
          to.hips.parent!.getWorldQuaternion(new T.Quaternion()).invert(),
        );
      positions.push(...displacement.add(targetHip).toArray());
    }
    return new T.AnimationClip(clip.name, clip.duration, [
      ...keys.map(
        (k) =>
          new T.QuaternionKeyframeTrack(
            `${targetMap[k]}.quaternion`,
            times,
            values.get(k)!,
          ),
      ),
      new T.VectorKeyframeTrack(`${targetMap.hips}.position`, times, positions),
    ]);
  } finally {
    mixer.stopAllAction();
    mixer.uncacheRoot(source);
    for (const x of [...savedSource, ...savedTarget]) {
      x.b.position.copy(x.p);
      x.b.quaternion.copy(x.q);
    }
    source.updateMatrixWorld(true);
    target.updateMatrixWorld(true);
  }
}
