// Original village extended with first-party paving, plaster, tiles and festival details.
import * as THREE from "three";
import { createGeometry, colors } from "./geometry.js";
function surface(kind: "stone" | "roof" | "plaster") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const c = canvas.getContext("2d")!;
  let seed = 521;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  c.fillStyle =
    kind === "stone" ? "#847969" : kind === "roof" ? "#6b342c" : "#c4af8d";
  c.fillRect(0, 0, 512, 512);
  if (kind === "plaster") {
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = `rgba(255,245,215,${random() * 0.16})`;
      c.fillRect(random() * 512, random() * 512, 3, 2);
    }
  } else {
    const w = kind === "stone" ? 64 : 32,
      h = kind === "stone" ? 40 : 64;
    for (let row = -1; row < 512 / h; row++)
      for (let col = -1; col < 512 / w; col++) {
        const v = random();
        c.fillStyle =
          kind === "stone"
            ? `hsl(35 14% ${55 + v * 18}%)`
            : `hsl(${12 + v * 7} 40% ${29 + v * 14}%)`;
        c.beginPath();
        c.roundRect(
          col * w + ((row % 2) * w) / 2 + 2,
          row * h + 2,
          w - 4,
          h - 4,
          kind === "stone" ? 6 : 8,
        );
        c.fill();
        c.strokeStyle = "rgba(255,238,195,.17)";
        c.lineWidth = 1;
        c.stroke();
      }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    kind === "stone" ? 5 : kind === "roof" ? 2 : 1,
    kind === "stone" ? 5 : kind === "roof" ? 2 : 1,
  );
  texture.anisotropy = 4;
  return texture;
}
export function buildEnvironment(scene: THREE.Scene) {
  const { box, cylinder, sphere } = createGeometry(scene);
  const mat = (hex: THREE.ColorRepresentation) =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: 0.83 });
  scene.add(new THREE.HemisphereLight("#b3c9eb", "#605c56", 1.6));
  const sun = new THREE.DirectionalLight("#ffce96", 2.4);
  sun.position.set(-11, 24, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -27;
  sun.shadow.camera.right = 27;
  sun.shadow.camera.top = 27;
  sun.shadow.camera.bottom = -27;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#a1b9ed", 0.9);
  fill.position.set(15, 8, -12);
  scene.add(fill);
  const paving = surface("stone"),
    plaster = surface("plaster"),
    tiles = surface("roof");
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    mat("#708d71"),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const circle = new THREE.Mesh(
    new THREE.CylinderGeometry(11.1, 11.5, 0.3, 64),
    new THREE.MeshStandardMaterial({
      color: "#c3b6a0",
      map: paving,
      roughness: 0.96,
    }),
  );
  circle.position.y = 0.05;
  circle.receiveShadow = true;
  scene.add(circle);
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(8.4, 8.4, 0.31, 64),
    new THREE.MeshStandardMaterial({
      color: "#e6dac2",
      map: paving,
      roughness: 0.94,
    }),
  );
  inner.position.y = 0.065;
  inner.receiveShadow = true;
  scene.add(inner);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(9.4, 0.07, 8, 90),
    mat("#f0dfbb"),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.28;
  scene.add(ring);
  function buildHouse(x: number, z: number, rot: number, paint: string) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    const wall = box(0, 1.6, 0, 4, 3.2, 3.5, paint, g);
    (wall.material as THREE.MeshStandardMaterial).map = plaster;
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 2.35, 4, 1),
      new THREE.MeshStandardMaterial({
        color: "#e6a88b",
        map: tiles,
        roughness: 0.9,
      }),
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.2;
    roof.castShadow = true;
    g.add(roof);
    box(0, 1.04, 1.76, 0.85, 2.1, 0.09, "#694936", g);
    for (const xx of [-1.28, 1.28]) {
      box(xx, 2.15, 1.77, 0.73, 0.75, 0.1, "#e0eec8", g);
      box(xx, 2.15, 1.84, 0.11, 0.85, 0.1, "#926b4b", g);
      box(xx, 2.15, 1.86, 0.85, 0.07, 0.12, "#6a4a37", g);
      box(xx, 1.72, 1.9, 1, 0.13, 0.33, "#8a6342", g);
      for (const offset of [-0.29, 0.29])
        box(xx + offset, 2.15, 1.83, 0.08, 0.87, 0.14, "#6a4a37", g);
    }
    for (let i = 0; i < 5; i++)
      box(-0.32 + i * 0.16, 1.05, 1.82, 0.025, 1.98, 0.02, "#4a342c", g);
    box(0, 0.13, 1.75, 1.5, 0.25, 1.2, "#bda18c", g);
  }
  buildHouse(-17, -12, -0.18, "#f1ce95");
  buildHouse(17, -12, 0.13, "#eed9c8");
  buildHouse(-19, 6, 1.0, "#b9c9a5");
  buildHouse(20, 7, -1.2, "#f4d9a3");
  function tree(x: number, z: number, size = 1) {
    const trunk = cylinder(0.26, 0.38, 2.3 * size, "#866d50");
    trunk.position.set(x, 1.2 * size, z);
    for (let i = 0; i < 3; i++) {
      const crown = sphere(
        (1.45 - i * 0.18) * size,
        i % 2 ? "#4b8c6c" : "#5b9e6f",
      );
      crown.scale.y = 0.9;
      crown.position.set(x + 0.2 * (i - 1) * size, (2.3 + i * 0.85) * size, z);
    }
  }
  for (const [x, z, s] of [
    [-12, 9, 1.2],
    [14, 11, 1.1],
    [-20, -6, 1],
    [22, -3, 1.15],
    [4, -19, 0.9],
    [-5, -20, 0.95],
    [18, 20, 1.1],
    [-19, 20, 1],
  ] as const)
    tree(x, z, s);
  function flag(x: number, z: number, color: string) {
    const pole = cylinder(0.06, 0.06, 5.8, "#e7dbc3");
    pole.position.set(x, 2.9, z);
    const cloth = box(x + 0.53, 5.2, z, 1.1, 0.65, 0.05, color);
    cloth.rotation.z = 0.07;
  }
  for (let i = 0; i < 10; i++) {
    const t = (i / 10) * Math.PI * 2;
    flag(14 * Math.cos(t), 14 * Math.sin(t), colors[i % colors.length]!);
  }
  const stage = new THREE.Group();
  stage.position.set(0, 0, -18);
  scene.add(stage);
  box(0, 0.5, 0, 9, 1, 4, "#846146", stage);
  box(0, 4, -1.5, 10, 7, 0.3, "#7b483b", stage);
  box(0, 7.1, -0.7, 11, 0.5, 4.2, "#bd6045", stage);
  for (const x of [-4.4, 4.4]) {
    box(x, 2.4, 1.5, 0.25, 4.8, 0.25, "#e7cc94", stage);
  }
  // A decorative davul on the stage; no unrigged block musicians remain.
  const drum = cylinder(0.72, 0.72, 0.55, "#d9b06b", stage);
  drum.rotation.x = Math.PI / 2;
  drum.position.set(0, 1.7, 0.3);
  for (const z of [0.01, 0.59]) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.73, 0.04, 6, 32),
      mat("#674c3c"),
    );
    rim.position.set(0, 1.7, z);
    stage.add(rim);
  }
  // Suspended festival lights and pennants, using a small fixed light budget.
  for (const z of [-10, 9]) {
    const points = Array.from({ length: 33 }, (_, i) => {
      const x = -14 + (i * 28) / 32;
      return new THREE.Vector3(x, 11 + Math.pow(x / 14, 2) * 1.8, z);
    });
    const cord = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        32,
        0.018,
        4,
        false,
      ),
      mat("#322e32"),
    );
    scene.add(cord);
    for (const x of [-14, 14]) {
      const support = cylinder(0.06, 0.1, 12.8, "#674c3c");
      support.position.set(x, 6.4, z);
    }
    for (let i = 0; i < 15; i++) {
      const x = -13 + (i * 26) / 14,
        y = 11 + Math.pow(x / 14, 2) * 1.8;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 8, 6),
        new THREE.MeshStandardMaterial({
          color: "#ffe2a3",
          emissive: "#ffa145",
          emissiveIntensity: 2,
        }),
      );
      bulb.position.set(x, y - 0.13, z);
      scene.add(bulb);
      if (i < 14) {
        const g = new THREE.BufferGeometry();
        g.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            [x + 0.4, y - 0.08, z, x + 1.3, y - 0.08, z, x + 0.85, y - 0.85, z],
            3,
          ),
        );
        g.computeVertexNormals();
        const flag = new THREE.Mesh(
          g,
          new THREE.MeshStandardMaterial({
            color: colors[i % colors.length]!,
            side: THREE.DoubleSide,
            roughness: 0.9,
          }),
        );
        scene.add(flag);
      }
    }
    const lantern = new THREE.PointLight("#ffba6c", 55, 18, 2);
    lantern.position.set(z < 0 ? -9 : 9, 5, z);
    scene.add(lantern);
  }
  // Benches, flower beds and low stone borders frame the paved dance floor.
  for (const sign of [-1, 1]) {
    for (const z of [-4, 2, 7]) {
      const bench = new THREE.Group();
      bench.position.set(sign * 13, 0, z);
      bench.rotation.y = (sign * Math.PI) / 2;
      scene.add(bench);
      for (const yy of [0.52, 0.65])
        box(0, yy, 0, 2.5, 0.1, 0.48, "#85553b", bench);
      box(0, 1.05, -0.2, 2.5, 0.48, 0.1, "#85553b", bench);
      for (const x of [-0.9, 0.9])
        box(x, 0.26, 0, 0.14, 0.52, 0.43, "#36413f", bench);
    }
    for (let i = 0; i < 8; i++) {
      const pot = cylinder(0.3, 0.23, 0.46, "#a65d43");
      pot.position.set(sign * 12.3, 0.23, -6 + i * 1.5);
      const bush = sphere(0.38, "#426953");
      bush.position.set(sign * 12.3, 0.6, -6 + i * 1.5);
      bush.scale.y = 0.7;
      for (let f = 0; f < 3; f++) {
        const flower = sphere(0.07, f % 2 ? "#f0b69e" : "#db6979");
        flower.position.set(
          sign * 12.3 + Math.cos(f * 2) * 0.2,
          0.84,
          -6 + i * 1.5 + Math.sin(f * 2) * 0.2,
        );
      }
    }
  }
}
