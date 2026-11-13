import * as THREE from "three";
import { createGeometry, colors } from "./geometry.js";
export function dancerFactory(scene: THREE.Scene) {
  const { box, sphere } = createGeometry(scene);
  function nameSprite(text: string, isNpc = false) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.fillStyle = isNpc ? "rgba(21,54,62,.81)" : "rgba(28,40,58,.88)";
    ctx.beginPath();
    ctx.roundRect(5, 8, 502, 84, 25);
    ctx.fill();
    ctx.strokeStyle = isNpc ? "#8bcdb4" : "#f4ce80";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = "700 37px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(text.length > 20 ? text.slice(0, 19) + "…" : text, 256, 51);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const obj = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        depthWrite: false,
        transparent: true,
      }),
    );
    obj.scale.set(2.5, 0.5, 1);
    return obj;
  }
  function makeDancer(name: string, isNpc: boolean, idx: number) {
    const group = new THREE.Group();
    scene.add(group);
    const skin = ["#e5b58b", "#c98f71", "#e7c1a0", "#b98164"][idx % 4]!;
    const dress = colors[(idx * 3 + 2) % colors.length]!;
    const legL = box(-0.16, 0.39, 0, 0.23, 0.72, 0.27, "#2d4d5b", group);
    const legR = box(0.16, 0.39, 0, 0.23, 0.72, 0.27, "#2d4d5b", group);
    box(0, 1.23, 0, 0.75, 0.97, 0.43, dress, group);
    const head = sphere(0.31, skin, group);
    head.position.y = 2.04;
    const hair = sphere(
      0.32,
      ["#3f322c", "#5d3d29", "#232c32"][idx % 3]!,
      group,
    );
    hair.position.y = 2.17;
    hair.scale.y = 0.54;
    const armL = box(-0.53, 1.5, 0, 0.24, 0.74, 0.24, skin, group);
    armL.rotation.z = -0.58;
    const armR = box(0.53, 1.5, 0, 0.24, 0.74, 0.24, skin, group);
    armR.rotation.z = 0.58;
    const lbl = nameSprite(name, isNpc);
    lbl.position.y = 2.95;
    group.add(lbl);
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.065, 7, 27),
      new THREE.MeshBasicMaterial({
        color: "#f3b85f",
        transparent: true,
        opacity: 0,
      }),
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.1;
    group.add(glow);
    return {
      name,
      isNpc,
      group,
      armL,
      armR,
      legL,
      legR,
      head,
      glow,
      auraUntil: 0,
      crownUntil: 0,
      angle: 0,
    };
  }

  return makeDancer;
}
export type Dancer = ReturnType<ReturnType<typeof dancerFactory>>;
