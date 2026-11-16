/** Offline samples from the existing game renderer; no new application page.
 * Node 24: node scripts/capture-horon-comparison.ts BEFORE.glb AFTER.glb OUT_DIR
 */
import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const [before, after, output] = process.argv.slice(2);
if (!before || !after || !output)
  throw new Error("Expected BEFORE AFTER OUT_DIR");
const out = resolve(output);
if (!out.startsWith(resolve("data") + sep))
  throw new Error("Render into ignored data/ first");
const moduleUrl = encodeURI(
  "/@fs/" +
    resolve(
      "packages/halay-game/src/humanoid/production-character.ts",
    ).replaceAll("\\", "/"),
);
const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  for (const [variant, file, offset] of [
    ["before", before, 11],
    ["after", after, 0],
  ] as const) {
    const bytes = await readFile(file);
    for (const angle of ["front", "side"]) {
      const dir = resolve(out, variant, angle);
      await mkdir(dir, { recursive: true });
      const page = await browser.newPage({
        viewport: { width: 540, height: 960 },
        deviceScaleFactor: 1,
      });
      const errors: string[] = [];
      page.on("pageerror", (e) => {
        errors.push(e.message);
        console.error("CAPTURE_PAGE", e.message);
      });
      page.on("console", (m) => {
        if (m.type() === "error" || m.text().startsWith("CAPTURE"))
          console.log(m.type(), m.text());
      });
      page.on("requestfailed", (r) =>
        console.error("CAPTURE_REQUEST", r.url(), r.failure()?.errorText),
      );
      await page.route("**/review-model.glb", (route) =>
        route.fulfill({ body: bytes, contentType: "model/gltf-binary" }),
      );
      // An intercepted test document, never installed as a route in the app.
      await page.route("**/motion-capture", (route) =>
        route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: `
        <!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}#stage{position:fixed;inset:0}</style></head>
        <body><div id="stage"></div><script type="module">
        import {ProductionCharacterView} from ${JSON.stringify(moduleUrl)};
        console.log('CAPTURE boot');
        const view=new ProductionCharacterView(document.querySelector('#stage'));
        await view.loadLocalMotion(await (await fetch('/review-model.glb')).arrayBuffer());
        console.log('CAPTURE loaded');
        view.seekMotion(${offset});view.scene.updateMatrixWorld(true);
        const hips=view.motionHips;
        const Vector=hips.position.constructor, Quaternion=hips.quaternion.constructor;
        const skin=view.scene.getObjectByProperty('isSkinnedMesh',true);
        const index=skin.skeleton.bones.indexOf(hips);
        const deformation=hips.matrixWorld.clone().multiply(skin.skeleton.boneInverses[index]);
        const forward=new Vector(0,0,1).applyQuaternion(new Quaternion().setFromRotationMatrix(deformation));
        forward.y=0;forward.normalize();
        const floor=view.scene.children.find(o=>o.isMesh&&o.geometry.type==='PlaneGeometry');
        floor.position.y=0; // Match the Blender/audit zero-height contact plane.
        const geometry=new floor.geometry.constructor(20,20,80,80).toNonIndexed();
        const attr=geometry.getAttribute('position'), colors=[];
        for(let i=0;i<attr.count;i+=3){
          const x=(attr.getX(i)+attr.getX(i+1)+attr.getX(i+2))/3;
          const y=(attr.getY(i)+attr.getY(i+1)+attr.getY(i+2))/3;
          const color=(Math.floor(x*4)+Math.floor(y*4))%2===0 ? [.075,.085,.10] : [.11,.12,.14];
          for(let j=0;j<3;j++)colors.push(...color);
        }
        geometry.setAttribute('color',new attr.constructor(new Float32Array(colors),3));
        floor.geometry.dispose();floor.geometry=geometry;
        floor.material.color.set(0xffffff);floor.material.vertexColors=true;floor.material.needsUpdate=true;
        view.height=2.35;view.resize();
        window.sampleReview=(time)=>{
          view.seekMotion(time);view.scene.updateMatrixWorld(true);
          const target=hips.getWorldPosition(new Vector());target.y=.9;
          const direction=forward.clone();
          if(${JSON.stringify(angle)}==='side') direction.applyAxisAngle(new Vector(0,1,0),Math.PI/2);
          view.controls.target.copy(target);
          view.camera.position.copy(target).addScaledVector(direction,4);view.camera.position.y=1.8;
          view.camera.lookAt(target);view.controls.update();
          view.renderer.render(view.scene,view.camera);
          return view.metrics();
        };
        window.sampleReview(${offset});window.reviewReady=true;
        window.addEventListener('pagehide',()=>view.dispose(),{once:true});
        </script></body></html>`,
        }),
      );
      await page.goto("http://127.0.0.1:5173/motion-capture");
      await page.waitForFunction(() =>
        Boolean((window as unknown as { reviewReady: boolean }).reviewReady),
      );
      for (let f = 0; f < 139; f++) {
        await page.evaluate(
          (time) =>
            (
              window as unknown as { sampleReview: (t: number) => unknown }
            ).sampleReview(time),
          offset + f / 30,
        );
        await page.locator("canvas").screenshot({
          path: resolve(dir, `${String(f).padStart(4, "0")}.png`),
        });
      }
      await writeFile(
        resolve(dir, "capture.json"),
        JSON.stringify(
          {
            variant,
            angle,
            frames: 139,
            samplingFPS: 30,
            sourceOffsetSeconds: offset,
            errors,
            mode: "offline-sampled-production-renderer-not-FPS-benchmark",
          },
          null,
          2,
        ),
      );
      if (errors.length) throw new Error(errors.join("\n"));
      console.log("CAPTURED", variant, angle, 139, "real frames");
      await page.close();
    }
  }
} finally {
  await browser.close();
}
