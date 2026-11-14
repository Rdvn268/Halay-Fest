import { HalayScene } from "@halay/halay-game";
import type { SceneMetrics } from "@halay/halay-game";
import { connectGateway } from "@halay/runtime-client";
import "./style.css";
if (new URLSearchParams(location.search).get("broadcast") === "1")
  document.body.classList.add("broadcast");

document.getElementById("root")!.innerHTML = `
  <main><header><span>HALAY FEST · YAYLA ŞENLİĞİ</span><strong>DEMO</strong></header>
  <p class="source">Gerçek TikTok bağlantısı desteklenmiyor · Katılımlar ve hediyeler mock</p>
  <div id="stage"><div id="scene"></div><div class="overlay"><div><h1>Yayla Şenliği</h1><p id="dance">Halay · 2/4</p><p id="song">Müzik dosyası bekleniyor</p></div>
    <div class="timer"><b id="clock">20:00</b><small id="round">Döngü #1</small></div></div><div id="banner" aria-live="polite">6 NPC ile yerel şenlik</div></div>
  <section class="hud"><span>Mock oyuncu <b id="players">0</b></span><span>NPC <b id="npcs">6</b></span><span id="state">Oyun çalışıyor</span></section>
  <footer><span id="connection" role="status">Yerel servise bağlanıyor</span><button id="music">Müziği başlat</button><button id="fullscreen">Tam ekran</button></footer>
  <p id="error" role="alert"></p><p class="hint">Müziği bu pencerede bir kez başlatın. Panel kapansa da bu sahne çalışır.</p></main>`;
const el = (id: string) => document.getElementById(id)!;
let latestMetrics: SceneMetrics | undefined;
const danceNames = {
  halay: "Halay",
  horon: "Horon",
  govend: "Govend",
  zeybek: "Zeybek",
};
const scene = new HalayScene(
  el("scene"),
  (metrics) => {
    latestMetrics = metrics;
    el("clock").textContent = `${Math.floor(metrics.remaining / 60)
      .toString()
      .padStart(
        2,
        "0",
      )}:${(metrics.remaining % 60).toString().padStart(2, "0")}`;
    el("round").textContent = `Döngü #${metrics.round}`;
    el("players").textContent = String(metrics.players);
    el("npcs").textContent = String(metrics.npc);
    el("dance").textContent =
      `${danceNames[metrics.dance]} · ${scene.music.currentTrack ? `${scene.music.clock.grid.beatsPerBar}/${scene.music.clock.grid.beatUnit}` : "Sessiz önizleme"}`;
    el("music").textContent = !scene.music.unlocked
      ? "Ses motorunu aç"
      : metrics.musicPlaying
        ? "Müziği durdur"
        : "Müziği başlat";
    document.body.classList.toggle("audio-ready", scene.music.unlocked);
    el("song").textContent = scene.music.currentTrack
      ? `${metrics.musicPlaying ? "♫" : "Ⅱ"} ${scene.music.currentTrack.title}`
      : "Müzik dosyası bekleniyor";
    el("state").textContent = metrics.paused
      ? "Duraklatıldı"
      : "Oyun çalışıyor";
  },
  (error) => {
    el("error").textContent =
      error instanceof Error ? error.message : "Ses işlemi başarısız";
  },
);
const disconnect = connectGateway(
  (message) => {
    if (message.kind === "snapshot") scene.sync(message.snapshot);
    else if (message.kind === "music")
      scene.music.applyLibrary(message.library);
    else if (message.kind === "event") {
      scene.handleEvent(message.event);
      el("banner").textContent =
        `MOCK · ${message.event.displayName ?? "Demo"} · ${message.event.type}${message.event.type === "gift" ? " · " + String(message.event.payload["gift"]) : ""}`;
    }
  },
  (status) => {
    el("connection").textContent = {
      connected: "Yerel servis bağlı · MOCK",
      connecting: "Yerel servise bağlanıyor",
      reconnecting: "Yerel servis bağlantısı kesildi · yeniden deneniyor",
      disconnected: "Yerel servis bağlantısı kapalı",
    }[status];
  },
);
let musicBusy = false;
el("music").addEventListener("click", () => {
  if (musicBusy) return;
  musicBusy = true;
  el("music").setAttribute("disabled", "");
  void scene.music
    .toggle()
    .then(() => {
      el("error").textContent = "";
    })
    .catch((error: unknown) => {
      el("error").textContent =
        error instanceof Error ? error.message : "Ses başlatılamadı";
    })
    .finally(() => {
      musicBusy = false;
      el("music").removeAttribute("disabled");
    });
});
el("fullscreen").addEventListener("click", () => {
  const action = document.fullscreenElement
    ? document.exitFullscreen()
    : el("stage").requestFullscreen();
  void action.catch(() => {
    el("error").textContent = "Tam ekran açılamadı.";
  });
});
window.addEventListener(
  "pagehide",
  () => {
    disconnect();
    void scene.dispose();
  },
  { once: true },
);
const clientId = crypto.randomUUID();
const telemetryTimer = setInterval(() => {
  if (!latestMetrics) return;
  const { audioRenderSeconds: _audioRenderSeconds, ...audio } =
    scene.music.diagnostics();
  void _audioRenderSeconds;
  const {
    fps,
    frameP95Ms,
    heapMB,
    drawCalls,
    triangles,
    rigs,
    clip,
    handGapMeters,
  } = latestMetrics;
  void fetch("/api/music/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      ...audio,
      fps,
      frameP95Ms,
      heapMB,
      drawCalls,
      triangles,
      characters: latestMetrics.npc + latestMetrics.players,
      rigs,
      clip,
      handGapMeters,
    }),
  }).catch(() => undefined);
}, 1000);
window.addEventListener("pagehide", () => clearInterval(telemetryTimer), {
  once: true,
});
