// Original v0.2 procedural village; no downloaded models or textures.
import * as THREE from "three";
import { createGeometry, colors } from "./geometry.js";
export function buildEnvironment(scene: THREE.Scene) {
  const { box, cylinder, sphere } = createGeometry(scene);
  const mat = (hex: THREE.ColorRepresentation) =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: 0.83 });
  scene.add(new THREE.HemisphereLight("#fff4dc", "#79938d", 2.4));
  const sun = new THREE.DirectionalLight("#ffead0", 3.0);
  sun.position.set(-11, 24, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -27;
  sun.shadow.camera.right = 27;
  sun.shadow.camera.top = 27;
  sun.shadow.camera.bottom = -27;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    mat("#708d71"),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const circle = new THREE.Mesh(
    new THREE.CylinderGeometry(11.1, 11.5, 0.3, 64),
    mat("#c8a77b"),
  );
  circle.position.y = 0.05;
  circle.receiveShadow = true;
  scene.add(circle);
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(8.4, 8.4, 0.31, 64),
    mat("#d7bb8c"),
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
    box(0, 1.6, 0, 4, 3.2, 3.5, paint, g);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 2.35, 4, 1),
      mat("#a94d3b"),
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.2;
    roof.castShadow = true;
    g.add(roof);
    box(0, 1.04, 1.76, 0.85, 2.1, 0.09, "#694936", g);
    for (const xx of [-1.28, 1.28]) {
      box(xx, 2.15, 1.77, 0.73, 0.75, 0.1, "#e0eec8", g);
      box(xx, 2.15, 1.84, 0.11, 0.85, 0.1, "#926b4b", g);
    }
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
  function musician(x: number, kind: string) {
    const g = new THREE.Group();
    g.position.set(x, 1, -16.5);
    scene.add(g);
    const b = cylinder(0.4, 0.48, 1.2, "#5b7f7d", g);
    b.position.y = 0.6;
    const h = sphere(0.32, "#d6a077", g);
    h.position.y = 1.48;
    if (kind === "drum") {
      const d = cylinder(0.65, 0.65, 0.38, "#f5d49c", g);
      d.rotation.z = Math.PI / 2;
      d.position.set(0.45, 0.8, 0.35);
    } else {
      box(0.24, 0.82, 0.36, 0.84, 0.38, 0.26, "#ad6747", g);
    }
  }
  musician(-2, "drum");
  musician(2, "zurna");
}
