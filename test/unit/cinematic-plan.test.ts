import { describe, expect, it } from "vitest";
import {
  cinematicFrame,
  loopPreflight,
} from "../../packages/halay-game/src/cinematic-plan.js";
import { DANCE_BRIEFS } from "../../packages/halay-game/src/dance-briefs.js";

describe("cinematic preparation, not production acceptance", () => {
  it("is deterministic for pause/seek and wraps the 45-second camera path", () => {
    for (const time of [0, 8.99, 9, 18, 27, 36, 44.999]) {
      expect(cinematicFrame(time)).toEqual(cinematicFrame(time));
      const loop = cinematicFrame(time + 45);
      cinematicFrame(time).position.forEach((value, i) =>
        expect(loop.position[i]).toBeCloseTo(value, 10),
      );
    }
    expect(cinematicFrame(45)).toEqual(cinematicFrame(0));
    expect(cinematicFrame(18).label).toContain("Başçeken");
    expect(cinematicFrame(9).label).toContain("Yandan");
    expect(cinematicFrame(5)).toEqual(cinematicFrame(50));
  });
  it("has continuous camera position and near-zero endpoint velocity at every boundary", () => {
    for (const time of [9, 18, 27, 36, 45]) {
      const before = cinematicFrame(time - 0.001),
        after = cinematicFrame(time + 0.001);
      for (const field of ["position", "target"] as const)
        before[field].forEach((n, i) =>
          expect(Math.abs(n - after[field][i]!)).toBeLessThan(1e-7),
        );
    }
  });
  it("does not mistake 45 seconds for a whole musical loop", () => {
    expect(loopPreflight(120, 4, [8, 8])).toMatchObject({
      beats: 90,
      wholeBars: false,
      wholeSequences: false,
    });
    expect(loopPreflight(128, 4, [8, 8])).toMatchObject({
      wholeBars: true,
      wholeSequences: true,
      audioSeamVerified: false,
      performanceVerified: false,
    });
    expect(loopPreflight(128, 4, [6, 10]).figuresFitBars).toBe(false);
  });
  it("rejects invalid media/grid values", () => {
    for (const t of [-1, NaN, Infinity])
      expect(() => cinematicFrame(t)).toThrow();
    for (const [bpm, bar, figures] of [
      [0, 4, [8]],
      [NaN, 4, [8]],
      [120, 2.5, [8]],
      [120, 4, []],
      [120, 4, [-8]],
      [120, 4, [Infinity]],
    ] as const)
      expect(() => loopPreflight(bpm, bar, figures)).toThrow();
  });
  it("keeps all gender-specific production briefs outside the playable clip library", () => {
    expect(new Set(DANCE_BRIEFS.map((b) => b.id)).size).toBe(8);
    for (const family of ["halay", "kolbasti", "oyun-havasi", "pop"])
      expect(DANCE_BRIEFS.filter((b) => b.family === family)).toHaveLength(2);
    for (const brief of DANCE_BRIEFS) {
      expect(brief.status).toBe("research-draft");
      expect(brief.playable).toBe(false);
      expect(brief.takes.male).not.toBe(brief.takes.female);
      expect(new URL(brief.source).protocol).toBe("https:");
    }
  });
});
