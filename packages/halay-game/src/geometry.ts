// Geometry helpers and palette ported from preserved v0.2.
import * as THREE from "three";
export const colors = [
  "#e96e66",
  "#e9ae4e",
  "#5cbab2",
  "#7c92dc",
  "#b778bf",
  "#c87855",
  "#76ad70",
  "#e28ca4",
  "#56a2a8",
];
export function createGeometry(scene: THREE.Scene) {
  const mat = (hex: THREE.ColorRepresentation) =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: 0.83 });
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: THREE.ColorRepresentation,
    parent: THREE.Object3D = scene,
  ) {
    const ob = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    ob.position.set(x, y, z);
    ob.castShadow = true;
    ob.receiveShadow = true;
    parent.add(ob);
    return ob;
  }
  function cylinder(
    r1: number,
    r2: number,
    h: number,
    color: THREE.ColorRepresentation,
    parent: THREE.Object3D = scene,
  ) {
    const o = new THREE.Mesh(
      new THREE.CylinderGeometry(r1, r2, h, 12),
      mat(color),
    );
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function sphere(
    r: number,
    color: THREE.ColorRepresentation,
    parent: THREE.Object3D = scene,
  ) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), mat(color));
    o.castShadow = true;
    parent.add(o);
    return o;
  }

  return { box, cylinder, sphere };
}
