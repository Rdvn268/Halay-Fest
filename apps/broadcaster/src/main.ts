import { HalayScene, MUSIC } from "@halay/halay-game";
import { connectGateway } from "@halay/runtime-client";
import "./style.css";

document.getElementById("root")!.innerHTML = `
  <main><header><span>HALAY FEST · YAYLA ŞENLİĞİ</span><strong>DEMO</strong></header>
  <p class="source">Gerçek TikTok bağlantısı desteklenmiyor · Katılımlar ve hediyeler mock</p>
  <div id="stage"><div id="scene"></div><div class="overlay"><div><h1>Yayla Şenliği</h1><p id="dance">Halay · 2/4</p></div>
    <div class="timer"><b id="clock">20:00</b><small id="round">Döngü #1</small></div></div><div id="banner" aria-live="polite">6 NPC ile yerel şenlik</div></div>
  <section class="hud"><span>Mock oyuncu <b id="players">0</b></span><span>NPC <b id="npcs">6</b></span><span id="state">Oyun çalışıyor</span></section>
  <footer><span id="connection" role="status">Yerel servise bağlanıyor</span><button id="music">Müziği başlat</button><button id="fullscreen">Tam ekran</button></footer>
  <p id="error" role="alert"></p><p class="hint">Müziği bu pencerede bir kez başlatın. Panel kapansa da bu sahne çalışır.</p></main>`;
const el = (id: string) => document.getElementById(id)!;
const scene = new HalayScene(
  el("scene"),
  (metrics) => {
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
      `${MUSIC[metrics.dance].name} · ${MUSIC[metrics.dance].meter}`;
    el("music").textContent = metrics.musicPlaying
      ? "Müziği durdur"
      : "Müziği başlat";
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
    else {
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
