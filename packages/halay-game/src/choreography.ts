// v0.2 formulas retained for both 2/4 Halay and 7/8 Horon.
import type { Dancer } from "./dancers.js";
import { MUSIC } from "./rhythm.js";
import type { DanceMode } from "./rhythm.js";
export function updateDancers(
  dancers: Dancer[],
  t: number,
  currentDance: DanceMode,
  elapsed: number,
) {
  const d = MUSIC[currentDance],
    beat = t / d.unit,
    len = dancers.length;
  const radius = len < 14 ? 4.3 : len < 36 ? 6 : len < 70 ? 7.2 : 8.1;
  dancers.forEach((p, i) => {
    const offset = i * 0.08;
    const halay = currentDance === "halay";
    const lateral = halay
      ? Math.sin(((beat + offset) * Math.PI) / 2) * 0.15
      : Math.sin(((beat + offset) * Math.PI * 2) / 7) * 0.24;
    const bounce = halay
      ? Math.max(0, Math.sin(((beat + offset) * Math.PI) / 2)) * 0.1
      : Math.max(0, Math.sin((beat + offset) * Math.PI)) * 0.15;
    const ang = p.angle + t * (halay ? 0.077 : 0.13);
    const r =
      radius +
      (len > 60 ? ((i % 3) - 1) * 0.8 : len > 20 ? (i % 2) * 0.45 : 0) +
      lateral;
    p.group.position.set(Math.cos(ang) * r, bounce, Math.sin(ang) * r);
    p.group.rotation.y = -ang + Math.PI / 2;
    // Halay: wide linked arms and synchronized side-steps. Horon: raised elbows,
    // compact quick footwork and pronounced shoulder pulses on 2+2+3 accents.
    p.group.rotation.z = halay
      ? Math.sin(((beat + offset) * Math.PI) / 2) * 0.11
      : Math.sin((beat + offset) * Math.PI) * 0.075;
    p.armL.rotation.z = halay
      ? -0.78 + Math.sin(((beat + offset) * Math.PI) / 2) * 0.23
      : -1.25 + Math.sin((beat + offset) * Math.PI) * 0.32;
    p.armR.rotation.z = halay
      ? 0.78 + Math.sin(((beat + offset) * Math.PI) / 2) * 0.23
      : 1.25 + Math.sin((beat + offset) * Math.PI + 0.4) * 0.32;
    p.legL.rotation.x = halay
      ? Math.sin(((beat + offset) * Math.PI) / 2) * 0.26
      : Math.sin((beat + offset) * Math.PI) * 0.31;
    p.legR.rotation.x = halay
      ? -Math.sin(((beat + offset) * Math.PI) / 2) * 0.26
      : -Math.sin((beat + offset) * Math.PI) * 0.31;
    p.glow.material.opacity = p.auraUntil > elapsed ? 0.65 : 0;
    p.glow.rotation.z = t * 0.4;
    p.head.scale.setScalar(p.crownUntil > elapsed ? 1.25 : 1);
  });
}
