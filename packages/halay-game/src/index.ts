import * as THREE from "three";
import type { GameSnapshot, LiveEvent, GiftKind } from "@halay/contracts";
import { defaultSettings, giftSchema } from "@halay/contracts";
import { buildEnvironment } from "./environment.js";
import { RiggedDancers } from "./rigged-dancers.js";
import type { RigDancer } from "./rigged-dancers.js";
import { FileMusicPlayer } from "./file-music.js";
import type { DanceStyle } from "@halay/contracts";
import { quantile } from "./beat-clock.js";
import { advanceRound } from "./round-time.js";
export { MUSIC } from "./rhythm.js";

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.DirectionalLight) child.shadow.dispose();
    if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
      if (child instanceof THREE.Mesh) child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const material of materials) {
        if ("map" in material && material.map instanceof THREE.Texture)
          material.map.dispose();
        material.dispose();
      }
    }
  });
  object.removeFromParent();
}
export interface SceneMetrics {
  frames: number;
  elapsed: number;
  remaining: number;
  round: number;
  players: number;
  npc: number;
  dance: DanceStyle;
  musicPlaying: boolean;
  paused: boolean;
  fps: number;
  frameP95Ms: number;
  heapMB: number | null;
  drawCalls: number;
  triangles: number;
  rigs: number;
  clip: string;
  handGapMeters: number;
}
export class HalayScene {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, 0.1, 150);
  private renderer: THREE.WebGLRenderer;
  private observer: ResizeObserver;
  private rigs: RiggedDancers | undefined;
  private dancers: RigDancer[] = [];
  private players = new Map<string, RigDancer>();
  private snapshot: GameSnapshot | undefined;
  readonly music = new FileMusicPlayer();
  private frameTimes: number[] = [];
  private profiledCount = -1;
  private cameraExtent = 2.75;
  private elapsed = 0;
  private period = 0;
  private round = 1;
  private camTick = 0;
  private camMode = 0;
  private ambientTick = 0;
  private lastTime = performance.now();
  private frame = 0;
  private frames = 0;
  private disposed = false;
  private locallyPaused = false;
  private particles: {
    mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
    life: number;
    velocity: THREE.Vector3;
    spin: number;
  }[] = [];
  constructor(
    private container: HTMLElement,
    private onFrame: (metrics: SceneMetrics) => void,
    private onError: (error: unknown) => void = console.error,
  ) {
    this.music.onError = onError;
    this.scene.background = new THREE.Color("#27364a");
    this.scene.fog = new THREE.Fog("#46505a", 35, 90);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "3D Halay Fest sahnesi",
    );
    container.append(this.renderer.domElement);
    buildEnvironment(this.scene);
    void RiggedDancers.load()
      .then((rigs) => {
        if (this.disposed) {
          rigs.dispose();
          return;
        }
        this.rigs = rigs;
        this.syncNpcs(this.snapshot?.settings.npc ?? defaultSettings.npc);
        if (this.snapshot) this.sync(this.snapshot);
        this.renderer.domElement.dataset["assetReady"] = "true";
      })
      .catch(this.onError);
    this.camera.position.set(12, 9, 16);
    this.camera.lookAt(0, 1, -1);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    this.syncNpcs(defaultSettings.npc);
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }
  private resize() {
    const w = this.container.clientWidth,
      h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  private layout() {
    this.rigs?.layout(this.dancers);
    this.cameraExtent =
      Math.max(
        1.55,
        ...this.dancers.map((d) => Math.hypot(d.target.x, d.target.z)),
      ) + 1.2;
    if (this.profiledCount !== this.dancers.length) {
      this.frameTimes = [];
      this.profiledCount = this.dancers.length;
    }
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, this.dancers.length > 30 ? 1 : 1.25),
    );
  }
  private syncNpcs(count: number) {
    if (!this.rigs) return;
    if (this.dancers.filter((d) => d.isNpc).length === count) return;
    for (const dancer of this.dancers.filter((d) => d.isNpc))
      this.rigs.remove(dancer);
    this.dancers = this.dancers.filter((d) => !d.isNpc);
    for (let i = 0; i < count; i++)
      this.dancers.unshift(
        this.rigs.make(`NPC · Şenlik Ekibi ${i + 1}`, true, i, this.scene),
      );
    this.layout();
  }
  sync(snapshot: GameSnapshot) {
    if (!this.snapshot || snapshot.round !== this.snapshot.round) {
      this.period = 0;
      this.round = snapshot.round;
      this.locallyPaused = false;
    }
    if (snapshot.paused !== this.snapshot?.paused) {
      void this.music.setPaused(snapshot.paused).catch(this.onError);
      if (!snapshot.paused) this.locallyPaused = false;
    }
    this.snapshot = snapshot;
    this.syncNpcs(snapshot.settings.npc);
    const ids = new Set(snapshot.players.map((p) => p.userId));
    for (const [id, dancer] of this.players)
      if (!ids.has(id)) {
        this.rigs?.remove(dancer);
        this.dancers = this.dancers.filter((d) => d !== dancer);
        this.players.delete(id);
      }
    for (const player of snapshot.players)
      if (!this.players.has(player.userId) && this.rigs) {
        const dancer = this.rigs.make(
          `@${player.displayName}`,
          false,
          this.players.size + 1,
          this.scene,
        );
        this.players.set(player.userId, dancer);
        this.dancers.push(dancer);
      }
    this.layout();
    this.music.setVolume(snapshot.settings.musicVolume);
    this.renderer.domElement.dataset["playerCount"] = String(this.players.size);
  }
  handleEvent(event: LiveEvent) {
    if (event.source !== "mock") return;
    if (event.type === "gift") {
      const kind = giftSchema.safeParse(event.payload["gift"]);
      if (kind.success) this.gift(kind.data, event.userId);
    }
  }
  private gift(kind: GiftKind, userId?: string) {
    const dancer = userId ? this.players.get(userId) : undefined;
    if (dancer) {
      dancer.auraUntil = this.elapsed + 7;
      if (kind === "crown") dancer.crownUntil = this.elapsed + 15;
    }
    const count =
      kind === "fireworks"
        ? 125
        : ["confetti", "drum"].includes(kind)
          ? 75
          : 45;
    for (let i = 0; i < count && this.particles.length < 512; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.18, 0.06),
        new THREE.MeshBasicMaterial({
          color:
            kind === "rose"
              ? "#ef6574"
              : new THREE.Color().setHSL(Math.random(), 0.65, 0.65),
          transparent: true,
        }),
      );
      mesh.position.set(
        (dancer?.group.position.x ?? 0) + (Math.random() - 0.5) * 12,
        4 + Math.random() * 5,
        (dancer?.group.position.z ?? 0) + (Math.random() - 0.5) * 12,
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        life: 2 + Math.random() * 2,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.1,
          -1.6 - Math.random() * 1.8,
          (Math.random() - 0.5) * 1.1,
        ),
        spin: Math.random() * 5,
      });
    }
  }
  private tick(now: number) {
    if (this.disposed) return;
    this.frame = requestAnimationFrame((next) => this.tick(next));
    const wallDt = Math.max(0, (now - this.lastTime) / 1000);
    const dt = Math.min(wallDt, 0.06);
    if (this.frames > 30) {
      this.frameTimes.push(now - this.lastTime);
      if (this.frameTimes.length > 600) this.frameTimes.shift();
    }
    this.lastTime = now;
    const settings = this.snapshot?.settings ?? defaultSettings;
    const paused = (this.snapshot?.paused ?? false) || this.locallyPaused;
    if (!paused) {
      this.elapsed += wallDt;
      this.period += wallDt;
      this.ambientTick += dt;
      const timer = advanceRound(
        this.period,
        this.round,
        settings.duration,
        settings.autoLoop,
      );
      this.period = timer.period;
      this.round = timer.round;
      if (timer.stopped) {
        this.locallyPaused = true;
        void this.music.setPaused(true).catch(this.onError);
      }
      this.music.setDance(
        settings.musicMode === "auto"
          ? Math.floor(this.period / 240) % 2 === 0
            ? "halay"
            : "horon"
          : settings.musicMode,
      );
      this.rigs?.update(
        this.dancers,
        this.music.beatFrame(),
        this.elapsed,
        dt,
        this.music.currentTrack?.id ?? "silent-preview",
      );
      this.camTick += dt;
      if (settings.autoCamera && this.camTick > 17) {
        this.camMode = (this.camMode + 1) % 4;
        this.camTick = 0;
      }
      const t = settings.autoCamera ? this.elapsed : 0;
      const distance =
        (this.cameraExtent /
          Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) /
          Math.min(1, this.camera.aspect)) *
        1.1;
      const views = [
        { elevation: 0.55, a: 0.9 + t * 0.018 },
        { elevation: 0.4, a: -0.55 + t * 0.01 },
        { elevation: 0.32, a: 2.1 + t * 0.02 },
        { elevation: 0.75, a: 1.1 + t * 0.007 },
      ];
      const v = views[this.camMode]!;
      this.camera.position.lerp(
        new THREE.Vector3(
          distance * Math.cos(v.elevation) * Math.cos(v.a),
          1 + distance * Math.sin(v.elevation),
          distance * Math.cos(v.elevation) * Math.sin(v.a),
        ),
        Math.min(1, dt * 0.7),
      );
      this.camera.lookAt(0, 1, 0);
      if (settings.randomEvents && this.ambientTick >= 35) {
        this.ambientTick = 0;
        this.gift("confetti");
      }
      this.particles = this.particles.filter((p) => {
        p.life -= dt;
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.mesh.rotation.x += dt * p.spin;
        p.mesh.rotation.y += dt * p.spin;
        if (p.life < 0) {
          disposeObject(p.mesh);
          return false;
        }
        return true;
      });
    }
    this.rigs?.labels(
      this.dancers,
      this.camera,
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    this.renderer.domElement.dataset["frame"] = String(this.frames);
    this.renderer.domElement.dataset["rigs"] = String(this.dancers.length);
    this.renderer.domElement.dataset["clip"] = this.rigs?.clip ?? "loading";
    this.onFrame({
      frames: this.frames,
      elapsed: this.elapsed,
      remaining: Math.max(0, Math.ceil(settings.duration * 60 - this.period)),
      round: this.round,
      players: this.players.size,
      npc: settings.npc,
      dance: this.music.dance,
      musicPlaying: this.music.playing,
      paused,
      fps: this.frameTimes.length
        ? 1000 /
          (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length)
        : 0,
      frameP95Ms: quantile(this.frameTimes),
      heapMB: (
        performance as Performance & { memory?: { usedJSHeapSize: number } }
      ).memory?.usedJSHeapSize
        ? (performance as Performance & { memory: { usedJSHeapSize: number } })
            .memory.usedJSHeapSize / 1048576
        : null,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      rigs: this.dancers.length,
      clip: this.rigs?.clip ?? "loading",
      handGapMeters: this.rigs?.handGapMeters ?? 0,
    });
  }
  async dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    for (const d of this.dancers) this.rigs?.remove(d);
    this.rigs?.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    await this.music.dispose();
  }
}
