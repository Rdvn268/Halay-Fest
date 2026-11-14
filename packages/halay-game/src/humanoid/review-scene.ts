import * as T from "three";
import type { GameSnapshot, LiveEvent } from "@halay/contracts";
import { buildWeddingCourtyard } from "./courtyard.js";
import { FileMusicPlayer } from "../file-music.js";
import { quantile } from "../beat-clock.js";
import { loadReviewHumanoids } from "./assets.js";
import { FootContacts, setWorldRotation } from "./contact.js";
import { QUATERNIUS_RIG, solveLimb, importMotion } from "./rig.js";
import { retargetHumanoid } from "./retarget.js";
import { parseMotionManifest } from "./motion-manifest.js";
import type { ContactStudy } from "./studies.js";
import { sequenceFrame } from "./sequence.js";

type Library = Awaited<ReturnType<typeof loadReviewHumanoids>>;
type Actor = ReturnType<Library["make"]> & {
  group: T.Group;
  mixer: T.AnimationMixer;
  contacts: FootContacts;
  name: string;
  blend: { bone: T.Bone; p: T.Vector3; q: T.Quaternion }[];
  glow: T.Mesh;
  activeClip: T.AnimationClip | undefined;
  action: T.AnimationAction | undefined;
};
export interface ReviewMetrics {
  ready: boolean;
  actors: number;
  figure: string;
  phase: number;
  beat: number;
  mediaSeconds: number;
  palmGapMeters: number;
  footDriftMeters: number;
  footSpeedMps: number;
  ikResidualMeters: number;
  contacts: number;
  fps: number;
  frameP95Ms: number;
  triangles: number;
  drawCalls: number;
  clockP95Ms: number;
  onsetGridP95Ms: number | null;
  onsetSamples: number;
  heapMB: number | null;
  playing: boolean;
  approved: false;
  blockedDance: boolean;
}
export class HumanoidReviewScene {
  readonly music = new FileMusicPlayer();
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(40, 1, 0.1, 120);
  private renderer: T.WebGLRenderer;
  private observer: ResizeObserver;
  private library: Library | undefined;
  private actors: Actor[] = [];
  private snapshot: GameSnapshot | undefined;
  private view: "front" | "side" | "auto" = "front";
  private frame = 0;
  private previous = performance.now();
  private previousBeat = 0;
  private stamp = 0;
  private elapsed = 0;
  private lastCycle = -1;
  private blendStart = 0;
  private song = "";
  private frames: number[] = [];
  private disposed = false;
  private externalStudies: ContactStudy[][] = [];
  private countOverride: number | undefined;
  private cameraOccluders: { object: T.Object3D; bounds: T.Box3 }[] = [];
  private stopRecording: (() => void) | undefined;
  private recordingCanvas: HTMLCanvasElement | undefined;
  private recordingContext: CanvasRenderingContext2D | undefined;
  private lastCaptureTime = 0;
  constructor(
    private host: HTMLElement,
    private onFrame: (m: ReviewMetrics) => void,
    private onError: (e: unknown) => void,
  ) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Humanoid halay inceleme sahnesi",
    );
    host.append(this.renderer.domElement);
    this.scene.background = new T.Color("#455975");
    this.scene.fog = new T.Fog("#62718a", 30, 85);
    buildWeddingCourtyard(this.scene);
    this.scene.updateMatrixWorld(true);
    this.scene.traverse((object) => {
      if (object.userData["cameraOccluder"])
        this.cameraOccluders.push({
          object,
          bounds: new T.Box3().setFromObject(object),
        });
    });
    this.camera.position.set(0, 3.1, 11);
    this.camera.lookAt(0, 1, 0);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    this.music.onError = onError;
    void loadReviewHumanoids()
      .then((lib) => {
        if (this.disposed) {
          lib.dispose();
          return;
        }
        this.library = lib;
        this.populate();
      })
      .catch(onError);
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  setView(view: "front" | "side" | "auto") {
    this.view = view;
  }
  async recordCycle(seconds = 16): Promise<Blob> {
    if (this.stopRecording) throw new Error("Kayıt zaten sürüyor.");
    if (!this.music.playing)
      throw new Error("Sesli kayıt için önce müzik çalmalı.");
    if (!this.library)
      throw new Error("Modeller yüklenmeden kayıt başlatılamaz.");
    if (!Number.isFinite(seconds) || seconds < 4 || seconds > 60)
      throw new Error("Kayıt süresi 4–60 saniye olmalı.");
    const mimeType = "video/webm;codecs=vp8,opus";
    if (
      typeof MediaRecorder === "undefined" ||
      !MediaRecorder.isTypeSupported(mimeType)
    )
      throw new Error("Tarayıcı VP8/Opus WebM kaydını desteklemiyor.");
    // Capture actual render frames plus the truthful HUD, not a silent/raw WebGL-only crop.
    // Wait for the portrait framing CSS, then render at the actual 1080x1920 output resolution.
    this.recordingCanvas = document.createElement("canvas");
    this.recordingCanvas.width = 1080;
    this.recordingCanvas.height = 1920;
    this.recordingContext =
      this.recordingCanvas.getContext("2d", { alpha: false }) ?? undefined;
    if (!this.recordingContext) {
      this.recordingCanvas = undefined;
      throw new Error("Kayıt canvas'ı açılamadı.");
    }
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    this.resize();
    const audio = this.music.recordingAudio();
    const video = this.recordingCanvas.captureStream(30);
    const stream = new MediaStream([
      ...video.getVideoTracks(),
      ...audio.stream.getAudioTracks(),
    ]);
    try {
      return await new Promise<Blob>((resolve, reject) => {
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 4_000_000,
          audioBitsPerSecond: 128_000,
        });
        const chunks: Blob[] = [];
        let bytes = 0,
          error: Error | undefined;
        const timer = setTimeout(() => recorder.stop(), seconds * 1000);
        this.stopRecording = () => {
          if (recorder.state !== "inactive") recorder.stop();
        };
        recorder.ondataavailable = (e) => {
          bytes += e.data.size;
          if (bytes > 24 * 1024 * 1024) {
            error = new Error("Kayıt sınırı 24 MiB aşıldı.");
            this.stopRecording?.();
          } else chunks.push(e.data);
        };
        recorder.onerror = () => {
          error = new Error("Tarayıcı kayıt hatası.");
          this.stopRecording?.();
        };
        recorder.onstop = () => {
          clearTimeout(timer);
          if (error) reject(error);
          else resolve(new Blob(chunks, { type: mimeType }));
        };
        recorder.start(500);
      });
    } finally {
      this.stopRecording = undefined;
      for (const t of video.getTracks()) t.stop();
      audio.dispose();
      this.recordingCanvas = undefined;
      this.recordingContext = undefined;
      this.resize();
    }
  }
  /** Manual stress switch is review-only; never changes capacity or creates fake users in the gateway. */
  setReviewCount(count: number | undefined) {
    this.countOverride = count;
    this.populate();
    for (const actor of this.actors) actor.contacts.reset();
  }
  sync(snapshot: GameSnapshot) {
    this.snapshot = snapshot;
    this.music.setVolume(snapshot.settings.musicVolume);
    void this.music.setPaused(snapshot.paused).catch(this.onError);
    this.populate();
  }
  event(event: LiveEvent) {
    if (event.type === "gift") this.stamp = this.elapsed + 2;
  }
  private populate() {
    if (!this.library) return;
    const names =
      this.countOverride !== undefined
        ? Array.from({ length: this.countOverride }, (_, i) => `TEST ${i + 1}`)
        : [
            ...Array.from(
              { length: this.snapshot?.settings.npc ?? 6 },
              (_, i) => `NPC ${i + 1}`,
            ),
            ...(this.snapshot?.players.map((p) => p.displayName) ?? []),
          ];
    if (
      names.length === this.actors.length &&
      names.every((n, i) => n === this.actors[i]!.name)
    )
      return;
    const wasEmpty = this.actors.length === 0;
    while (this.actors.length > names.length) this.remove(this.actors.pop()!);
    names.slice(0, 106).forEach((name, i) => {
      if (this.actors[i]) {
        this.actors[i]!.name = name;
        this.actors[i]!.skins.forEach((m) => {
          m.castShadow = names.length <= 12;
        });
        return;
      }
      const actor = this.library!.make(i);
      const group = new T.Group();
      group.add(actor.model);
      this.scene.add(group);
      actor.skins.forEach((m) => {
        m.castShadow = names.length <= 12;
        m.receiveShadow = true;
        m.frustumCulled = false;
      });
      const glow = new T.Mesh(
        new T.TorusGeometry(0.4, 0.015, 5, 32),
        new T.MeshBasicMaterial({
          color: "#f6c878",
          transparent: true,
          opacity: 0,
        }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.01;
      group.add(glow);
      this.actors.push({
        ...actor,
        group,
        mixer: new T.AnimationMixer(actor.model),
        contacts: new FootContacts(),
        name,
        blend: [],
        glow,
        activeClip: undefined,
        action: undefined,
      });
    });
    this.frames = [];
    if (wasEmpty) this.lastCycle = -1;
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, names.length > 12 ? 1 : 1.25),
    );
  }
  private remove(a: Actor) {
    a.mixer.stopAllAction();
    a.mixer.uncacheRoot(a.model);
    for (const s of new Set(a.skins.map((m) => m.skeleton))) s.dispose();
    a.glow.geometry.dispose();
    (a.glow.material as T.Material).dispose();
    a.group.removeFromParent();
  }
  private resize() {
    const w = this.host.clientWidth,
      h = Math.max(1, this.host.clientHeight);
    this.renderer.setPixelRatio(
      this.recordingCanvas
        ? 1
        : Math.min(devicePixelRatio || 1, this.actors.length > 12 ? 1 : 1.25),
    );
    this.renderer.setSize(
      this.recordingCanvas ? 1080 : w,
      this.recordingCanvas ? 1920 : h,
      false,
    );
    this.camera.aspect = this.recordingCanvas ? 9 / 16 : w / h;
    this.camera.updateProjectionMatrix();
  }
  async addMotion(file: File, raw: unknown) {
    if (!this.library) throw new Error("Models are not ready");
    if (this.externalStudies.length >= 2)
      throw new Error(
        "Review sequence limit: two imported figures; reload before replacing",
      );
    const manifest = parseMotionManifest(raw);
    if (file.size > 32 * 1024 * 1024)
      throw new Error("Motion import limit: 32 MiB");
    const data = await file.arrayBuffer();
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    if (hash !== manifest.sha256) throw new Error("Motion SHA-256 mismatch");
    const format = file.name.split(".").at(-1)?.toLowerCase();
    if (format !== "fbx" && format !== "glb" && format !== "gltf")
      throw new Error("Use FBX / GLB / self-contained glTF");
    const source = await importMotion(data, format),
      clip = source.animations.find((c) => c.name === manifest.clip);
    if (!clip) throw new Error("Named animation clip not found");
    // Source statements are recorded, not automatically promoted to verified license/production acceptance.
    const prepared = this.library.variants.map((v) => {
      const baked = retargetHumanoid(
        source.scene,
        v.model,
        clip,
        manifest.rig,
        QUATERNIUS_RIG,
      );
      return {
        id: `import_${hash.slice(0, 10)}_${clip.name}`,
        label: `İçe aktarılan: ${clip.name} · izin incelemesi açık`,
        clip: baked,
        beats: manifest.beats,
        rootAt: (phase: number) => {
          const ks = manifest.rootMotion;
          let i = 1;
          while (i < ks.length - 1 && ks[i]!.phase < phase) i++;
          const a = ks[i - 1]!,
            b = ks[i]!,
            t = T.MathUtils.clamp(
              (phase - a.phase) / (b.phase - a.phase),
              0,
              1,
            );
          return new T.Vector3(
            T.MathUtils.lerp(a.x, b.x, t),
            0,
            T.MathUtils.lerp(a.z, b.z, t),
          );
        },
        contactsAt: (phase: number, cycle: number) =>
          Object.fromEntries(
            (["L", "R"] as const).map((side) => {
              const index = manifest.contacts.findIndex(
                (c) => c.side === side && phase >= c.start && phase < c.end,
              );
              return [side, index < 0 ? null : `${hash}:${cycle}:${index}`];
            }),
          ) as Record<"L" | "R", string | null>,
        provenance: {
          kind: manifest.provenance.kind,
          license: manifest.provenance.license,
          regionalApproval: false as const,
        },
      };
    });
    // Keep a bounded two-figure review sequence; never retain unbounded uploaded bytes/clips.
    this.externalStudies.push(prepared);
    this.lastCycle = -1;
    source.scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          for (const v of Object.values(m))
            if (v instanceof T.Texture) v.dispose();
          m.dispose();
        }
      }
    });
  }
  private tick(now: number) {
    if (this.disposed) return;
    this.frame = requestAnimationFrame((t) => this.tick(t));
    const dt = Math.max(0, (now - this.previous) / 1000);
    this.previous = now;
    this.elapsed += dt;
    this.frames.push(dt * 1000);
    if (this.frames.length > 600) this.frames.shift();
    const f = this.music.beatFrame(),
      beat = Math.max(0, f.beat);
    const blockedDance = f.dance !== "halay";
    const studies = this.externalStudies.length
      ? this.externalStudies.map((s) => s[0]!)
      : (this.actors[0]?.studies ?? []);
    // Sequence duration is explicit in musical beats; changes occur at figure/bar boundaries.
    const seq = studies.length
      ? sequenceFrame(studies, beat, f.beatsPerBar)
      : { index: 0, phase: 0, cycle: 0, travel: new T.Vector3() };
    const which = seq.index;
    const active = studies[which],
      phase = seq.phase,
      cycle = seq.cycle;
    const song = this.music.currentTrack?.id ?? "silent";
    if (
      cycle !== this.lastCycle ||
      song !== this.song ||
      Math.abs(beat - this.previousBeat) > 1
    ) {
      this.lastCycle = cycle;
      this.song = song;
      this.blendStart = f.mediaSeconds;
      for (const a of this.actors) {
        a.blend = [];
        a.model.traverse((o) => {
          if (o instanceof T.Bone)
            a.blend.push({
              bone: o,
              p: o.position.clone(),
              q: o.quaternion.clone(),
            });
        });
        a.contacts.reset();
      }
    }
    this.previousBeat = beat;
    let footDriftMeters = 0,
      footSpeedMps = 0,
      ikResidualMeters = 0,
      contacts = 0,
      palmGapMeters = 0;
    const columns = this.actors.length > 12 ? 12 : 6;
    const width = Math.min(columns, this.actors.length),
      rows = Math.ceil(this.actors.length / columns);
    if (active && !blockedDance)
      for (const [i, a] of this.actors.entries()) {
        const study = this.externalStudies.length
          ? this.externalStudies[which]![i % 2]!
          : a.studies[which]!;
        const root = seq.travel;
        a.group.position.set(
          ((i % columns) - (width - 1) / 2) * 0.94 + root.x,
          0.23,
          (Math.floor(i / columns) - (rows > 2 ? (rows - 1) / 2 : 0)) * 1.35 +
            root.z,
        );
        if (a.activeClip !== study.clip) {
          a.mixer.stopAllAction();
          a.action = a.mixer.clipAction(study.clip);
          a.action.play();
          a.action.paused = true;
          a.activeClip = study.clip;
        }
        const action = a.action!;
        action.time = Math.min(
          study.clip.duration - 1e-6,
          phase * study.clip.duration,
        );
        a.mixer.update(0);
        // A bounded relaxed finger pose; these are not anatomically validated grasp/contact dynamics.
        a.model.traverse((o) => {
          if (o instanceof T.Bone) {
            const finger =
              /(?:index|middle|ring|pinky)_(01|02|03)_([lr])$/.exec(o.name);
            if (finger) o.rotateX(finger[1] === "01" ? 0.35 : 0.65);
          }
        });
        const blend = T.MathUtils.smoothstep(
          f.mediaSeconds - this.blendStart,
          0,
          0.3,
        );
        for (const x of a.blend) {
          x.bone.quaternion.slerpQuaternions(x.q, x.bone.quaternion, blend);
          x.bone.position.lerpVectors(x.p, x.bone.position, blend);
        }
        if (blend === 1) a.blend = [];
        a.group.updateMatrixWorld(true);
        const metric = a.contacts.apply(
          a.rig,
          study.contactsAt(phase, cycle),
          dt,
        );
        footDriftMeters = Math.max(footDriftMeters, metric.drift);
        footSpeedMps = Math.max(footSpeedMps, metric.speed);
        ikResidualMeters = Math.max(ikResidualMeters, metric.residual);
        contacts += metric.count;
        // Free end hands must not remain in the asset's T-pose. Linked palms override these relaxed targets.
        for (const side of ["L", "R"] as const) {
          const hand = a.rig[`hand${side}`],
            q = hand.getWorldQuaternion(new T.Quaternion());
          const axis = new T.Vector3(0, 1, 0).applyQuaternion(q);
          const relaxed = new T.Quaternion()
            .setFromUnitVectors(axis, new T.Vector3(0, -1, 0.15).normalize())
            .multiply(q);
          const target = a.group.position
            .clone()
            .add(new T.Vector3(side === "L" ? 0.29 : -0.29, 0.95, 0.1));
          solveLimb(
            a.rig[`upperArm${side}`],
            a.rig[`lowerArm${side}`],
            hand,
            target,
            new T.Vector3(0, -1, 0.3),
          );
          setWorldRotation(hand, relaxed);
        }
        (a.glow.material as T.MeshBasicMaterial).opacity =
          this.elapsed < this.stamp ? 0.8 : 0;
      }
    if (active && !blockedDance)
      for (let i = 0; i < this.actors.length - 1; i++) {
        if ((i + 1) % columns === 0) continue;
        const a = this.actors[i]!,
          b = this.actors[i + 1]!;
        const midpoint = a.group.position
          .clone()
          .add(b.group.position)
          .multiplyScalar(0.5);
        midpoint.y += 1.03;
        const connect = (actor: Actor, side: "L" | "R") => {
          const hand = actor.rig[`hand${side}`],
            q = hand.getWorldQuaternion(new T.Quaternion());
          const palm = hand
            .localToWorld(new T.Vector3(0, 0.075, 0))
            .sub(hand.getWorldPosition(new T.Vector3()));
          ikResidualMeters = Math.max(
            ikResidualMeters,
            solveLimb(
              actor.rig[`upperArm${side}`],
              actor.rig[`lowerArm${side}`],
              hand,
              midpoint.clone().sub(palm),
              new T.Vector3(0, -1, 0.4),
            ),
          );
          setWorldRotation(hand, q);
          return hand.localToWorld(new T.Vector3(0, 0.075, 0));
        };
        palmGapMeters = Math.max(
          palmGapMeters,
          connect(a, "L").distanceTo(connect(b, "R")),
        );
      }
    const extent = Math.max(
        2.8,
        (width * 0.94) / 2 + 0.6,
        (rows * 1.35) / 2 + 1,
      ),
      distance =
        extent /
        Math.tan(T.MathUtils.degToRad(this.camera.fov / 2)) /
        Math.min(1, this.camera.aspect);
    const angle =
      this.view === "front"
        ? 0
        : this.view === "side"
          ? 1.25
          : 0.4 + this.elapsed * 0.045;
    this.camera.position.lerp(
      new T.Vector3(
        Math.sin(angle) * distance,
        2.5,
        Math.cos(angle) * distance,
      ).add(new T.Vector3(seq.travel.x, 0, seq.travel.z)),
      Math.min(1, dt * 3),
    );
    this.camera.lookAt(seq.travel.x, 1.05, seq.travel.z);
    // Fixed inspection views must expose the actual feet/hands, including from the side.
    // Hide whole architectural groups rather than changing shared materials or editing screenshots.
    for (const occluder of this.cameraOccluders) {
      occluder.object.visible = true;
      for (const actor of this.actors.slice(0, 6)) {
        for (const height of [0.3, 1.65]) {
          const target = actor.group.position
            .clone()
            .add(new T.Vector3(0, height, 0));
          const delta = target.sub(this.camera.position),
            distance = delta.length();
          const hit = new T.Ray(
            this.camera.position,
            delta.normalize(),
          ).intersectBox(occluder.bounds, new T.Vector3());
          if (hit && hit.distanceTo(this.camera.position) < distance) {
            occluder.object.visible = false;
            break;
          }
        }
        if (!occluder.object.visible) break;
      }
    }
    this.renderer.render(this.scene, this.camera);
    if (
      this.recordingCanvas &&
      this.recordingContext &&
      now - this.lastCaptureTime >= 1000 / 30
    ) {
      this.lastCaptureTime = now;
      const ctx = this.recordingContext;
      ctx.drawImage(this.renderer.domElement, 0, 0, 1080, 1920);
      ctx.fillStyle = "rgba(20,29,39,.92)";
      ctx.fillRect(22, 22, 1036, 150);
      ctx.fillStyle = "#f1d1a0";
      ctx.font = "600 26px Segoe UI, sans-serif";
      ctx.fillText("HALAY FEST · TEKNİK İNCELEME", 42, 63);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px Segoe UI, sans-serif";
      ctx.fillText(active?.label ?? "Model bekleniyor", 42, 103, 990);
      ctx.fillStyle = "#f1d1a0";
      ctx.font = "21px Segoe UI, sans-serif";
      ctx.fillText(
        `Ses saati · vuruş ${f.beat.toFixed(2)} · Yöresel doğruluk / kullanıcı kabulü AÇIK`,
        42,
        143,
        990,
      );
      ctx.fillStyle = "rgba(20,29,39,.92)";
      ctx.fillRect(22, 1840, 1036, 58);
      ctx.fillStyle = "#f1d1a0";
      ctx.font = "22px Segoe UI, sans-serif";
      ctx.fillText(
        "Özgün temas çalışması · Onaylı gerçek Halay performansı değildir.",
        42,
        1877,
        990,
      );
    }
    this.renderer.domElement.dataset["assetReady"] = String(
      Boolean(this.library),
    );
    const heap = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory;
    const audio = this.music.diagnostics();
    this.onFrame({
      ready: Boolean(this.library),
      actors: this.actors.length,
      figure: active?.label ?? "Model yükleniyor",
      phase,
      beat,
      mediaSeconds: f.mediaSeconds,
      palmGapMeters,
      footDriftMeters,
      footSpeedMps,
      ikResidualMeters,
      contacts,
      fps: this.frames.length
        ? 1000 / (this.frames.reduce((a, b) => a + b, 0) / this.frames.length)
        : 0,
      frameP95Ms: quantile(this.frames),
      triangles: this.renderer.info.render.triangles,
      drawCalls: this.renderer.info.render.calls,
      clockP95Ms: quantile(this.music.clock.driftMs),
      onsetGridP95Ms: audio.onsetErrorP95Ms,
      onsetSamples: audio.onsetSamples,
      heapMB: heap ? heap.usedJSHeapSize / 1048576 : null,
      playing: this.music.playing,
      approved: false,
      blockedDance,
    });
  }
  async dispose() {
    this.disposed = true;
    this.stopRecording?.();
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    for (const a of this.actors) this.remove(a);
    this.actors = [];
    this.library?.dispose();
    const resources = new Set<T.BufferGeometry | T.Material | T.Texture>();
    this.scene.traverse((o) => {
      if (o instanceof T.DirectionalLight) o.shadow.dispose();
      if (o instanceof T.Mesh) {
        resources.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          resources.add(m);
          for (const v of Object.values(m))
            if (v instanceof T.Texture) resources.add(v);
        }
      }
    });
    for (const r of resources) r.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    await this.music.dispose();
  }
}
