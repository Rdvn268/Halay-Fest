/** Original HALAY FEST mesh, skin and motion asset. No downloaded model/mocap.
 * Run: node --import=tsx scripts/create-character.ts
 * The source is the editable asset; the GLB is a reproducible runtime artifact.
 */
import * as T from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

class BinaryReader {
  result: ArrayBuffer | string | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then((data) => {
      this.result = data;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then((data) => {
      this.result = `data:${blob.type};base64,${Buffer.from(data).toString("base64")}`;
      this.onloadend?.();
    });
  }
}
Object.assign(globalThis, { FileReader: BinaryReader });

const bones: T.Bone[] = [];
function bone(
  name: string,
  parent: number | null,
  x: number,
  y: number,
  z = 0,
) {
  const b = new T.Bone();
  b.name = name;
  b.position.set(x, y, z);
  if (parent !== null) bones[parent]!.add(b);
  bones.push(b);
  return bones.length - 1;
}
const hips = bone("Hips", null, 0, 1.01);
const spine = bone("Spine", hips, 0, 0.22);
const chest = bone("Chest", spine, 0, 0.24);
const neck = bone("Neck", chest, 0, 0.24);
const head = bone("Head", neck, 0, 0.17);
const armL = bone("UpperArm_L", chest, 0.28, 0.14);
const elbowL = bone("Forearm_L", armL, 0.32, 0);
const handL = bone("Hand_L", elbowL, 0.3, 0);
const armR = bone("UpperArm_R", chest, -0.28, 0.14);
const elbowR = bone("Forearm_R", armR, -0.32, 0);
const handR = bone("Hand_R", elbowR, -0.3, 0);
const thighL = bone("Thigh_L", hips, 0.16, 0);
const shinL = bone("Shin_L", thighL, 0, -0.45);
const footL = bone("Foot_L", shinL, 0, -0.43, 0.04);
const thighR = bone("Thigh_R", hips, -0.16, 0);
const shinR = bone("Shin_R", thighR, 0, -0.45);
const footR = bone("Foot_R", shinR, 0, -0.43, 0.04);
bones[0]!.updateMatrixWorld(true);
const palette = {
  linen: "#f2dfb5",
  vest: "#a82f4a",
  trim: "#edbb62",
  pants: "#263e51",
  sash: "#ce7141",
  skin: "#dca47c",
  boot: "#382d31",
  hair: "#2c2730",
  eye: "#211c29",
  white: "#fff5dd",
  hat: "#873849",
};
type Surface = keyof typeof palette;
const parts = new Map<Surface, T.BufferGeometry[]>();
function skinGeometry(
  g: T.BufferGeometry,
  weights: (point: T.Vector3) => [number, number, number],
) {
  if (g.index) g = g.toNonIndexed();
  const indices: number[] = [],
    influence: number[] = [];
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const [a, b, t] = weights(new T.Vector3().fromBufferAttribute(p, i));
    indices.push(a, b, 0, 0);
    influence.push(1 - t, t, 0, 0);
  }
  g.setAttribute("skinIndex", new T.Uint16BufferAttribute(indices, 4));
  g.setAttribute("skinWeight", new T.Float32BufferAttribute(influence, 4));
  return g;
}
function add(
  g: T.BufferGeometry,
  surface: Surface,
  weights: number | ((p: T.Vector3) => [number, number, number]),
) {
  const geometries = parts.get(surface) ?? [];
  parts.set(surface, geometries);
  geometries.push(
    skinGeometry(
      g,
      typeof weights === "number" ? () => [weights, weights, 0] : weights,
    ),
  );
}
function ellipsoid(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
  surface: Surface,
  joint: number,
) {
  add(
    new T.SphereGeometry(1, 12, 8).scale(rx, ry, rz).translate(x, y, z),
    surface,
    joint,
  );
}
// Tailored elliptical cross sections produce continuous shoulders, waist and draped trousers.
function sweep(
  rings: [number, number, number, number, number][],
  surface: Surface,
  weights: number | ((p: T.Vector3) => [number, number, number]),
) {
  const vertices: number[] = [],
    uv: number[] = [],
    indices: number[] = [],
    n = 12;
  for (let r = 0; r < rings.length; r++) {
    const [x, y, z, rx, rz] = rings[r]!;
    for (let j = 0; j <= n; j++) {
      const a = (j / n) * Math.PI * 2;
      vertices.push(x + Math.cos(a) * rx, y, z + Math.sin(a) * rz);
      uv.push(j / n, r / (rings.length - 1));
    }
  }
  for (let r = 0; r < rings.length - 1; r++)
    for (let j = 0; j < n; j++) {
      const a = r * (n + 1) + j,
        b = a + n + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  // Closed ends with smooth side normals; a small central cap avoids open cloth.
  for (const r of [0, rings.length - 1]) {
    const [x, y, z] = rings[r]!;
    const c = vertices.length / 3;
    vertices.push(x, y, z);
    uv.push(0.5, 0.5);
    for (let j = 0; j < n; j++) {
      const a = r * (n + 1) + j;
      indices.push(...(r === 0 ? [c, a, a + 1] : [c, a + 1, a]));
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  add(g, surface, weights);
}
const torsoWeight = (p: T.Vector3): [number, number, number] => [
  spine,
  chest,
  T.MathUtils.clamp((p.y - 1.15) / 0.4, 0, 1),
];
sweep(
  [
    [0, 1.02, 0, 0.25, 0.16],
    [0, 1.15, 0, 0.23, 0.15],
    [0, 1.37, 0, 0.29, 0.18],
    [0, 1.57, 0, 0.32, 0.17],
    [0, 1.66, 0, 0.2, 0.13],
  ],
  "linen",
  torsoWeight,
);
// Two open vest panels, decorative piping and embroidered brass discs.
for (const s of [-1, 1]) {
  ellipsoid(s * 0.19, 1.4, -0.01, 0.13, 0.25, 0.185, "vest", chest);
  for (let y = 1.22; y < 1.6; y += 0.075)
    ellipsoid(s * 0.13, y, 0.176, 0.018, 0.025, 0.012, "trim", chest);
  ellipsoid(s * 0.2, 1.54, 0.17, 0.055, 0.025, 0.018, "trim", chest);
}
sweep(
  [
    [0, 1.0, 0, 0.26, 0.17],
    [0, 1.08, 0, 0.27, 0.18],
    [0, 1.15, 0, 0.25, 0.16],
  ],
  "sash",
  hips,
);
ellipsoid(0.22, 0.92, 0.13, 0.055, 0.2, 0.035, "sash", hips);
for (const [sign, thigh, shin, foot, upper, fore, hand] of [
  [1, thighL, shinL, footL, armL, elbowL, handL],
  [-1, thighR, shinR, footR, armR, elbowR, handR],
]) {
  sweep(
    [
      [sign! * 0.16, 0.18, 0, 0.075, 0.09],
      [sign! * 0.16, 0.38, 0, 0.13, 0.14],
      [sign! * 0.17, 0.67, 0, 0.18, 0.19],
      [sign! * 0.16, 0.94, 0, 0.18, 0.17],
      [sign! * 0.16, 1.03, 0, 0.12, 0.12],
    ],
    "pants",
    (p) => [thigh!, shin!, T.MathUtils.clamp((0.73 - p.y) / 0.34, 0, 1)],
  );
  ellipsoid(sign! * 0.16, 0.115, 0.08, 0.1, 0.115, 0.21, "boot", foot!);
  ellipsoid(sign! * 0.16, 0.235, 0.015, 0.095, 0.13, 0.115, "boot", shin!);
  // T-pose sleeves run horizontally; sphere coordinates retain connected skin weights at elbow.
  const g = new T.CapsuleGeometry(0.1, 0.43, 3, 8)
    .rotateZ(Math.PI / 2)
    .translate(sign! * 0.51, 1.61, 0);
  add(g, "linen", (p) => [
    upper!,
    fore!,
    T.MathUtils.clamp((Math.abs(p.x) - 0.48) / 0.22, 0, 1),
  ]);
  ellipsoid(sign! * 0.9, 1.61, 0, 0.13, 0.078, 0.08, "skin", hand!);
  ellipsoid(sign! * 0.88, 1.56, 0.055, 0.065, 0.04, 0.048, "skin", hand!);
  ellipsoid(sign! * 0.65, 1.61, 0, 0.035, 0.11, 0.105, "trim", fore!);
}
ellipsoid(0, 1.76, 0, 0.1, 0.16, 0.1, "skin", neck);
ellipsoid(0, 1.99, 0.005, 0.215, 0.265, 0.195, "skin", head);
for (const s of [-1, 1]) {
  ellipsoid(s * 0.212, 1.98, 0, 0.047, 0.075, 0.047, "skin", head);
  ellipsoid(s * 0.08, 2.025, 0.18, 0.044, 0.032, 0.022, "white", head);
  ellipsoid(s * 0.08, 2.025, 0.198, 0.018, 0.022, 0.009, "eye", head);
  ellipsoid(s * 0.083, 2.09, 0.17, 0.058, 0.014, 0.022, "hair", head);
}
ellipsoid(0, 1.99, 0.197, 0.038, 0.06, 0.048, "skin", head);
ellipsoid(0, 1.9, 0.178, 0.068, 0.012, 0.021, "hair", head);
ellipsoid(0, 2.16, -0.022, 0.221, 0.15, 0.198, "hair", head);
ellipsoid(0, 2.25, 0, 0.24, 0.09, 0.215, "hat", head);
sweep(
  [
    [0, 2.18, 0, 0.233, 0.205],
    [0, 2.205, 0, 0.242, 0.214],
    [0, 2.225, 0, 0.233, 0.205],
  ],
  "trim",
  head,
);

const scene = new T.Scene();
const model = new T.Group();
model.name = "FestivalDancer";
model.userData = {
  provenance: "Original HALAY FEST authored parametric skin and keyframes",
  license: "CC0-1.0",
  source: "scripts/create-character.ts",
};
scene.add(model);
const skeleton = new T.Skeleton(bones);
const colored: T.BufferGeometry[] = [];
for (const [name, geometries] of parts) {
  const geometry = mergeGeometries(geometries, false)!;
  const color = new T.Color(palette[name]);
  const colors: number[] = [];
  for (let i = 0; i < geometry.getAttribute("position").count; i++)
    colors.push(color.r, color.g, color.b);
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  colored.push(geometry);
}
const mesh = new T.SkinnedMesh(
  mergeGeometries(colored, false)!,
  new T.MeshStandardMaterial({
    name: "EmbroideredCostume",
    vertexColors: true,
    roughness: 0.84,
  }),
);
mesh.name = "FestivalSkin";
mesh.add(bones[0]!);
model.add(mesh);
mesh.bind(skeleton);
mesh.frustumCulled = false;
// Authored one-measure motion loops. BPM comes from the audio clock at runtime.
// They are stylized first-party choreography studies, not captured folk-dance performances.
const clips: T.AnimationClip[] = [];
for (const style of ["halay", "horon", "govend", "zeybek"] as const)
  for (let figure = 0; figure < 3; figure++) {
    const tracks: T.KeyframeTrack[] = [];
    const times = Array.from({ length: 33 }, (_, i) => i / 32);
    const rotations = new Map<string, number[]>();
    const positions: number[] = [];
    for (const t of times) {
      const phase = t * Math.PI * 2;
      const fast = style === "horon";
      const slow = style === "zeybek";
      const steps = fast ? 4 : slow ? 1 : 2;
      const pulse = Math.sin(phase * steps);
      const left = Math.max(0, Math.sin(phase * (fast ? 2 : 1)));
      const right = Math.max(0, -Math.sin(phase * (fast ? 2 : 1)));
      const kick = figure === 1 ? 0.42 : 0.23;
      const values: Record<string, [number, number, number]> = {
        Hips: [
          fast ? 0.1 : 0.025,
          Math.sin(phase) * 0.07,
          pulse * (fast ? 0.035 : 0.02),
        ],
        Spine: [fast ? 0.06 : 0, Math.sin(phase) * 0.035, pulse * 0.025],
        Chest: [0, Math.sin(phase) * 0.025, -pulse * 0.02],
        Head: [Math.sin(phase) * 0.025, -Math.sin(phase) * 0.03, 0],
        Thigh_L: [
          left * (slow ? 0.6 : kick),
          0,
          left * (figure === 2 ? 0.14 : 0.04),
        ],
        Shin_L: [-left * (slow ? 0.68 : fast ? 0.3 : 0.37), 0, 0],
        Foot_L: [left * 0.12, 0, 0],
        Thigh_R: [
          right * (slow ? 0.6 : kick),
          0,
          -right * (figure === 2 ? 0.14 : 0.04),
        ],
        Shin_R: [-right * (slow ? 0.68 : fast ? 0.3 : 0.37), 0, 0],
        Foot_R: [right * 0.12, 0, 0],
        UpperArm_L: [0, 0, slow ? 0.35 : -0.35 + Math.sin(phase) * 0.12],
        UpperArm_R: [0, 0, slow ? -0.35 : 0.35 - Math.sin(phase) * 0.12],
        Forearm_L: [0, slow ? -0.2 : 0.1, fast ? 0.22 : 0.15],
        Forearm_R: [0, slow ? 0.2 : -0.1, fast ? -0.22 : -0.15],
      };
      for (const [name, euler] of Object.entries(values)) {
        const q = new T.Quaternion().setFromEuler(new T.Euler(...euler));
        const array = rotations.get(name) ?? [];
        array.push(q.x, q.y, q.z, q.w);
        rotations.set(name, array);
      }
      positions.push(
        Math.sin(phase) * (slow ? 0.04 : 0.015),
        1.01 + Math.abs(pulse) * (fast ? 0.025 : slow ? 0.012 : 0.045),
        0,
      );
    }
    tracks.push(new T.VectorKeyframeTrack("Hips.position", times, positions));
    for (const [name, values] of rotations)
      tracks.push(
        new T.QuaternionKeyframeTrack(`${name}.quaternion`, times, values),
      );
    const names = {
      halay: ["ThreeStep", "HeelTap", "CrossStep"],
      horon: ["QuickPulse", "KneeLift", "ShoulderShake"],
      govend: ["SideStep", "HeelLift", "CrossStep"],
      zeybek: ["OpenArms", "KneeBend", "TurnStep"],
    };
    clips.push(
      new T.AnimationClip(`${style}_${names[style][figure]}`, 1, tracks),
    );
  }
scene.updateMatrixWorld(true);
const binary = await new GLTFExporter().parseAsync(scene, {
  binary: true,
  animations: clips,
  onlyVisible: true,
});
if (!(binary instanceof ArrayBuffer)) throw new Error("Expected binary GLB");
const directory = resolve("apps/broadcaster/public/characters");
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, "festival-dancer.glb"), Buffer.from(binary));
await writeFile(
  resolve(directory, "festival-dancer.manifest.json"),
  JSON.stringify(
    {
      path: "festival-dancer.glb",
      sha256: createHash("sha256").update(Buffer.from(binary)).digest("hex"),
      source: "scripts/create-character.ts",
      generatorSha256: createHash("sha256")
        .update(await readFile(new URL(import.meta.url)))
        .digest("hex"),
      license: "CC0-1.0",
      thirdPartyModels: [],
      bones: bones.length,
      clips: clips.map((c) => c.name),
      bytes: binary.byteLength,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    bytes: binary.byteLength,
    bones: bones.length,
    clips: clips.map((c) => c.name),
    triangles: [...parts.values()]
      .flat()
      .reduce((n, g) => n + g.getAttribute("position").count / 3, 0),
  }),
);
