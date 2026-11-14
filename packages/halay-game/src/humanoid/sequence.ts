import { Vector3 } from "three";
export interface SequencedFigure {
  beats: number;
  rootAt: (phase: number) => Vector3;
}
/** Quantize figure boundaries to whole bars, retaining accumulated authored group travel. */
export function sequenceFrame(
  figures: readonly SequencedFigure[],
  beat: number,
  beatsPerBar: number,
) {
  if (
    !figures.length ||
    !Number.isFinite(beat) ||
    !Number.isInteger(beatsPerBar) ||
    beatsPerBar < 1
  )
    throw new Error("Invalid figure sequence");
  const durations = figures.map((f) => {
    if (!Number.isFinite(f.beats) || f.beats <= 0)
      throw new Error("Invalid figure duration");
    return Math.ceil(f.beats / beatsPerBar) * beatsPerBar;
  });
  const total = durations.reduce((a, b) => a + b, 0),
    loop = Math.floor(Math.max(0, beat) / total),
    inLoop = Math.max(0, beat) % total;
  let index = 0,
    offset = 0;
  while (index < figures.length - 1 && inLoop >= offset + durations[index]!) {
    offset += durations[index]!;
    index++;
  }
  const phase = (inLoop - offset) / durations[index]!;
  const travel = new Vector3(),
    net = new Vector3();
  figures.forEach((f, i) => {
    const delta = f.rootAt(1).sub(f.rootAt(0));
    net.add(delta);
    if (i < index) travel.add(delta);
  });
  travel
    .addScaledVector(net, loop)
    .add(figures[index]!.rootAt(phase))
    .sub(figures[index]!.rootAt(0));
  return { index, phase, cycle: loop * figures.length + index, travel };
}
