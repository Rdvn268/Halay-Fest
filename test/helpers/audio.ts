/** Original percussion test signal, not a licensed song or a production music asset. */
export function recordedBeatWav(
  seconds = 8,
  bpm = 120,
  firstBeat = 0.15,
): Buffer {
  const rate = 16000,
    frames = Math.floor(seconds * rate),
    data = Buffer.alloc(44 + frames * 2);
  data.write("RIFF");
  data.writeUInt32LE(data.length - 8, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24);
  data.writeUInt32LE(rate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(frames * 2, 40);
  const period = 60 / bpm;
  for (let i = 0; i < frames; i++) {
    const t = i / rate,
      phase = (((t - firstBeat) % period) + period) % period;
    const pulse =
      t >= firstBeat && phase < 0.07
        ? Math.sin(2 * Math.PI * 180 * phase) * Math.exp(-phase * 70) * 0.8
        : 0;
    data.writeInt16LE(Math.round(pulse * 28000), 44 + i * 2);
  }
  return data;
}
