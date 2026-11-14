/** Original engineering contact studies, NOT mocap, NOT accepted/regional Halay figures.
 * Explicit foot waypoints make contact/retarget/blend faults observable without disguising sine motion.
 * Replace studies with licensed performance clips before cultural/production approval.
 */
import * as T from "three";
import { bindHumanoid, solveLimb } from "./rig.js";
import type { RigMap } from "./rig.js";
import { setWorldRotation } from "./contact.js";

export interface ContactStudy {
  id: string;
  label: string;
  beats: number;
  clip: T.AnimationClip;
  rootAt: (phase: number) => T.Vector3;
  contactsAt: (
    phase: number,
    cycle: number,
  ) => Record<"L" | "R", string | null>;
  provenance: {
    kind: string;
    license: string;
    regionalApproval: false;
  };
}
export function bakeContactStudy(
  model: T.Object3D,
  map: RigMap,
  kind: 0 | 1,
): ContactStudy {
  const rig = bindHumanoid(model, map),
    bones: T.Bone[] = [];
  model.traverse((o) => {
    if (o instanceof T.Bone) bones.push(o);
  });
  model.updateMatrixWorld(true);
  const saved = bones.map((b) => ({
    b,
    p: b.position.clone(),
    q: b.quaternion.clone(),
  }));
  const left = rig.footL.getWorldPosition(new T.Vector3()),
    right = rig.footR.getWorldPosition(new T.Vector3());
  const restQ = {
    L: rig.footL.getWorldQuaternion(new T.Quaternion()),
    R: rig.footR.getWorldQuaternion(new T.Quaternion()),
  };
  type Step = { side: "L" | "R"; start: number; end: number; to: T.Vector3 };
  const steps: Step[] =
    kind === 0
      ? [
          {
            side: "L",
            start: 0,
            end: 1,
            to: left.clone().add(new T.Vector3(0.28, 0, 0)),
          },
          {
            side: "R",
            start: 1,
            end: 2,
            to: right.clone().add(new T.Vector3(0.28, 0, 0)),
          },
          { side: "R", start: 4, end: 5, to: right.clone() },
          { side: "L", start: 5, end: 6, to: left.clone() },
        ]
      : [
          {
            side: "L",
            start: 0,
            end: 1,
            to: right.clone().add(new T.Vector3(-0.08, 0, 0.12)),
          },
          {
            side: "R",
            start: 1,
            end: 2,
            to: right.clone().add(new T.Vector3(-0.28, 0, 0)),
          },
          {
            side: "L",
            start: 2,
            end: 3,
            to: left.clone().add(new T.Vector3(-0.28, 0, 0)),
          },
          {
            side: "L",
            start: 4,
            end: 5,
            to: right.clone().add(new T.Vector3(-0.08, 0, 0.12)),
          },
          { side: "R", start: 5, end: 6, to: right.clone() },
          { side: "L", start: 6, end: 7, to: left.clone() },
        ];
  const ease = (t: number) => t * t * (3 - 2 * t);
  const footAt = (side: "L" | "R", beat: number) => {
    const p = (side === "L" ? left : right).clone();
    let marker = 0;
    for (const step of steps.filter((s) => s.side === side)) {
      if (beat >= step.end) {
        p.copy(step.to);
        marker++;
        continue;
      }
      if (beat > step.start) {
        const t = (beat - step.start) / (step.end - step.start);
        p.lerp(step.to, ease(t));
        p.y += 0.09 * (1 - Math.abs(2 * t - 1));
        return { p, marker: null };
      }
      break;
    }
    return { p, marker };
  };
  const rootAt = (phase: number) => {
    const a = footAt("L", phase * 8).p,
      b = footAt("R", phase * 8).p;
    return new T.Vector3(
      (a.x + b.x - left.x - right.x) / 2,
      0,
      (a.z + b.z - left.z - right.z) / 2,
    );
  };
  const times: number[] = [],
    values = bones.map(() => [] as number[]),
    hips: number[] = [];
  try {
    for (let i = 0; i <= 240; i++) {
      const phase = i / 240,
        beat = phase * 8;
      times.push(phase * 4);
      for (const s of saved) {
        s.b.position.copy(s.p);
        s.b.quaternion.copy(s.q);
      }
      model.updateMatrixWorld(true);
      const root = rootAt(phase);
      // Lower the pelvis slightly to provide bend/reach margin; no oscillator or fake mocap.
      const hipWorld = rig.hips.getWorldPosition(new T.Vector3());
      hipWorld.y -= 0.045;
      rig.hips.position.copy(rig.hips.parent!.worldToLocal(hipWorld));
      model.updateMatrixWorld(true);
      for (const side of ["L", "R"] as const) {
        const target = footAt(side, beat).p.sub(root);
        solveLimb(
          rig[`thigh${side}`],
          rig[`shin${side}`],
          rig[`foot${side}`],
          target,
          new T.Vector3(0, 0, 1),
        );
        setWorldRotation(rig[`foot${side}`], restQ[side]);
      }
      bones.forEach((b, j) => values[j]!.push(...b.quaternion.toArray()));
      hips.push(...rig.hips.position.toArray());
    }
  } finally {
    for (const s of saved) {
      s.b.position.copy(s.p);
      s.b.quaternion.copy(s.q);
    }
    model.updateMatrixWorld(true);
  }
  const id = kind === 0 ? "study_lateral_transfer" : "study_cross_contact";
  return {
    id,
    label:
      kind === 0
        ? "Yan ağırlık aktarımı · teknik çalışma"
        : "Çapraz temas · teknik çalışma",
    beats: 8,
    clip: new T.AnimationClip(id, 4, [
      ...bones.map(
        (b, i) =>
          new T.QuaternionKeyframeTrack(
            `${b.name}.quaternion`,
            times,
            values[i]!,
          ),
      ),
      new T.VectorKeyframeTrack(`${map.hips}.position`, times, hips),
    ]),
    rootAt,
    contactsAt: (phase, cycle) =>
      Object.fromEntries(
        (["L", "R"] as const).map((s) => {
          const m = footAt(s, phase * 8).marker;
          return [s, m === null ? null : `${id}:${cycle}:${s}:${m}`];
        }),
      ) as Record<"L" | "R", string | null>,
    provenance: {
      kind: "authored-technical-study",
      license: "CC0-1.0",
      regionalApproval: false,
    },
  };
}
