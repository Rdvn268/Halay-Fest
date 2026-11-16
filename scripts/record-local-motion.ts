/** Records the existing 3D viewer using explicitly supplied local GLB/audio.
 * Outputs remain under ignored data/. No asset downloader or approval claim.
 * node scripts/record-local-motion.ts GLB AUDIO OUTPUT_DIRECTORY (Node 24)
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const [glb, audio, directory] = process.argv.slice(2);
if (!glb || !audio || !directory)
  throw new Error("Usage: record-local-motion.ts GLB AUDIO OUTPUT_DIRECTORY");
const out = resolve(directory);
if (!out.startsWith(resolve("data") + sep))
  throw new Error("Local study recordings must stay in ignored data/");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: "chromium",
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
try {
  for (const angle of ["front", "side"] as const) {
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1920 },
      deviceScaleFactor: 1,
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:5173/character.html");
    await page.waitForFunction(
      () =>
        !document.querySelector<HTMLInputElement>("#local-motion")!.disabled,
    );
    await page.locator("summary").click();
    await page.locator("#local-motion").setInputFiles(glb);
    await page.waitForFunction(
      () =>
        !document.querySelector<HTMLButtonElement>("#motion-play")!.disabled,
    );
    await page.locator("#local-audio").setInputFiles(audio);
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLAudioElement>("#reference-audio")!
          .readyState >= 2,
    );
    if (angle === "side")
      await page.getByRole("button", { name: "Yandan", exact: true }).click();
    await page.locator("#motion-time").fill("8");
    await page.waitForTimeout(100);
    await page.screenshot({ path: resolve(out, `${angle}-8s.png`) });
    await page.locator("#motion-time").fill("0");
    // Set up recorder before the actual Play click. Capture canvas plus real media audio.
    await page.evaluate(async () => {
      const canvas = document.querySelector("canvas")!;
      const element =
        document.querySelector<HTMLAudioElement>("#reference-audio")!;
      const context = new AudioContext();
      await context.resume();
      const source = context.createMediaElementSource(element);
      const destination = context.createMediaStreamDestination();
      source.connect(destination);
      source.connect(context.destination);
      const output = document.createElement("canvas");
      output.width = canvas.width;
      output.height = canvas.height;
      const paint = output.getContext("2d")!;
      let overlayFrame = 0;
      const draw = () => {
        paint.drawImage(canvas, 0, 0);
        paint.fillStyle = "#151b26";
        paint.fillRect(0, output.height - 110, output.width, 110);
        paint.fillStyle = "#ffffff";
        paint.font = "24px sans-serif";
        paint.fillText(
          "VIDEO ESTIMATE / DIAGNOSTIC ONLY",
          24,
          output.height - 66,
        );
        paint.font = "20px sans-serif";
        paint.fillText(
          `Unvalidated dance, feet and depth | ${element.currentTime.toFixed(2)} s`,
          24,
          output.height - 28,
        );
        overlayFrame = requestAnimationFrame(draw);
      };
      draw();
      const stream = output.captureStream(30);
      for (const track of destination.stream.getAudioTracks())
        stream.addTrack(track);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 5_000_000,
      });
      const chunks: Blob[] = [];
      const samples: {
        wall: number;
        audio: number;
        motion: number;
        frameP95Ms: unknown;
        fps: unknown;
      }[] = [];
      const metrics = () =>
        (
          window as unknown as {
            __halayCharacter: { metrics: () => Record<string, unknown> };
          }
        ).__halayCharacter.metrics();
      let first: number | null = null;
      const timer = setInterval(() => {
        if (element.paused) return;
        first ??= performance.now();
        const m = metrics();
        samples.push({
          wall: (performance.now() - first) / 1000,
          audio: element.currentTime,
          motion: Number(m["motionTime"]),
          frameP95Ms: m["frameP95Ms"],
          fps: m["fps"],
        });
      }, 50);
      const recording = new Promise<{
        data: string;
        samples: typeof samples;
        metrics: Record<string, unknown>;
      }>((done, fail) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        recorder.onerror = () => fail(new Error("MediaRecorder failed"));
        recorder.onstop = () => {
          clearInterval(timer);
          cancelAnimationFrame(overlayFrame);
          const reader = new FileReader();
          reader.onload = () =>
            done({ data: String(reader.result), samples, metrics: metrics() });
          reader.readAsDataURL(new Blob(chunks, { type: recorder.mimeType }));
          for (const track of stream.getTracks()) track.stop();
          void context.close();
        };
      });
      element.addEventListener("playing", () => recorder.start(250), {
        once: true,
      });
      element.addEventListener(
        "pause",
        () => {
          if (recorder.state === "recording") recorder.stop();
        },
        { once: true },
      );
      setTimeout(() => {
        if (recorder.state === "recording") element.pause();
      }, 25_000);
      Object.defineProperty(window, "__localMotionRecording", {
        value: recording,
      });
    });
    await page.getByRole("button", { name: "Oynat", exact: true }).click();
    const result = await page.evaluate(
      async () =>
        await (
          window as unknown as {
            __localMotionRecording: Promise<{
              data: string;
              samples: { audio: number; motion: number }[];
              metrics: Record<string, unknown>;
            }>;
          }
        ).__localMotionRecording,
    );
    const bytes = Buffer.from(
      result.data.slice(result.data.indexOf("base64,") + 7),
      "base64",
    );
    if (bytes.length < 100_000 || bytes.readUInt32BE(0) !== 0x1a45dfa3)
      throw new Error("Empty/invalid WebM");
    await writeFile(resolve(out, `${angle}-study-with-audio.webm`), bytes);
    const { data: omitted, ...report } = result;
    void omitted;
    await writeFile(
      resolve(out, `${angle}-playback.json`),
      JSON.stringify(
        {
          ...report,
          errors,
          kind: "diagnostic-study-not-accepted-dance",
          maxSampledMediaClockDifferenceSeconds: Math.max(
            ...result.samples.map((s) => Math.abs(s.audio - s.motion)),
          ),
          note: "Media time alignment only; NOT a validated musical beat or footfall match. Recording includes diagnostic watermark.",
        },
        null,
        2,
      ),
    );
    console.log(
      angle,
      bytes.length,
      "bytes",
      report.metrics,
      "page errors:",
      errors.length,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
