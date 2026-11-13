import type { RhythmAnalysis } from "@halay/contracts";
import { quantile } from "./beat-clock.js";
export interface Onset {
  time: number;
  strength: number;
}
/** Streaming RMS onset detector; it holds no PCM/audio-file buffers. */
export class OnsetDetector {
  private average = 0.002;
  private previous = 0;
  private last = -100;
  update(time: number, rms: number): Onset | undefined {
    const baseline = this.average;
    this.average = this.average * 0.97 + rms * 0.03;
    const rising = rms - this.previous;
    this.previous = rms;
    if (
      rms > Math.max(0.006, baseline * 1.65) &&
      rising > 0.004 &&
      time - this.last > 0.19
    ) {
      this.last = time;
      return { time, strength: Math.min(1, rms) };
    }
    return undefined;
  }
}
/** Estimates tempo and accent periodicity, not cultural dance style. */
export function analyzeRhythm(onsets: readonly Onset[]): RhythmAnalysis | null {
  if (onsets.length < 8) return null;
  const observedSeconds = onsets.at(-1)!.time - onsets[0]!.time;
  if (observedSeconds < 4) return null;
  const candidates = new Map<number, number>();
  for (let i = 1; i < onsets.length; i++)
    for (let back = 1; back <= 4 && i - back >= 0; back++) {
      let bpm = (60 * back) / (onsets[i]!.time - onsets[i - back]!.time);
      while (bpm < 70) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      const rounded = Math.round(bpm);
      if (rounded >= 40 && rounded <= 240)
        candidates.set(rounded, (candidates.get(rounded) ?? 0) + 1 / back);
    }
  const sorted = [...candidates].sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;
  const bpm = sorted[0]![0],
    period = 60 / bpm;
  // Circular mean retains the beat offset even when listening begins mid-track.
  let x = 0,
    y = 0;
  for (const onset of onsets) {
    x += Math.cos((onset.time / period) * Math.PI * 2);
    y += Math.sin((onset.time / period) * Math.PI * 2);
  }
  const phase = (((Math.atan2(y, x) / (Math.PI * 2)) % 1) + 1) % 1;
  const firstBeatSec = phase * period;
  const errors = onsets.map((onset) =>
    Math.abs(
      (onset.time - firstBeatSec) / period -
        Math.round((onset.time - firstBeatSec) / period),
    ),
  );
  const regularity = Math.max(0, 1 - quantile(errors, 0.75) * 4);
  const totalWeight = [...candidates.values()].reduce((a, b) => a + b, 0);
  const localWeight = [...candidates]
    .filter(([candidate]) => Math.abs(candidate - bpm) <= 2)
    .reduce((sum, [, weight]) => sum + weight, 0);
  const confidence = Math.min(
    1,
    (localWeight / totalWeight) * regularity * Math.min(1, onsets.length / 24),
  );
  const strengths = onsets.map((o) => o.strength);
  const mean = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  const variance = strengths.reduce(
    (sum, strength) => sum + (strength - mean) ** 2,
    0,
  );
  const meterCandidates = [2, 4, 7, 9]
    .map((beats) => {
      let corr = 0;
      for (let i = beats; i < strengths.length; i++)
        corr += (strengths[i]! - mean) * (strengths[i - beats]! - mean);
      return {
        beats,
        confidence:
          variance > 0.00001 ? Math.max(0, Math.min(0.85, corr / variance)) : 0,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);
  return {
    bpm,
    confidence,
    firstBeatSec,
    onsetCount: onsets.length,
    observedSeconds: Math.min(120, observedSeconds),
    regularity,
    meterCandidates,
  };
}
