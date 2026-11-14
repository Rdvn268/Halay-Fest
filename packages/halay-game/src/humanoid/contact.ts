import * as T from "three";
import { solveLimb } from "./rig.js";
import type { HumanoidRig } from "./rig.js";

export type Foot = "L" | "R";
export function setWorldRotation(bone: T.Bone, q: T.Quaternion) {
  bone.quaternion.copy(
    bone.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(q),
  );
  bone.updateWorldMatrix(false, true);
}
/** Explicit contact markers, not height heuristics. Measures ankle anchor drift, not toe/sole slip. */
export class FootContacts {
  private anchors = new Map<
    Foot,
    { id: string; p: T.Vector3; q: T.Quaternion; previous: T.Vector3 }
  >();
  reset() {
    this.anchors.clear();
  }
  apply(rig: HumanoidRig, markers: Record<Foot, string | null>, dt: number) {
    let drift = 0,
      speed = 0,
      residual = 0,
      count = 0;
    for (const side of ["L", "R"] as const) {
      const foot = rig[`foot${side}`],
        id = markers[side];
      if (id === null) {
        this.anchors.delete(side);
        continue;
      }
      foot.updateWorldMatrix(true, false);
      let anchor = this.anchors.get(side);
      if (anchor?.id !== id) {
        anchor = {
          id,
          p: foot.getWorldPosition(new T.Vector3()),
          q: foot.getWorldQuaternion(new T.Quaternion()),
          previous: foot.getWorldPosition(new T.Vector3()),
        };
        this.anchors.set(side, anchor);
      }
      const error = solveLimb(
        rig[`thigh${side}`],
        rig[`shin${side}`],
        foot,
        anchor.p,
        new T.Vector3(0, 0, 1),
      );
      setWorldRotation(foot, anchor.q);
      const position = foot.getWorldPosition(new T.Vector3());
      drift = Math.max(drift, position.distanceTo(anchor.p));
      if (dt > 0 && dt < 0.2)
        speed = Math.max(speed, position.distanceTo(anchor.previous) / dt);
      anchor.previous.copy(position);
      residual = Math.max(residual, error);
      count++;
    }
    return { drift, speed, residual, count };
  }
}
