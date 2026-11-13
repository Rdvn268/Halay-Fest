import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import * as THREE from "three";
import { expect, it } from "vitest";
import { MUSIC } from "../../packages/halay-game/src/rhythm.js";
import { updateDancers } from "../../packages/halay-game/src/choreography.js";
import type { Dancer } from "../../packages/halay-game/src/dancers.js";

const legacy = await readFile(
  new URL("../../legacy/v0.2/index.html", import.meta.url),
  "utf8",
);
it("retains the exact v0.2 melody, meter, tempo and percussion patterns", () => {
  const source = legacy.slice(
    legacy.indexOf("const MUSIC={"),
    legacy.indexOf("function syncMusicMode("),
  );
  expect(MUSIC).toEqual(runInNewContext(source + ";MUSIC"));
});
for (const dance of ["halay", "horon"] as const)
  it(`retains v0.2 ${dance} body motion at sampled times`, () => {
    const dancer = (): Dancer => ({
      name: "NPC",
      isNpc: true,
      group: new THREE.Group(),
      armL: new THREE.Mesh(),
      armR: new THREE.Mesh(),
      legL: new THREE.Mesh(),
      legR: new THREE.Mesh(),
      head: new THREE.Mesh(),
      glow: new THREE.Mesh(
        new THREE.TorusGeometry(),
        new THREE.MeshBasicMaterial(),
      ),
      auraUntil: 8,
      crownUntil: 15,
      angle: 0.5,
    });
    const migrated = [dancer()],
      reference = [dancer()];
    const source = legacy.slice(
      legacy.indexOf("function updateDancers(t){"),
      legacy.indexOf("function updateCamera("),
    );
    for (const t of [0, 0.25, 1, 5, 12, 18]) {
      updateDancers(migrated, t, dance, t);
      runInNewContext(source + ";updateDancers(t)", {
        dancers: reference,
        MUSIC,
        currentDance: dance,
        elapsed: t,
        t,
      });
      const values = (d: Dancer) => [
        d.group.position.toArray(),
        d.group.rotation.toArray(),
        d.armL.rotation.toArray(),
        d.armR.rotation.toArray(),
        d.legL.rotation.toArray(),
        d.legR.rotation.toArray(),
        d.head.scale.toArray(),
        d.glow.material.opacity,
      ];
      expect(values(migrated[0]!)).toEqual(values(reference[0]!));
    }
  });
