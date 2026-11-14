/** Preproduction only: camera timing must never stand in for performance/asset approval. */
export const CINEMATIC_SECONDS = 45;
export const SHOTS = [
  { label: "Önden · tam zincir", position: [0, 2.1, 9], target: [0, 1, 0] },
  { label: "Yandan · ayak teması", position: [8, 1.5, 2], target: [0, 0.8, 0] },
  { label: "Başçeken · mendil", position: [-4, 2, 5], target: [-2, 1.2, 0] },
  { label: "Çapraz · meydan", position: [5, 4, 8], target: [0, 1, 0] },
  { label: "Ön kadraja dönüş", position: [0, 2.1, 9], target: [0, 1, 0] },
] as const;

/** Deterministic media-time preview; caller supplies the audio position, including pause/seek. */
export function cinematicFrame(mediaSeconds: number) {
  if (!Number.isFinite(mediaSeconds) || mediaSeconds < 0)
    throw new Error("Media time must be finite and non-negative");
  const seconds = mediaSeconds % CINEMATIC_SECONDS;
  const index = Math.floor(seconds / 9);
  const shot = SHOTS[index]!;
  const next = SHOTS[(index + 1) % SHOTS.length]!;
  const phase = (seconds % 9) / 9;
  // Zero endpoint velocity/acceleration, including the wrap; not a character animation.
  const t = phase ** 3 * (10 + phase * (-15 + 6 * phase));
  const mix = (a: readonly number[], b: readonly number[]) =>
    a.map((value, i) => value + (b[i]! - value) * t);
  return {
    seconds,
    index,
    label: shot.label,
    position: mix(shot.position, next.position),
    target: mix(shot.target, next.target),
  };
}

/** Arithmetic preflight only. Passing says nothing about real audio/motion loop seams. */
export function loopPreflight(
  bpm: number,
  beatsPerBar: number,
  figureBeats: readonly number[],
) {
  if (
    !Number.isFinite(bpm) ||
    bpm <= 0 ||
    !Number.isInteger(beatsPerBar) ||
    beatsPerBar <= 0 ||
    !figureBeats.length ||
    figureBeats.some((n) => !Number.isInteger(n) || n <= 0)
  )
    throw new Error("Invalid calibrated beat grid or figure sequence");
  const beats = (CINEMATIC_SECONDS * bpm) / 60;
  const sequenceBeats = figureBeats.reduce((a, b) => a + b, 0);
  const integral = (n: number) => Math.abs(n - Math.round(n)) < 1e-8;
  return {
    beats,
    wholeBars: integral(beats / beatsPerBar),
    wholeSequences: integral(beats / sequenceBeats),
    figuresFitBars: figureBeats.every((n) => integral(n / beatsPerBar)),
    // Always independent human/recording review: arithmetic cannot approve a loop.
    audioSeamVerified: false as const,
    performanceVerified: false as const,
  };
}
