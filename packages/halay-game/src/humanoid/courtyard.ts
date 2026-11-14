/** Original review environment. PBR inputs are authored here, not scanned or certified regional assets. */
import * as T from "three";
function stoneMaterial() {
  const size = 512,
    canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#786d60";
  c.fillRect(0, 0, size, size);
  let seed = 491;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = -1; y < 14; y++)
    for (let x = -1; x < 12; x++) {
      const xx = x * 48 + (y % 2) * 24,
        yy = y * 40;
      c.fillStyle = `hsl(34 15% ${51 + random() * 20}%)`;
      c.beginPath();
      c.roundRect(xx + 2, yy + 2, 44, 36, 3);
      c.fill();
      c.strokeStyle = "rgba(243,224,190,.25)";
      c.lineWidth = 1;
      c.stroke();
      for (let i = 0; i < 15; i++) {
        c.fillStyle = `rgba(60,46,31,${random() * 0.13})`;
        c.fillRect(xx + random() * 44 + 2, yy + random() * 36 + 2, 2, 1);
      }
    }
  const color = new T.CanvasTexture(canvas);
  color.colorSpace = T.SRGBColorSpace;
  color.wrapS = color.wrapT = T.RepeatWrapping;
  color.repeat.set(5, 5);
  color.anisotropy = 4;
  const bump = new T.CanvasTexture(canvas);
  bump.wrapS = bump.wrapT = T.RepeatWrapping;
  bump.repeat.copy(color.repeat);
  return new T.MeshStandardMaterial({
    map: color,
    bumpMap: bump,
    bumpScale: 0.045,
    roughness: 0.92,
    color: "#e7d6b9",
  });
}
export function buildWeddingCourtyard(scene: T.Scene) {
  const mesh = (
    geometry: T.BufferGeometry,
    material: T.Material,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = scene,
  ) => {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const material = (color: string, roughness = 0.85) =>
    new T.MeshStandardMaterial({ color, roughness });
  const stone = stoneMaterial(),
    plaster = material("#d5c5a7"),
    wood = material("#554332"),
    roof = material("#794d3e"),
    metal = material("#403d3a", 0.5);
  const window = new T.MeshStandardMaterial({
    color: "#ffc783",
    emissive: "#d99043",
    emissiveIntensity: 0.55,
    roughness: 0.35,
  });
  const ground = mesh(
    new T.PlaneGeometry(120, 120),
    material("#777568"),
    0,
    0.1,
    0,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  const square = mesh(new T.BoxGeometry(18, 0.15, 15), stone, 0, 0.15, 0);
  square.castShadow = false;
  const hemi = new T.HemisphereLight("#adc5ef", "#62513b", 2.1);
  scene.add(hemi);
  const sun = new T.DirectionalLight("#ffe1ad", 2.4);
  sun.position.set(-8, 12, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -12,
    right: 12,
    top: 12,
    bottom: -12,
  });
  sun.shadow.bias = -0.0003;
  scene.add(sun);
  const fill = new T.DirectionalLight("#b9cff6", 1.15);
  fill.position.set(8, 5, -4);
  scene.add(fill);
  function house(x: number, z: number, width: number, rotation: number) {
    const g = new T.Group();
    g.userData["cameraOccluder"] = true;
    g.position.set(x, 0, z);
    g.rotation.y = rotation;
    scene.add(g);
    mesh(new T.BoxGeometry(width, 3.8, 3.2), plaster, 0, 2, 0, g);
    mesh(new T.BoxGeometry(width, 0.55, 3.45), stone, 0, 0.38, 0, g);
    for (const xx of [-width / 2 + 0.08, 0, width / 2 - 0.08])
      mesh(new T.BoxGeometry(0.14, 3.7, 0.14), wood, xx, 2.05, 1.68, g);
    for (const yy of [1.2, 3.6])
      mesh(new T.BoxGeometry(width, 0.13, 0.18), wood, 0, yy, 1.7, g);
    for (const xx of [-width * 0.28, width * 0.28]) {
      const arch = new T.Shape();
      arch.moveTo(-0.38, 0);
      arch.lineTo(0.38, 0);
      arch.lineTo(0.38, 0.68);
      arch.absarc(0, 0.68, 0.38, 0, Math.PI, false);
      arch.lineTo(-0.38, 0);
      mesh(
        new T.ExtrudeGeometry(arch, { depth: 0.08, bevelEnabled: false }),
        wood,
        xx,
        1.7,
        1.65,
        g,
      );
      mesh(new T.PlaneGeometry(0.58, 0.78), window, xx, 2.14, 1.75, g);
      for (const dx of [-0.14, 0.14])
        mesh(
          new T.BoxGeometry(0.035, 0.82, 0.04),
          wood,
          xx + dx,
          2.14,
          1.79,
          g,
        );
      mesh(new T.BoxGeometry(0.75, 0.12, 0.32), wood, xx, 1.67, 1.82, g);
    }
    mesh(new T.BoxGeometry(0.9, 1.65, 0.1), wood, 0, 1.12, 1.68, g);
    const shape = new T.Shape();
    shape.moveTo(-width / 2 - 0.4, 0);
    shape.lineTo(0, 1.5);
    shape.lineTo(width / 2 + 0.4, 0);
    shape.closePath();
    mesh(
      new T.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false }),
      roof,
      0,
      3.9,
      -2,
      g,
    );
    // Tile ridges and eaves break the roof silhouette without imported architecture.
    for (let i = 0; i < 14; i++) {
      const xx = (i / 13 - 0.5) * (width + 0.8),
        yy = 3.94 + 1.5 * (1 - Math.abs(xx) / (width / 2 + 0.4));
      mesh(new T.BoxGeometry(0.035, 0.045, 4.05), roof, xx, yy, -0.02, g);
    }
    mesh(new T.BoxGeometry(width + 0.9, 0.12, 4.1), wood, 0, 3.87, 0, g);
  }
  house(-6.3, -6.1, 5.2, 0.09);
  house(6.3, -6.1, 5.2, -0.09);
  house(-10, 1, 4.2, Math.PI / 2);
  house(10, 1, 4.2, -Math.PI / 2);
  // Low stone boundary and a timber gateway preserve a clear view of the dancers.
  for (const x of [-8.7, 8.7])
    mesh(new T.BoxGeometry(0.4, 0.6, 12.5), stone, x, 0.5, 0);
  for (const x of [-2.2, 2.2]) {
    mesh(new T.BoxGeometry(0.25, 3.9, 0.25), wood, x, 2.1, -6.8);
    mesh(new T.BoxGeometry(0.5, 0.4, 0.5), stone, x, 0.4, -6.8);
  }
  mesh(new T.BoxGeometry(5, 0.24, 0.4), wood, 0, 4.1, -6.8);
  const banner = document.createElement("canvas");
  banner.width = 1024;
  banner.height = 180;
  const ctx = banner.getContext("2d")!;
  ctx.fillStyle = "#4b3330";
  ctx.fillRect(0, 0, 1024, 180);
  ctx.strokeStyle = "#d0aa6c";
  ctx.lineWidth = 8;
  ctx.strokeRect(9, 9, 1006, 162);
  ctx.font = "600 68px Georgia";
  ctx.fillStyle = "#f5d9ab";
  ctx.textAlign = "center";
  ctx.fillText("HALAY FEST", 512, 112);
  const texture = new T.CanvasTexture(banner);
  texture.colorSpace = T.SRGBColorSpace;
  mesh(
    new T.PlaneGeometry(3.7, 0.65),
    new T.MeshStandardMaterial({ map: texture, roughness: 0.85 }),
    0,
    3.7,
    -6.55,
  );
  const bulbMaterial = new T.MeshStandardMaterial({
    color: "#ffe0a6",
    emissive: "#ffb45d",
    emissiveIntensity: 2,
  });
  for (const z of [-4, 3.7]) {
    const points = Array.from(
      { length: 25 },
      (_, i) =>
        new T.Vector3(-9 + i * 0.75, 4.7 + Math.pow((i - 12) / 12, 2) * 0.7, z),
    );
    mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 24, 0.015, 4, false),
      metal,
      0,
      0,
      0,
    );
    for (let i = 0; i < 19; i++) {
      const x = -8.4 + i * 0.93,
        y = 4.7 + Math.pow(x / 9, 2) * 0.7;
      mesh(new T.SphereGeometry(0.055, 8, 6), bulbMaterial, x, y - 0.09, z);
    }
  }
  const lantern = new T.PointLight("#ffc17a", 24, 12, 2);
  lantern.position.set(-4, 3, -3);
  scene.add(lantern);
  // Original davul prop: a staging marker, not an animated musician/performance claim.
  const drum = mesh(
    new T.CylinderGeometry(0.38, 0.38, 0.42, 24),
    material("#9a6e45"),
    -4.9,
    0.7,
    -4.4,
  );
  drum.rotation.z = Math.PI / 2;
  for (const x of [-5.12, -4.68]) {
    const skin = mesh(
      new T.CircleGeometry(0.365, 24),
      material("#dfd1ae"),
      x,
      0.7,
      -4.4,
    );
    skin.rotation.y = Math.PI / 2;
  }
}
