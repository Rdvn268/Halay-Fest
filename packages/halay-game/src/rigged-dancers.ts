import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import type { DanceStyle } from "@halay/contracts";
import type { BeatFrame } from "./beat-clock.js";

export const FIGURES: Record<DanceStyle, readonly string[]> = {
  halay: ["halay_ThreeStep", "halay_HeelTap", "halay_CrossStep"],
  horon: ["horon_QuickPulse", "horon_KneeLift", "horon_ShoulderShake"],
  govend: ["govend_SideStep", "govend_HeelLift", "govend_CrossStep"],
  zeybek: ["zeybek_OpenArms", "zeybek_KneeBend", "zeybek_TurnStep"],
};
export function figureAt(frame: BeatFrame) {
  const figures = FIGURES[frame.dance];
  return figures[
    ((Math.floor(frame.bar / 4) % figures.length) + figures.length) %
      figures.length
  ]!;
}
/** Partial outer rings form open chains, preserving reachable hand spacing. */
export function formationFor(count: number) {
  const slots: {
    ring: number;
    angle: number;
    radius: number;
    closed: boolean;
  }[] = [];
  const capacities = [12, 22, 32, 40, 48],
    radii = [3, 5.45, 7.95, 10.4, 12.8];
  let remaining = count;
  for (let ring = 0; ring < capacities.length && remaining > 0; ring++) {
    const n = Math.min(remaining, capacities[ring]!),
      capacity = ring === 0 ? n : capacities[ring]!;
    const radius =
      ring === 0
        ? n === 1
          ? 0
          : 1.55 / (2 * Math.sin(Math.PI / n))
        : radii[ring]!;
    for (let i = 0; i < n; i++)
      slots.push({
        ring,
        angle: (i / capacity) * Math.PI * 2 + (ring % 2 ? 0.15 : 0),
        radius,
        closed: n >= 3 && n === capacity,
      });
    remaining -= n;
  }
  return slots;
}
export interface RigDancer {
  name: string;
  isNpc: boolean;
  group: T.Group;
  model: T.Object3D;
  mesh: T.SkinnedMesh;
  mixer: T.AnimationMixer;
  actions: Map<string, T.AnimationAction>;
  label: T.Sprite;
  glow: T.Mesh<T.TorusGeometry, T.MeshBasicMaterial>;
  bones: Map<string, T.Bone>;
  auraUntil: number;
  crownUntil: number;
  ring: number;
  angle: number;
  target: T.Vector3;
  closed: boolean;
  transitionPose: { bone: T.Bone; q: T.Quaternion; p: T.Vector3 }[] | undefined;
}
function labelFor(text: string, isNpc: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.fillStyle = isNpc ? "#173b3bea" : "#191e31ed";
  ctx.beginPath();
  ctx.roundRect(2, 2, 380, 68, 20);
  ctx.fill();
  ctx.strokeStyle = isNpc ? "#83b7a2" : "#eec78b";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "600 26px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff2dd";
  const caption = isNpc ? `EKİP · ${text.split(" ").at(-1)}` : text;
  ctx.fillText(
    caption.length > 22 ? `${caption.slice(0, 21)}…` : caption,
    192,
    36,
  );
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const sprite = new T.Sprite(
    new T.SpriteMaterial({ map: texture, depthWrite: false, depthTest: false }),
  );
  sprite.scale.set(isNpc ? 1.1 : 1.85, isNpc ? 0.21 : 0.35, 1);
  sprite.position.y = 2.65;
  sprite.renderOrder = 2;
  return sprite;
}
export class RiggedDancers {
  private template: T.Object3D;
  private clips: T.AnimationClip[];
  private geometries: T.BufferGeometry[] = [];
  private material: T.Material;
  private glowGeometry = new T.TorusGeometry(0.42, 0.018, 5, 32);
  private current = "";
  private song = "";
  private handHeight = 1.31;
  private changedAt = 0;
  clip = "";
  handGapMeters = 0;
  static async load() {
    const gltf = await new GLTFLoader().loadAsync(
      "/characters/festival-dancer.glb",
    );
    return new RiggedDancers(gltf.scene, gltf.animations);
  }
  private constructor(template: T.Object3D, clips: T.AnimationClip[]) {
    this.template = template;
    this.clips = clips;
    const meshes: T.SkinnedMesh[] = [];
    template.traverse((o) => {
      if (o instanceof T.SkinnedMesh) meshes.push(o);
    });
    if (
      meshes.length !== 1 ||
      meshes[0]!.skeleton.bones.length !== 17 ||
      clips.length !== 12
    )
      throw new Error(
        "Character asset has an unexpected rig or clip inventory",
      );
    const mesh = meshes[0]!;
    this.material = mesh.material as T.Material;
    const original = mesh.geometry;
    const oldVest = new T.Color("#a82f4a"),
      oldHat = new T.Color("#873849");
    for (const hex of [
      "#a82f4a",
      "#257e77",
      "#345f9e",
      "#b7762f",
      "#694a8f",
      "#49743b",
    ]) {
      const geometry = original.clone(),
        color = geometry.getAttribute("color"),
        replacement = new T.Color(hex);
      for (let i = 0; i < color.count; i++) {
        const r = color.getX(i),
          g = color.getY(i),
          b = color.getZ(i);
        if (
          Math.abs(r - oldVest.r) +
            Math.abs(g - oldVest.g) +
            Math.abs(b - oldVest.b) <
            0.02 ||
          Math.abs(r - oldHat.r) +
            Math.abs(g - oldHat.g) +
            Math.abs(b - oldHat.b) <
            0.02
        )
          color.setXYZ(i, replacement.r, replacement.g, replacement.b);
      }
      this.geometries.push(geometry);
    }
    original.dispose();
  }
  make(name: string, isNpc: boolean, index: number, scene: T.Scene): RigDancer {
    const model = clone(this.template);
    const group = new T.Group();
    group.add(model);
    scene.add(group);
    let mesh: T.SkinnedMesh | undefined;
    const bones = new Map<string, T.Bone>();
    model.traverse((o) => {
      if (o instanceof T.Bone) bones.set(o.name, o);
      if (o instanceof T.SkinnedMesh) {
        mesh = o;
        o.geometry = this.geometries[index % this.geometries.length]!;
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    if (!mesh) throw new Error("Missing skin");
    const mixer = new T.AnimationMixer(model),
      actions = new Map<string, T.AnimationAction>();
    for (const clip of this.clips) {
      const action = mixer.clipAction(clip);
      action.play();
      action.paused = true;
      action.enabled = false;
      actions.set(clip.name, action);
    }
    const label = labelFor(name, isNpc);
    group.add(label);
    const glow = new T.Mesh(
      this.glowGeometry,
      new T.MeshBasicMaterial({
        color: "#ffd083",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.022;
    group.add(glow);
    return {
      name,
      isNpc,
      group,
      model,
      mesh,
      mixer,
      actions,
      label,
      glow,
      bones,
      auraUntil: 0,
      crownUntil: 0,
      ring: 0,
      angle: 0,
      target: new T.Vector3(),
      closed: false,
      transitionPose: undefined,
    };
  }
  remove(dancer: RigDancer) {
    dancer.mixer.stopAllAction();
    dancer.mixer.uncacheRoot(dancer.model);
    dancer.mesh.skeleton.dispose();
    (dancer.label.material as T.SpriteMaterial).map?.dispose();
    dancer.label.material.dispose();
    dancer.glow.material.dispose();
    dancer.group.removeFromParent();
  }
  layout(dancers: RigDancer[]) {
    const slots = formationFor(dancers.length);
    dancers.forEach((d, i) => {
      const slot = slots[i]!;
      d.ring = slot.ring;
      d.angle = slot.angle;
      d.closed = slot.closed;
      d.target.set(
        Math.cos(slot.angle) * slot.radius,
        0,
        Math.sin(slot.angle) * slot.radius,
      );
    });
  }
  update(
    dancers: RigDancer[],
    frame: BeatFrame,
    elapsed: number,
    dt: number,
    song: string,
  ) {
    const clip = figureAt(frame);
    if (clip !== this.current || song !== this.song) {
      for (const d of dancers)
        d.transitionPose = [...d.bones.values()].map((bone) => ({
          bone,
          q: bone.quaternion.clone(),
          p: bone.position.clone(),
        }));
      this.current = clip;
      this.song = song;
      this.changedAt = elapsed;
    }
    this.clip = clip;
    const mix = T.MathUtils.smoothstep(elapsed - this.changedAt, 0, 0.35);
    for (const d of dancers) {
      d.group.position.lerp(d.target, Math.min(1, dt * 4));
      d.group.rotation.y = -d.angle - Math.PI / 2;
      // Every action is evaluated at the same audio phase, including newly joined players.
      for (const [name, action] of d.actions) {
        const weight = name === this.current ? 1 : 0;
        action.enabled = weight > 0;
        action.setEffectiveWeight(weight);
        action.time = frame.barPhase;
      }
      d.mixer.update(0);
      if (d.transitionPose) {
        for (const { bone, q, p } of d.transitionPose) {
          bone.quaternion.slerpQuaternions(q, bone.quaternion, mix);
          bone.position.lerpVectors(p, bone.position, mix);
        }
        if (mix === 1) d.transitionPose = undefined;
      }
      d.group.updateMatrixWorld(true);
      d.glow.material.opacity = d.auraUntil > elapsed ? 0.75 : 0;
      d.label.material.color.set(
        d.crownUntil > elapsed ? "#ffe087" : "#ffffff",
      );
      // Only the inner ring casts character shadows in large crowds; all skins animate.
      d.mesh.castShadow = dancers.length <= 30 || d.ring === 0;
    }
    this.handGapMeters = 0;
    this.handHeight = T.MathUtils.damp(
      this.handHeight,
      frame.dance === "horon" ? 1.44 : 1.31,
      10,
      dt,
    );
    if (frame.dance === "zeybek") return; // Open-arm solo style has no linked-hand constraint.
    for (let ring = 0; ring < 5; ring++) {
      const group = dancers.filter((d) => d.ring === ring);
      if (group.length < 2) continue;
      for (let i = 0; i < group.length - (group[0]!.closed ? 0 : 1); i++) {
        const d = group[i]!,
          next = group[(i + 1) % group.length]!;
        // +X is tangent in this inward-facing rig; neighboring palms share a world-space target.
        const target = d.group.position
          .clone()
          .add(next.group.position)
          .multiplyScalar(0.5);
        target.y =
          this.handHeight + Math.sin(frame.phase * Math.PI * 2) * 0.045;
        this.solveArm(d, "L", target);
        this.solveArm(next, "R", target);
        const a = d.bones.get("Hand_L")!.getWorldPosition(new T.Vector3());
        const b = next.bones.get("Hand_R")!.getWorldPosition(new T.Vector3());
        this.handGapMeters = Math.max(this.handGapMeters, a.distanceTo(b));
      }
    }
  }
  private solveArm(d: RigDancer, side: "L" | "R", target: T.Vector3) {
    const upper = d.bones.get(`UpperArm_${side}`)!,
      fore = d.bones.get(`Forearm_${side}`)!;
    const start = upper.getWorldPosition(new T.Vector3()),
      delta = target.clone().sub(start);
    const distance = T.MathUtils.clamp(delta.length(), 0.025, 0.619),
      direction = delta.normalize();
    const bend = new T.Vector3(0, -1, 0.25)
      .addScaledVector(direction, -new T.Vector3(0, -1, 0.25).dot(direction))
      .normalize();
    const along =
      (0.32 * 0.32 - 0.3 * 0.3 + distance * distance) / (2 * distance);
    const elbow = start
      .clone()
      .addScaledVector(direction, along)
      .addScaledVector(
        bend,
        Math.sqrt(Math.max(0, 0.32 * 0.32 - along * along)),
      );
    const axis = new T.Vector3(side === "L" ? 1 : -1, 0, 0);
    const rotate = (bone: T.Bone, toward: T.Vector3) => {
      const parentQ = bone
        .parent!.getWorldQuaternion(new T.Quaternion())
        .invert();
      const desired = toward
        .sub(bone.getWorldPosition(new T.Vector3()))
        .normalize()
        .applyQuaternion(parentQ);
      bone.quaternion.setFromUnitVectors(axis, desired);
      bone.updateWorldMatrix(false, true);
    };
    rotate(upper, elbow);
    rotate(fore, target.clone());
  }
  labels(
    dancers: RigDancer[],
    camera: T.Camera,
    width: number,
    height: number,
  ) {
    const occupied: { x: number; y: number; w: number; h: number }[] = [];
    const candidates = [...dancers].sort(
      (a, b) =>
        a.group.position.distanceToSquared(camera.position) -
        b.group.position.distanceToSquared(camera.position),
    );
    for (const d of candidates) {
      d.label.visible = false;
      d.label.position.y = 2.65;
      if (occupied.length >= 24) continue;
      for (const rise of [0, 0.32, 0.64]) {
        d.label.position.y = 2.65 + rise;
        d.label.updateWorldMatrix(true, false);
        const pos = d.label.getWorldPosition(new T.Vector3()).project(camera);
        if (
          pos.z > 1 ||
          pos.z < -1 ||
          Math.abs(pos.x) > 1 ||
          Math.abs(pos.y) > 0.67
        )
          continue;
        const edge = d.label
          .getWorldPosition(new T.Vector3())
          .add(
            new T.Vector3(d.label.scale.x / 2, 0, 0).applyQuaternion(
              camera.quaternion,
            ),
          )
          .project(camera);
        const w = Math.max(52, Math.abs(edge.x - pos.x) * width * 1.2),
          h = Math.max(13, w * 0.19);
        const box = {
          x: ((pos.x + 1) * width) / 2 - w / 2,
          y: ((1 - pos.y) * height) / 2 - h / 2,
          w,
          h,
        };
        if (
          occupied.some(
            (b) =>
              box.x < b.x + b.w + 4 &&
              box.x + box.w + 4 > b.x &&
              box.y < b.y + b.h + 3 &&
              box.y + box.h + 3 > b.y,
          )
        )
          continue;
        occupied.push(box);
        d.label.visible = true;
        break;
      }
    }
    return occupied.length;
  }
  dispose() {
    for (const g of this.geometries) g.dispose();
    this.material.dispose();
    this.glowGeometry.dispose();
  }
}
