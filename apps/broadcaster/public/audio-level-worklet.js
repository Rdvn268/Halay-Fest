// Original bounded RMS tap. Audio is streamed, not copied into a full-track buffer.
class HalayLevelTap extends AudioWorkletProcessor {
  sum = 0;
  count = 0;
  process(inputs, outputs) {
    const input = inputs[0] || [];
    const output = outputs[0] || [];
    for (let c = 0; c < output.length; c++)
      if (input[c]) output[c].set(input[c]);
    if (input[0]) {
      for (const value of input[0]) {
        this.sum += value * value;
        this.count++;
      }
      if (this.count >= sampleRate / 100) {
        this.port.postMessage({
          contextTime: currentTime,
          rms: Math.sqrt(this.sum / this.count),
        });
        this.sum = 0;
        this.count = 0;
      }
    }
    return true;
  }
}
registerProcessor("halay-level-tap", HalayLevelTap);
