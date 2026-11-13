import { describe, expect, it } from "vitest";
import { BeatClock } from "../../packages/halay-game/src/beat-clock.js";
import {
  analyzeRhythm,
  OnsetDetector,
} from "../../packages/halay-game/src/rhythm-analysis.js";
describe("audio-time beat clock", () => {
  it("maps delayed audio-thread observations and cancels an obsolete pending grid", () => {
    const clock = new BeatClock();
    clock.anchor(10, 20, true);
    expect(clock.mediaAt(9.99)).toBeCloseTo(19.99);
    clock.frame(10.1);
    const original = { ...clock.grid };
    clock.setGrid({ ...original, dance: "horon" });
    clock.setGrid(original);
    expect(clock.frame(11).dance).toBe("halay");
  });
  it("stays independent of render FPS, respects pause, seek and first-beat calibration", () => {
    const clock = new BeatClock({
      bpm: 120,
      firstBeatSec: 0.15,
      beatsPerBar: 2,
      beatUnit: 4,
      calibrationMs: 25,
      dance: "halay",
    });
    clock.anchor(3, 0.175, true);
    expect(clock.frame(4).beat).toBeCloseTo(2);
    expect(clock.frame(4).bar).toBe(1);
    clock.anchor(4, 1.175, false);
    expect(clock.frame(30).beat).toBeCloseTo(2);
    clock.anchor(30, 10.175, true);
    expect(clock.frame(30).beat).toBeCloseTo(20);
    expect(clock.driftMs).toHaveLength(0);
  });
  it("applies changes at a measure boundary and defines 7/8 eighth-note timing", () => {
    const clock = new BeatClock();
    clock.anchor(0, 0, true);
    clock.frame(0.2);
    clock.setGrid({
      bpm: 150,
      firstBeatSec: 0,
      beatsPerBar: 7,
      beatUnit: 8,
      calibrationMs: 0,
      dance: "horon",
    });
    expect(clock.frame(0.5).dance).toBe("halay");
    expect(clock.frame(1).dance).toBe("horon");
    expect(clock.frame(1.4).bar).toBe(1);
  });
  it("keeps only bounded clock observations", () => {
    const clock = new BeatClock();
    clock.anchor(0, 0, true);
    for (let i = 0; i < 2000; i++) clock.observe(i, i + 0.001, true);
    expect(clock.driftMs).toHaveLength(600);
  });
});
describe("rhythm estimation", () => {
  it.each([90, 108, 120, 150])(
    "estimates a recorded %i BPM grid without inferring dance style",
    (bpm) => {
      const onsets = Array.from({ length: 64 }, (_, i) => ({
        time: 0.15 + (i * 60) / bpm,
        strength: i % 4 === 0 ? 0.5 : 0.2,
      }));
      const analysis = analyzeRhythm(onsets)!;
      expect(analysis.bpm).toBeCloseTo(bpm, 0);
      expect(analysis.firstBeatSec).toBeCloseTo(0.15, 2);
      expect(analysis.confidence).toBeGreaterThan(0.65);
      expect(analysis).not.toHaveProperty("dance");
    },
  );
  it("reports insufficient input instead of fabricated BPM", () => {
    expect(analyzeRhythm([])).toBeNull();
    const detector = new OnsetDetector();
    expect(detector.update(0, 0)).toBeUndefined();
    expect(detector.update(0.15, 0.3)?.time).toBe(0.15);
    expect(detector.update(0.16, 0.4)).toBeUndefined();
  });
});
