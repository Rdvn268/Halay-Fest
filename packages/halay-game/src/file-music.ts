import type { MusicLibrary, MusicTrack, DanceStyle } from "@halay/contracts";
import { BeatClock, quantile } from "./beat-clock.js";
import type { BeatFrame } from "./beat-clock.js";
import { OnsetDetector, analyzeRhythm } from "./rhythm-analysis.js";
import type { Onset } from "./rhythm-analysis.js";

async function post(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = (await response.json()) as { error?: string };
    throw new Error(result.error ?? "Müzik işlemi başarısız.");
  }
}
export class FileMusicPlayer {
  readonly media = new Audio();
  readonly clock = new BeatClock();
  private preview = new BeatClock();
  private epoch = performance.now() / 1000;
  private context: AudioContext | undefined;
  private gain: GainNode | undefined;
  private source: MediaElementAudioSourceNode | undefined;
  private worklet: AudioWorkletNode | undefined;
  private library: MusicLibrary | undefined;
  private track: MusicTrack | undefined;
  private generation = 0;
  private lastSequence = -1;
  private lastObserved = -10;
  private detector = new OnsetDetector();
  private onsets: Onset[] = [];
  private onsetErrors: number[] = [];
  private analysisSent = false;
  private analysisStart = 0;
  private lastAnalysisVersion = -1;
  private lastRmsContext = 0;
  private volume = 45;
  private paused = false;
  private waiting = false;
  private disposed = false;
  private loadingAbort: AbortController | undefined;
  unlocked = false;
  error: string | null = null;
  onError: (error: unknown) => void = console.error;
  constructor() {
    this.preview.anchor(0, 0, true);
    this.media.preload = "metadata";
    this.media.crossOrigin = "anonymous";
    this.media.onplaying = () => {
      this.waiting = false;
      this.anchor(true);
    };
    this.media.onpause = () => this.anchor(false);
    this.media.onwaiting = () => {
      this.waiting = true;
      this.anchor(false);
    };
    this.media.onseeking = () => {
      this.anchor(false);
      this.detector = new OnsetDetector();
      this.onsets = [];
      this.onsetErrors = [];
      this.analysisStart = this.media.currentTime;
    };
    this.media.onseeked = () =>
      this.anchor(!this.media.paused && !this.waiting);
    this.media.onerror = () => {
      if (this.disposed || !this.track) return;
      this.fail(
        new Error("Ses dosyası okunamadı veya tarayıcı bu codec’i çözemedi."),
      );
      this.media.pause();
    };
    this.media.onended = () => {
      this.anchor(false);
      if (!this.library) return;
      void post("/api/music/transport", {
        action: "ended",
        expectedSequence: this.library.transport.sequence,
      }).catch((error: unknown) => this.fail(error));
    };
  }
  private fail(error: unknown) {
    this.error =
      error instanceof Error ? error.message : "Müzik işlemi başarısız.";
    this.onError(error);
  }
  get playing() {
    return (
      this.unlocked &&
      this.context?.state === "running" &&
      !this.media.paused &&
      !this.media.ended &&
      !this.waiting
    );
  }
  get dance(): DanceStyle {
    return this.track ? this.clock.grid.dance : this.preview.grid.dance;
  }
  get currentTrack() {
    return this.track;
  }
  get sequence() {
    return this.library?.transport.sequence ?? 0;
  }
  get analysisSeconds() {
    return this.onsets.length > 1
      ? this.onsets.at(-1)!.time - this.onsets[0]!.time
      : 0;
  }
  private anchor(running: boolean) {
    if (this.context)
      this.clock.anchor(
        this.context.currentTime,
        this.media.currentTime || 0,
        running,
      );
  }
  setDance(dance: "halay" | "horon") {
    // The game setting controls silent preview only. Real songs use explicit track metadata.
    if (!this.track)
      this.preview.setGrid(
        {
          ...this.preview.grid,
          dance,
          beatsPerBar: dance === "horon" ? 7 : 2,
          beatUnit: dance === "horon" ? 8 : 4,
        },
        true,
      );
  }
  setVolume(volume: number) {
    this.volume = volume;
    if (this.context && this.gain)
      this.gain.gain.setTargetAtTime(
        volume / 100,
        this.context.currentTime,
        0.08,
      );
  }
  async unlock() {
    if (!this.context) {
      const context = new AudioContext();
      this.context = context;
      this.gain = context.createGain();
      this.gain.gain.value = this.volume / 100;
      this.source = context.createMediaElementSource(this.media);
    }
    if (!this.worklet) {
      await this.context.audioWorklet.addModule("/audio-level-worklet.js");
      this.worklet = new AudioWorkletNode(this.context, "halay-level-tap");
      this.source!.connect(this.worklet);
      this.worklet.connect(this.gain!);
      this.gain!.connect(this.context.destination);
      this.worklet.port.onmessage = (
        event: MessageEvent<{ contextTime: number; rms: number }>,
      ) => this.onLevel(event.data);
    }
    await this.context.resume();
    this.unlocked = true;
    this.error = null;
    if (this.library?.transport.playing && !this.paused && this.track)
      await this.media.play();
  }
  async toggle() {
    const wasUnlocked = this.unlocked;
    await this.unlock();
    if (!this.track) return;
    if (!wasUnlocked && this.library?.transport.playing) return;
    await post("/api/music/transport", {
      action: this.playing ? "pause" : "play",
    });
  }
  async setPaused(paused: boolean) {
    this.paused = paused;
    if (!this.context) return;
    if (paused) {
      this.media.pause();
      await this.context.suspend();
    } else if (this.unlocked) {
      await this.context.resume();
      if (this.library?.transport.playing && this.track)
        await this.media.play();
    }
  }
  applyLibrary(library: MusicLibrary) {
    const previousId = this.track?.id;
    const previousPlaying = this.library?.transport.playing;
    this.library = library;
    this.track = library.tracks.find((t) => t.id === library.transport.trackId);
    if (this.track) {
      const grid = {
        bpm: this.track.bpm,
        firstBeatSec: this.track.firstBeatSec,
        beatsPerBar: this.track.beatsPerBar,
        beatUnit: this.track.beatUnit,
        calibrationMs: this.track.calibrationMs,
        dance: this.track.dance,
      };
      this.clock.setGrid(grid, previousId !== this.track.id || !this.playing);
      if (previousId !== this.track.id) {
        this.clock.driftMs.length = 0;
        this.lastObserved = -10;
      }
      if (
        previousId !== this.track.id ||
        this.track.analysisVersion !== this.lastAnalysisVersion
      ) {
        this.analysisSent = false;
        this.onsets = [];
        this.detector = new OnsetDetector();
        this.onsetErrors = [];
        this.analysisStart =
          previousId !== this.track.id ? 0 : this.media.currentTime;
        this.lastAnalysisVersion = this.track.analysisVersion;
      }
    }
    if (
      library.transport.sequence !== this.lastSequence ||
      previousId !== this.track?.id ||
      previousPlaying !== library.transport.playing
    ) {
      this.lastSequence = library.transport.sequence;
      void this.applyTransport(previousId !== this.track?.id).catch(
        (error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError"))
            this.fail(error);
        },
      );
    }
  }
  private async applyTransport(changedTrack: boolean) {
    this.loadingAbort?.abort();
    const controller = new AbortController();
    this.loadingAbort = controller;
    const token = ++this.generation;
    const transport = this.library!.transport;
    this.error = null;
    if (!this.track) {
      this.media.pause();
      this.media.removeAttribute("src");
      this.media.load();
      return;
    }
    if (changedTrack) {
      this.media.pause();
      this.waiting = true;
      this.media.src = `/api/music/audio/${this.track.id}`;
      this.media.load();
      await new Promise<void>((resolve, reject) => {
        const loaded = () => {
          cleanup();
          resolve();
        };
        const failed = () => {
          cleanup();
          reject(new Error("Ses dosyası yüklenemedi."));
        };
        const timeout = setTimeout(failed, 15_000);
        const aborted = () => {
          cleanup();
          reject(new DOMException("Track changed", "AbortError"));
        };
        const cleanup = () => {
          clearTimeout(timeout);
          this.media.removeEventListener("loadedmetadata", loaded);
          this.media.removeEventListener("error", failed);
          controller.signal.removeEventListener("abort", aborted);
        };
        this.media.addEventListener("loadedmetadata", loaded, { once: true });
        this.media.addEventListener("error", failed, { once: true });
        controller.signal.addEventListener("abort", aborted, { once: true });
      });
      if (token !== this.generation || this.disposed) return;
    }
    if (
      changedTrack ||
      ["seek", "next", "previous", "ended"].includes(transport.action)
    )
      this.media.currentTime = transport.positionSec;
    this.waiting = false;
    this.anchor(false);
    if (transport.playing && this.unlocked && !this.paused) {
      if (this.gain && this.context && changedTrack) {
        this.gain.gain.setValueAtTime(0, this.context.currentTime);
        this.gain.gain.linearRampToValueAtTime(
          this.volume / 100,
          this.context.currentTime + 0.15,
        );
      }
      await this.media.play();
    } else this.media.pause();
  }
  beatFrame(): BeatFrame {
    if (!this.track)
      return this.preview.frame(performance.now() / 1000 - this.epoch);
    const now = this.context?.currentTime ?? 0;
    if (this.context && now - this.lastObserved > 0.25) {
      this.lastObserved = now;
      this.clock.observe(
        now,
        this.media.currentTime,
        this.playing && !this.media.seeking,
      );
    }
    return this.clock.frame(now);
  }
  rhythm(fallback: number) {
    return this.track ? this.beatFrame().mediaSeconds : fallback;
  }
  private onLevel(level: { contextTime: number; rms: number }) {
    if (!this.playing || !this.track || !this.library || this.disposed) return;
    this.lastRmsContext = level.contextTime;
    const mediaTime = this.clock.mediaAt(level.contextTime);
    const onset = this.detector.update(mediaTime, level.rms);
    if (!onset) return;
    this.onsets.push(onset);
    while (this.onsets.length > 300 || this.onsets[0]!.time < mediaTime - 30)
      this.onsets.shift();
    this.onsetErrors.push(this.clock.onsetError(mediaTime));
    if (this.onsetErrors.length > 600) this.onsetErrors.shift();
    if (!this.analysisSent && mediaTime - this.analysisStart >= 12) {
      const analysis = analyzeRhythm(this.onsets);
      if (!analysis) return;
      this.analysisSent = true;
      const automatic =
        this.track.bpmSource === "default" && analysis.confidence >= 0.65;
      void post(`/api/music/tracks/${this.track.id}`, {
        analysis,
        ...(automatic
          ? {
              bpm: analysis.bpm,
              firstBeatSec: analysis.firstBeatSec,
              bpmSource: "analysis",
            }
          : {}),
      }).catch((error: unknown) => {
        this.analysisSent = false;
        this.fail(error);
      });
    }
  }
  diagnostics() {
    const frame = this.beatFrame();
    return {
      trackId: this.track?.id ?? null,
      sequence: this.sequence,
      mediaSeconds: this.media.currentTime || 0,
      durationSec: Number.isFinite(this.media.duration)
        ? this.media.duration
        : 0,
      playing: this.playing,
      unlocked: this.unlocked,
      error: this.error,
      bpm: this.track ? this.clock.grid.bpm : 120,
      beat: frame.beat,
      bar: frame.bar,
      driftP95Ms: quantile(this.clock.driftMs),
      onsetErrorP95Ms: this.onsetErrors.length
        ? quantile(this.onsetErrors)
        : null,
      onsetSamples: this.onsetErrors.length,
      analysisSeconds: this.analysisSeconds,
      // Useful in exported evidence: RMS messages are timestamped in the audio rendering thread.
      audioRenderSeconds: this.lastRmsContext,
    };
  }
  async dispose() {
    this.disposed = true;
    this.generation++;
    this.loadingAbort?.abort();
    this.media.pause();
    this.media.removeAttribute("src");
    this.media.load();
    if (this.worklet) {
      this.worklet.port.onmessage = null;
      this.worklet.disconnect();
    }
    this.source?.disconnect();
    this.gain?.disconnect();
    await this.context?.close();
  }
}
