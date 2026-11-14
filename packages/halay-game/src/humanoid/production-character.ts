import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bindHumanoid, cloneHumanoid, type RigMap } from "./rig.js";

/** MPFB's CC0 rig, not an Adobe character or downloaded Mixamo performance. */
export const PRODUCTION_RIG: RigMap = {
  hips: "mixamorigHips",
  spine: "mixamorigSpine",
  chest: "mixamorigSpine2",
  head: "mixamorigHead",
  upperArmL: "mixamorigLeftArm",
  lowerArmL: "mixamorigLeftForeArm",
  handL: "mixamorigLeftHand",
  upperArmR: "mixamorigRightArm",
  lowerArmR: "mixamorigRightForeArm",
  handR: "mixamorigRightHand",
  thighL: "mixamorigLeftUpLeg",
  shinL: "mixamorigLeftLeg",
  footL: "mixamorigLeftFoot",
  thighR: "mixamorigRightUpLeg",
  shinR: "mixamorigRightLeg",
  footR: "mixamorigRightFoot",
};
export type CharacterAngle = "front" | "side" | "face" | "hands" | "feet";

/** Each future participant has independent bones while sharing geometry/materials. No dance fallback. */
export function createProductionInstance(template: T.Object3D) {
  return cloneHumanoid(template, PRODUCTION_RIG);
}

export class ProductionCharacterView {
  readonly renderer: T.WebGLRenderer;
  readonly scene = new T.Scene();
  readonly camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  private controls: OrbitControls;
  private model: T.Object3D | null = null;
  private helper: T.SkeletonHelper | null = null;
  private observer: ResizeObserver;
  private animation = 0;
  private frames = 0;
  private disposed = false;
  private height = 2.1;
  private timings: number[] = [];
  private previous = 0;
  private bones = 0;
  private skins = 0;
  private loadController = new AbortController();

  constructor(private container: HTMLElement) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    container.append(this.renderer.domElement);
    this.scene.background = new T.Color(0x252b34);
    this.scene.add(new T.HemisphereLight(0xe5efff, 0x333039, 2));
    const key = new T.DirectionalLight(0xffeee0, 3);
    key.position.set(2, 3, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -2,
      right: 2,
      top: 3,
      bottom: -1,
      near: 0.1,
      far: 10,
    });
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.008;
    this.scene.add(key);
    const fill = new T.DirectionalLight(0xcbdfff, 1.3);
    fill.position.set(-3, 2, 1);
    const rim = new T.DirectionalLight(0xffffff, 2);
    rim.position.set(1, 2, -3);
    this.scene.add(fill, rim);
    const floor = new T.Mesh(
      new T.PlaneGeometry(200, 200),
      new T.MeshStandardMaterial({ color: 0x252b34, roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.002;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.2;
    this.controls.maxDistance = 10;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.setAngle("front");
    this.animation = requestAnimationFrame(this.tick);
  }

  async load() {
    const response = await fetch(
      "/characters/production/wedding-guest-01.glb",
      { signal: this.loadController.signal },
    );
    if (!response.ok)
      throw new Error(`Character load failed: ${response.status}`);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 32 * 1024 * 1024)
      throw new Error("Character exceeds 32 MiB");
    const gltf = await new GLTFLoader().parseAsync(bytes, "");
    if (gltf.animations.length)
      throw new Error(
        "Inspection character must not include unverified dance clips",
      );
    bindHumanoid(gltf.scene, PRODUCTION_RIG);
    if (this.disposed) {
      this.release(gltf.scene);
      return;
    }
    this.model = gltf.scene;
    const bones = new Set<T.Bone>();
    this.model.traverse((o) => {
      if (o instanceof T.Bone) bones.add(o);
      if (o instanceof T.SkinnedMesh) {
        this.skins++;
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    this.bones = bones.size;
    this.model.updateMatrixWorld(true);
    this.scene.add(this.model);
    this.helper = new T.SkeletonHelper(this.model);
    this.helper.visible = false;
    for (const material of Array.isArray(this.helper.material)
      ? this.helper.material
      : [this.helper.material])
      material.depthTest = false;
    this.scene.add(this.helper);
    this.setAngle("front");
  }

  setAngle(angle: CharacterAngle) {
    const target = new T.Vector3(0, 0.88, 0);
    this.height = 2.05;
    if (angle === "face") {
      target.set(0, 1.54, 0);
      this.height = 0.45;
    }
    if (angle === "hands" && this.model) {
      const rig = bindHumanoid(this.model, PRODUCTION_RIG);
      rig.handL.getWorldPosition(target);
      target.x += 0.055;
      target.y -= 0.035;
      this.height = 0.36;
    }
    if (angle === "feet") {
      target.set(0, 0.13, 0.05);
      this.height = 1.15;
    }
    this.camera.position
      .copy(target)
      .add(angle === "side" ? new T.Vector3(4, 0, 0) : new T.Vector3(0, 0, 4));
    this.controls.target.copy(target);
    this.camera.zoom = 1;
    this.controls.update();
    this.resize();
  }

  showRig(visible: boolean) {
    if (this.helper) this.helper.visible = visible;
  }
  private resize() {
    const w = Math.max(1, this.container.clientWidth),
      h = Math.max(1, this.container.clientHeight);
    this.camera.top = this.height / 2;
    this.camera.bottom = -this.height / 2;
    this.camera.right = (this.height * w) / h / 2;
    this.camera.left = -this.camera.right;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  private tick = (now: number) => {
    if (this.disposed) return;
    if (this.previous && now - this.previous < 1000) {
      this.timings.push(now - this.previous);
      if (this.timings.length > 300) this.timings.shift();
    }
    this.previous = now;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    this.renderer.domElement.dataset["frame"] = String(this.frames);
    this.animation = requestAnimationFrame(this.tick);
  };
  metrics() {
    const sorted = [...this.timings].sort((a, b) => a - b);
    return {
      loaded: !!this.model,
      bones: this.bones,
      skinnedMeshes: this.skins,
      clips: 0,
      frames: this.frames,
      frameP95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? null,
      fps: this.timings.length
        ? (1000 * this.timings.length) / this.timings.reduce((a, b) => a + b, 0)
        : null,
      triangles: this.renderer.info.render.triangles,
      drawCalls: this.renderer.info.render.calls,
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height,
      animationStatus: "no-licensed-halay-performance",
    };
  }
  private release(root: T.Object3D) {
    const materials = new Set<T.Material>(),
      geometries = new Set<T.BufferGeometry>(),
      textures = new Set<T.Texture>(),
      skeletons = new Set<T.Skeleton>();
    root.traverse((o) => {
      if (o instanceof T.Mesh) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          materials.add(m);
      }
      if (o instanceof T.SkinnedMesh) skeletons.add(o.skeleton);
    });
    for (const material of materials) {
      for (const value of Object.values(material))
        if (value instanceof T.Texture) textures.add(value);
      material.dispose();
    }
    for (const value of [...textures, ...geometries, ...skeletons])
      value.dispose();
  }
  dispose() {
    this.disposed = true;
    this.loadController.abort();
    cancelAnimationFrame(this.animation);
    this.observer.disconnect();
    this.controls.dispose();
    this.helper?.dispose();
    this.release(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
