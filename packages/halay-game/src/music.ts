import { MUSIC } from "./rhythm.js";
import type { DanceMode } from "./rhythm.js";

/** Native Web Audio synth ported from v0.2, with an explicit lifecycle. */
export class MusicEngine {
  private context: AudioContext | undefined;
  private gain: GainNode | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private nextNoteAt = 0;
  private stepIndex = 0;
  private volume = 45;
  private enabled = false;
  private paused = false;
  dance: DanceMode = "halay";
  get playing() {
    return this.enabled && !this.paused && this.context?.state === "running";
  }
  rhythm(fallback: number) {
    return this.playing ? this.context!.currentTime : fallback;
  }
  setDance(dance: DanceMode) {
    if (dance === this.dance) return;
    this.dance = dance;
    this.stepIndex = 0;
    if (this.context) this.nextNoteAt = this.context.currentTime + 0.06;
  }
  setVolume(volume: number) {
    this.volume = volume;
    if (this.context && this.gain)
      this.gain.gain.setTargetAtTime(
        (volume / 100) * 0.22,
        this.context.currentTime,
        0.04,
      );
  }
  async setPaused(paused: boolean) {
    this.paused = paused;
    if (!this.context || !this.enabled) return;
    if (paused) await this.context.suspend();
    else {
      await this.context.resume();
      this.nextNoteAt = this.context.currentTime + 0.07;
    }
  }
  async toggle() {
    if (this.enabled) {
      this.enabled = false;
      clearInterval(this.timer);
      await this.context?.suspend();
      return;
    }
    if (this.paused) throw new Error("Önce oyunu devam ettirin.");
    if (!this.context) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = (this.volume / 100) * 0.22;
      this.gain.connect(this.context.destination);
    }
    await this.context.resume();
    this.enabled = true;
    this.stepIndex = 0;
    this.nextNoteAt = this.context.currentTime + 0.07;
    this.timer = setInterval(() => this.schedule(), 35);
    this.schedule();
  }
  private tone(
    frequency: number,
    at: number,
    duration: number,
    kind: "lead" | "bass",
    volume: number,
  ) {
    const ctx = this.context,
      master = this.gain;
    if (!ctx || !master) return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = kind === "lead" ? "sawtooth" : "triangle";
    oscillator.detune.value = kind === "lead" ? 3 : 0;
    oscillator.frequency.setValueAtTime(frequency, at);
    const attack = kind === "lead" ? 0.018 : 0.007,
      release = kind === "lead" ? 0.11 : 0.07;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, volume),
      at + attack,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      at + Math.max(attack + 0.02, duration - release),
    );
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.005);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  private percussion(type: "kick" | "tap", at: number, loud = 1) {
    const ctx = this.context,
      master = this.gain;
    if (!ctx || !master) return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = type === "kick" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(type === "kick" ? 145 : 530, at);
    oscillator.frequency.exponentialRampToValueAtTime(
      type === "kick" ? 48 : 190,
      at + 0.095,
    );
    gain.gain.setValueAtTime((type === "kick" ? 0.27 : 0.065) * loud, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(at);
    oscillator.stop(at + 0.14);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  private schedule() {
    if (!this.playing || !this.context) return;
    // Do not replay an unbounded backlog after a suspended/backgrounded tab.
    if (this.nextNoteAt < this.context.currentTime)
      this.nextNoteAt = this.context.currentTime + 0.02;
    let scheduled = 0;
    while (
      this.nextNoteAt < this.context.currentTime + 0.18 &&
      scheduled++ < 32
    ) {
      const d = MUSIC[this.dance],
        i = this.stepIndex % d.steps,
        at = this.nextNoteAt;
      const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
      if (this.dance === "halay") {
        if (i % 4 === 0) this.percussion("kick", at);
        if (i % 4 === 2) this.percussion("tap", at, 0.85);
        if (i % 2 === 0)
          this.tone(midi(d.melody[i]!), at, d.unit * 1.78, "lead", 0.085);
        if (i % 4 === 0)
          this.tone(
            midi(d.bass[Math.floor(i / 2) % d.bass.length]!),
            at,
            d.unit * 3.8,
            "bass",
            0.075,
          );
      } else {
        if (d.accent.includes(i))
          this.percussion(i === 0 ? "kick" : "tap", at, i === 0 ? 1 : 0.94);
        if (i % 2 === 0 || i === 13)
          this.tone(
            midi(d.melody[i]!),
            at,
            d.unit * (i === 13 ? 0.95 : 1.8),
            "lead",
            0.067,
          );
        if (i === 0 || i === 8)
          this.tone(midi(d.bass[i % 7]!), at, d.unit * 3.2, "bass", 0.065);
      }
      this.stepIndex++;
      this.nextNoteAt += d.unit;
    }
  }
  async dispose() {
    clearInterval(this.timer);
    this.enabled = false;
    await this.context?.close();
  }
}
