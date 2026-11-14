import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { it, expect } from "vitest";

it("passes PCM through unchanged and measures right-only stereo as well as mono without track buffers", async () => {
  const source = await readFile(
    "apps/broadcaster/public/audio-level-worklet.js",
    "utf8",
  );
  for (const stereo of [false, true]) {
    const messages: { contextTime: number; rms: number }[] = [];
    type Processor = {
      process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
    };
    let Constructor: (new () => Processor) | undefined;
    class Host {
      port = {
        postMessage: (value: { contextTime: number; rms: number }) =>
          messages.push(value),
      };
    }
    runInNewContext(source, {
      AudioWorkletProcessor: Host,
      sampleRate: 48000,
      currentTime: 1,
      registerProcessor: (_name: string, value: new () => Processor) => {
        Constructor = value;
      },
    });
    const processor = new Constructor!();
    for (let block = 0; block < 8; block++) {
      const input = stereo
        ? [new Float32Array(128), new Float32Array(128).fill(0.5)]
        : [new Float32Array(128).fill(0.5)];
      const output = input.map(() => new Float32Array(128));
      expect(processor.process([input], [output])).toBe(true);
      output.forEach((channel, i) => expect(channel).toEqual(input[i]));
    }
    expect(messages).toHaveLength(2);
    expect(messages[0]!.rms).toBeCloseTo(stereo ? Math.sqrt(0.125) : 0.5, 6);
    expect(Object.keys(messages[0]!)).toEqual(["contextTime", "rms"]);
  }
});
