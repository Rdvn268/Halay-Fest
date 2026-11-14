import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  QUATERNIUS_RIG,
  bindHumanoid,
  cloneHumanoid,
  skeletons,
} from "./rig.js";
import { bakeContactStudy } from "./studies.js";
import type { ContactStudy } from "./studies.js";

export async function loadReviewHumanoids() {
  const loader = new GLTFLoader();
  const [male, female, parted, long, outfitMale, outfitFemale] =
    await Promise.all(
      [
        "male",
        "female",
        "hair-parted",
        "hair-long",
        "outfit-male",
        "outfit-female",
      ].map((n) => loader.loadAsync(`/characters/humanoid/${n}.glb`)),
    );
  const variants = [male!, female!].map((g, i) => {
    const model = g.scene;
    bindHumanoid(model, QUATERNIUS_RIG);
    model.updateMatrixWorld(true);
    const neck = model
      .getObjectByName("neck_01")!
      .getWorldPosition(new T.Vector3()).y;
    // Retain the licensed base head; generic clothing supplies limbs/body/feet, avoiding skin poke-through.
    for (const mesh of skeletons(model).filter((m) =>
      /superhero/i.test(m.name),
    )) {
      const geometry = mesh.geometry.clone(),
        old = mesh.geometry;
      const count =
        geometry.index?.count ?? geometry.getAttribute("position").count;
      const positions = new Map<number, number>();
      const y = (i: number) => {
        if (!positions.has(i))
          positions.set(
            i,
            mesh
              .getVertexPosition(i, new T.Vector3())
              .applyMatrix4(mesh.matrixWorld).y,
          );
        return positions.get(i)!;
      };
      const kept: number[] = [];
      for (let i = 0; i < count; i += 3) {
        const tri = [0, 1, 2].map((j) =>
          geometry.index ? geometry.index.getX(i + j) : i + j,
        );
        if (tri.every((i) => y(i) > neck - 0.055)) kept.push(...tri);
      }
      if (!kept.length) throw new Error("Head mask produced no geometry");
      geometry.setIndex(kept);
      mesh.geometry = geometry;
      old.dispose();
    }
    // Bind hair meshes to the matching character skeleton, sharing original rest inverses.
    const mainSkeleton = skeletons(model)[0]!.skeleton;
    const attachments = [
      (i === 0 ? parted! : long!).scene,
      (i === 0 ? outfitMale! : outfitFemale!).scene,
    ];
    for (const attachment of attachments)
      for (const mesh of skeletons(attachment)) {
        const bones = mesh.skeleton.bones.map((b) => {
          const bone = mainSkeleton.bones.find((x) => x.name === b.name);
          if (!bone) throw new Error(`Attachment joint missing: ${b.name}`);
          return bone;
        });
        const skeleton = new T.Skeleton(
          bones,
          mesh.skeleton.boneInverses.map((m) => m.clone()),
        );
        mesh.removeFromParent();
        model.add(mesh);
        mesh.bind(skeleton, mesh.bindMatrix);
      }
    model.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(model),
      height = box.max.y - box.min.y;
    if (height < 0.5 || height > 4)
      throw new Error("Unexpected humanoid unit scale");
    model.scale.multiplyScalar(1.76 / height);
    model.updateMatrixWorld(true);
    const normalized = new T.Box3().setFromObject(model);
    model.position.y -= normalized.min.y;
    model.updateMatrixWorld(true);
    // Shared clip data and shared geometry/material/texture; per-instance skeleton/mixer only.
    const studies = [
      bakeContactStudy(model, QUATERNIUS_RIG, 0),
      bakeContactStudy(model, QUATERNIUS_RIG, 1),
    ];
    return { model, studies };
  });
  const resources = new Set<T.BufferGeometry | T.Material | T.Texture>();
  for (const { model } of variants)
    model.traverse((o) => {
      if (o instanceof T.Mesh) {
        resources.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          resources.add(m);
          for (const v of Object.values(m))
            if (v instanceof T.Texture) resources.add(v);
        }
      }
    });
  return {
    variants,
    make(index: number) {
      const variant = variants[index % variants.length]!;
      const actor = cloneHumanoid(variant.model, QUATERNIUS_RIG);
      return { ...actor, studies: variant.studies as ContactStudy[] };
    },
    dispose() {
      for (const r of resources) r.dispose();
      for (const v of variants)
        for (const s of new Set(skeletons(v.model).map((m) => m.skeleton)))
          s.dispose();
    },
  };
}
