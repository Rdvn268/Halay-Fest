import type { MusicTrack } from "@halay/contracts";
export type BeatGrid = Pick<
  MusicTrack,
  | "bpm"
  | "firstBeatSec"
  | "beatsPerBar"
  | "beatUnit"
  | "calibrationMs"
  | "dance"
>;
export interface BeatFrame {
  mediaSeconds: number;
  beat: number;
  phase: number;
  bar: number;
  barPhase: number;
  beatsPerBar: number;
  dance: MusicTrack["dance"];
}
export const quantile = (values: readonly number[], q = 0.95) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))
  ]!;
};
export class BeatClock {
  private contextAnchor = 0;
  private mediaAnchor = 0;
  private running = false;
  private pending: BeatGrid | undefined;
  private previousBar = 0;
  readonly driftMs: number[] = [];
  constructor(
    public grid: BeatGrid = {
      bpm: 120,
      firstBeatSec: 0,
      beatsPerBar: 2,
      beatUnit: 4,
      calibrationMs: 0,
      dance: "halay",
    },
  ) {}
  anchor(contextSeconds: number, mediaSeconds: number, running: boolean) {
    this.contextAnchor = contextSeconds;
    this.mediaAnchor = mediaSeconds;
    this.running = running;
  }
  mediaAt(contextSeconds: number) {
    return (
      this.mediaAnchor +
      (this.running ? contextSeconds - this.contextAnchor : 0)
    );
  }
  observe(contextSeconds: number, mediaSeconds: number, running: boolean) {
    const error = mediaSeconds - this.mediaAt(contextSeconds);
    this.driftMs.push(Math.abs(error) * 1000);
    if (this.driftMs.length > 600) this.driftMs.shift();
    if (this.running !== running || Math.abs(error) > 0.08)
      this.anchor(contextSeconds, mediaSeconds, running);
    else {
      this.mediaAnchor += error * 0.12;
    }
  }
  setGrid(grid: BeatGrid, immediate = false) {
    if (JSON.stringify(grid) === JSON.stringify(this.grid)) {
      this.pending = undefined;
      return;
    }
    if (immediate || !this.running) {
      this.grid = grid;
      this.pending = undefined;
    } else this.pending = grid;
  }
  frame(contextSeconds: number): BeatFrame {
    const mediaSeconds = this.mediaAt(contextSeconds);
    let unit = ((60 / this.grid.bpm) * 4) / this.grid.beatUnit;
    let beat =
      (mediaSeconds - this.grid.firstBeatSec - this.grid.calibrationMs / 1000) /
      unit;
    let bar = Math.floor(beat / this.grid.beatsPerBar + 1e-10);
    if (this.pending && bar !== this.previousBar) {
      this.grid = this.pending;
      this.pending = undefined;
      unit = ((60 / this.grid.bpm) * 4) / this.grid.beatUnit;
      beat =
        (mediaSeconds -
          this.grid.firstBeatSec -
          this.grid.calibrationMs / 1000) /
        unit;
      bar = Math.floor(beat / this.grid.beatsPerBar + 1e-10);
    }
    this.previousBar = bar;
    return {
      mediaSeconds,
      beat,
      phase: ((beat % 1) + 1) % 1,
      bar,
      barPhase: (((beat / this.grid.beatsPerBar) % 1) + 1) % 1,
      beatsPerBar: this.grid.beatsPerBar,
      dance: this.grid.dance,
    };
  }
  onsetError(mediaSeconds: number) {
    const quarter = 60 / this.grid.bpm;
    const beat =
      (mediaSeconds - this.grid.firstBeatSec - this.grid.calibrationMs / 1000) /
      quarter;
    return Math.abs(beat - Math.round(beat)) * quarter * 1000;
  }
}
