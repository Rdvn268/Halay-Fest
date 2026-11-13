import * as THREE from "three";
import type { GameSnapshot, LiveEvent, GiftKind } from "@halay/contracts";
import { defaultSettings, giftSchema } from "@halay/contracts";
import { buildEnvironment } from "./environment.js";
import { dancerFactory } from "./dancers.js";
import type { Dancer } from "./dancers.js";
import { updateDancers } from "./choreography.js";
import { MusicEngine } from "./music.js";
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
  dance: "halay" | "horon";
  musicPlaying: boolean;
  paused: boolean;
}
export class HalayScene {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, 0.1, 150);
  private renderer: THREE.WebGLRenderer;
  private observer: ResizeObserver;
  private makeDancer: ReturnType<typeof dancerFactory>;
  private dancers: Dancer[] = [];
  private players = new Map<string, Dancer>();
  private snapshot: GameSnapshot | undefined;
  readonly music = new MusicEngine();
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
    this.scene.background = new THREE.Color("#9dbbc4");
    this.scene.fog = new THREE.Fog("#a0bdc1", 25, 65);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "3D Halay Fest sahnesi",
    );
    container.append(this.renderer.domElement);
    buildEnvironment(this.scene);
    this.makeDancer = dancerFactory(this.scene);
    this.camera.position.set(24, 19, 0);
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
    this.dancers.forEach(
      (d, i) =>
        (d.angle = (i / Math.max(1, this.dancers.length)) * Math.PI * 2),
    );
  }
  private syncNpcs(count: number) {
    if (this.dancers.filter((d) => d.isNpc).length === count) return;
    for (const dancer of this.dancers.filter((d) => d.isNpc))
      disposeObject(dancer.group);
    this.dancers = this.dancers.filter((d) => !d.isNpc);
    for (let i = 0; i < count; i++)
      this.dancers.unshift(
        this.makeDancer(`NPC · Şenlik Ekibi ${i + 1}`, true, i),
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
        disposeObject(dancer.group);
        this.dancers = this.dancers.filter((d) => d !== dancer);
        this.players.delete(id);
      }
    for (const player of snapshot.players)
      if (!this.players.has(player.userId)) {
        const dancer = this.makeDancer(
          `@${player.displayName}`,
          false,
          this.players.size + 1,
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
    const dt = Math.min((now - this.lastTime) / 1000, 0.06);
    this.lastTime = now;
    const settings = this.snapshot?.settings ?? defaultSettings;
    const paused = (this.snapshot?.paused ?? false) || this.locallyPaused;
    if (!paused) {
      this.elapsed += dt;
      this.period += dt;
      this.ambientTick += dt;
      if (this.period >= settings.duration * 60) {
        if (settings.autoLoop) {
          this.period = 0;
          this.round++;
        } else {
          this.locallyPaused = true;
          void this.music.setPaused(true).catch(this.onError);
        }
      }
      this.music.setDance(
        settings.musicMode === "auto"
          ? Math.floor(this.period / 240) % 2 === 0
            ? "halay"
            : "horon"
          : settings.musicMode,
      );
      updateDancers(
        this.dancers,
        this.music.rhythm(this.elapsed),
        this.music.dance,
        this.elapsed,
      );
      this.camTick += dt;
      if (settings.autoCamera && this.camTick > 17) {
        this.camMode = (this.camMode + 1) % 4;
        this.camTick = 0;
      }
      const t = this.elapsed;
      const views = [
        { r: 24, y: 19, a: t * 0.018 },
        { r: 19, y: 10, a: -0.55 + t * 0.01 },
        { r: 15, y: 7, a: 2.1 + t * 0.02 },
        { r: 23, y: 24, a: 1.1 + t * 0.007 },
      ];
      const v = views[this.camMode]!;
      this.camera.position.lerp(
        new THREE.Vector3(v.r * Math.cos(v.a), v.y, v.r * Math.sin(v.a)),
        Math.min(1, dt * 0.7),
      );
      this.camera.lookAt(0, 1, -1);
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
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    this.renderer.domElement.dataset["frame"] = String(this.frames);
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
    });
  }
  async dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    await this.music.dispose();
  }
}
