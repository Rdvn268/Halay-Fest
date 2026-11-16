import {
  ProductionCharacterView,
  type CharacterAngle,
} from "../../../packages/halay-game/src/humanoid/production-character.js";
import "./character.css";

const view = new ProductionCharacterView(
  document.querySelector<HTMLElement>("#character-stage")!,
);
const status = document.querySelector<HTMLElement>("#character-status")!;
const buttons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-angle]"),
];
const rig = document.querySelector<HTMLInputElement>("#rig")!;
const motionFile = document.querySelector<HTMLInputElement>("#local-motion")!;
const audioFile = document.querySelector<HTMLInputElement>("#local-audio")!;
const audio = document.querySelector<HTMLAudioElement>("#reference-audio")!;
const play = document.querySelector<HTMLButtonElement>("#motion-play")!;
const pause = document.querySelector<HTMLButtonElement>("#motion-pause")!;
const slider = document.querySelector<HTMLInputElement>("#motion-time")!;
const motionStatus = document.querySelector<HTMLElement>("#motion-status")!;
const position = document.querySelector<HTMLOutputElement>("#motion-position")!;
let audioUrl: string | null = null;
let playing = false;
let anchor = 0;
let offset = 0;
let timer = 0;
const currentTime = () =>
  audioUrl
    ? audio.currentTime
    : Math.min(
        Number(slider.max),
        offset + (playing ? (performance.now() - anchor) / 1000 : 0),
      );
function stop() {
  const beforePause = currentTime();
  playing = false;
  audio.pause();
  offset = audioUrl ? audio.currentTime : beforePause;
  view.setMotionClock(null);
  view.seekMotion(offset);
}
motionFile.addEventListener("change", () => {
  const file = motionFile.files?.[0];
  if (!file) return;
  stop();
  motionFile.disabled = true;
  play.disabled = pause.disabled = slider.disabled = true;
  void (async () => {
    if (
      !file.name.toLowerCase().endsWith(".glb") ||
      file.size > 32 * 1024 * 1024
    )
      throw new Error("En fazla 32 MiB GLB seçin");
    const duration = await view.loadLocalMotion(await file.arrayBuffer());
    slider.max = String(duration);
    slider.value = "0";
    offset = 0;
    if (audioUrl) audio.currentTime = 0;
    play.disabled = pause.disabled = slider.disabled = false;
    view.showRig(rig.checked);
    motionStatus.textContent = `Yerel hareket çalışması · ${duration.toFixed(2)} sn · görsel/temas/ritim kabulü açık`;
    document.querySelector<HTMLElement>("#character-note")!.textContent =
      "İçe aktarılan yerel çalışma · doğrulanmış mocap veya onaylı yöresel figür değildir · otomatik döngü yok";
  })()
    .catch((error: unknown) => {
      motionStatus.textContent = `Klip reddedildi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
    })
    .finally(() => {
      motionFile.disabled = false;
      play.disabled =
        pause.disabled =
        slider.disabled =
          view.metrics().clips === 0;
    });
});
audioFile.addEventListener("change", () => {
  const file = audioFile.files?.[0];
  if (!file) return;
  stop();
  if (
    !/\.(wav|mp3|ogg|webm|m4a)$/i.test(file.name) ||
    file.size > 64 * 1024 * 1024
  ) {
    motionStatus.textContent = "En fazla 64 MiB WAV/MP3/OGG/WebM/M4A seçin";
    return;
  }
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(file);
  audio.src = audioUrl;
  offset = 0;
  slider.value = "0";
  view.seekMotion(0);
});
audio.addEventListener("error", () => {
  stop();
  motionStatus.textContent = "Referans sesi çözülemedi; başka bir dosya seçin";
});
audio.addEventListener("ended", stop);
play.addEventListener("click", () => {
  if (playing) return;
  void (async () => {
    if (offset >= Number(slider.max) - 0.01) {
      offset = 0;
      if (audioUrl) audio.currentTime = 0;
    }
    if (audioUrl) await audio.play();
    anchor = performance.now();
    playing = true;
    // Audio media time is authoritative; render FPS never accumulates dance time.
    view.setMotionClock(currentTime);
  })().catch((error: unknown) => {
    stop();
    motionStatus.textContent = `Ses başlatılamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
  });
});
pause.addEventListener("click", stop);
slider.addEventListener("input", () => {
  stop();
  offset = Number(slider.value);
  if (audioUrl) audio.currentTime = offset;
  view.seekMotion(offset);
});
timer = window.setInterval(() => {
  const time = currentTime();
  if (playing) {
    slider.value = String(time);
    if (time >= Number(slider.max)) stop();
  }
  position.value = `${time.toFixed(2)} sn`;
}, 100);
for (const button of buttons) {
  button.disabled = true;
  button.addEventListener("click", () => {
    view.setAngle(button.dataset["angle"] as CharacterAngle);
    for (const b of buttons)
      b.setAttribute("aria-pressed", String(b === button));
  });
}
rig.addEventListener("change", () => view.showRig(rig.checked));
void view
  .load()
  .then(() => {
    status.textContent =
      "GLB hazır · anatomik gövde, ayrı kıyafet ve 52 kemikli rig";
    for (const b of buttons) b.disabled = false;
    motionFile.disabled = audioFile.disabled = false;
    buttons[0]!.setAttribute("aria-pressed", "true");
  })
  .catch((error: unknown) => {
    status.textContent = `Karakter yüklenemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
  });
Object.defineProperty(window, "__halayCharacter", {
  value: Object.freeze({ metrics: () => view.metrics() }),
});
window.addEventListener(
  "pagehide",
  () => {
    window.clearInterval(timer);
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    view.dispose();
  },
  { once: true },
);
