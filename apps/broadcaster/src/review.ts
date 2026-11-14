import { connectGateway } from "@halay/runtime-client";
import { HumanoidReviewScene } from "../../../packages/halay-game/src/humanoid/review-scene.js";
import type { ReviewMetrics } from "../../../packages/halay-game/src/humanoid/review-scene.js";
import "./review.css";

document.getElementById("review-root")!.innerHTML = `
<main><header><div><small>HALAY FEST / GÖRSEL İNCELEME</small><h1>İnsan modeli ve temas laboratuvarı</h1></div><a href="/">Mevcut oyun ↗</a></header>
<p class="warning">KABUL AÇIK · Bu iki hareket özgün teknik temas çalışmasıdır. Lisanslı halay mocap'i, yöresel kostüm ve uzman/kullanıcı onayı henüz yoktur. Diğer danslar kilitlidir.</p>
<div class="workspace"><section><div id="review-stage"><div id="review-scene"></div><div class="scene-title"><b>HALAY / İNCELEME</b><span id="figure">İnsan modelleri yükleniyor…</span><small id="beat">Ses saati bekleniyor</small></div><div id="event">6 NPC · Teknik çalışma / onay bekliyor</div><div class="labels" id="labels"></div></div>
<div class="tools"><button id="sound">Ses motorunu aç</button><button data-view="front" aria-pressed="true">Önden</button><button data-view="side" aria-pressed="false">Yandan</button><button data-view="auto" aria-pressed="false">Otomatik kamera</button></div>
<p>Ses bu pencerede çalar; aynı anda yalnızca bir ses sahnesi açık tutun. Müzik, liste ve mock kontrolleri mevcut yönetim panelindedir. MP3/WAV/OGG sistemi korunur.</p>
</section><aside><section class="card"><h2>Canlı ölçüm</h2><p id="connection" role="status">Yerel servise bağlanıyor</p><dl id="metrics"></dl><p class="note">Ayak ölçümü, temas işareti açıkken ayak bileği ankrajının kaymasıdır; taban basıncı/ayakkabı çarpışması ölçülmez. El aralığı iki avuç işaretçisi arasındadır; parmak kavrama kabulü değildir.</p></section>
<section class="card"><h2>İnceleme kapasitesi</h2><label>Yalnızca bu pencerede <select id="population"><option value="live">Mevcut NPC + mock oyuncular</option><option value="6">6 teknik kopya</option><option value="106">106 teknik kopya</option></select></label><p class="note">Teknik kopyalar gateway'e oyuncu eklemez. FPS yalnızca bu pencere ve donanım için ölçülür.</p></section>
<section class="card"><h2>Performans klibi içe aktar</h2><p>FBX / GLB / gömülü glTF, en çok 32 MiB. Açık humanoid eşlemesi, vuruş sayısı, ayak temasları, root motion ve izin kanıtı içeren JSON gerekir.</p><label>Animasyon dosyası <input id="motion" type="file" accept=".fbx,.glb,.gltf"/></label><label>Motion manifest <input id="manifest" type="file" accept=".json"/></label><button id="import">Halay inceleme sekansına ekle</button><p class="note">İçe aktarma izin beyanını otomatik doğrulamaz. En çok iki klip; dosyalar bu sekme belleğinde tutulur ve sunucuya yüklenmez.</p></section></aside></div><p id="error" role="alert"></p><p id="notice" role="status"></p></main>`;
const el = (id: string) => document.getElementById(id)!;
const framing = document.createElement("button");
framing.textContent = "9:16 kayıt kadrajı";
framing.onclick = () => document.body.classList.add("recording");
document.querySelector(".tools")!.append(framing);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.body.classList.remove("recording");
});
let latest: ReviewMetrics | undefined;
let hasEvent = false;
const scene = new HumanoidReviewScene(
  el("review-scene"),
  (m) => {
    latest = m;
    if (!hasEvent)
      el("event").textContent =
        `${m.actors} görsel karakter · teknik çalışma / kabul açık`;
    el("figure").textContent = m.blockedDance
      ? "Seçili müzik Halay değil · koreografi kilitli"
      : m.figure;
    el("beat").textContent =
      `${m.playing ? "Ses saati" : "Sessiz teknik prova"} · vuruş ${m.beat.toFixed(2)} · ${(m.phase * 100).toFixed(0)}%`;
    const rows = [
      ["Karakter", String(m.actors)],
      ["FPS / kare p95", `${m.fps.toFixed(1)} / ${m.frameP95Ms.toFixed(1)} ms`],
      ["Ayak ankraj kayması", `${(m.footDriftMeters * 1000).toFixed(2)} mm`],
      ["Temasta ayak hızı", `${(m.footSpeedMps * 1000).toFixed(2)} mm/sn`],
      ["Avuç işaretçisi aralığı", `${(m.palmGapMeters * 1000).toFixed(2)} mm`],
      ["IK erişim hatası", `${(m.ikResidualMeters * 1000).toFixed(2)} mm`],
      ["Aktif ayak teması", String(m.contacts)],
      [
        "Ses saati p95",
        m.playing ? `${m.clockP95Ms.toFixed(2)} ms` : "Ses ölçümü yok",
      ],
      [
        "Decoded onset-grid p95",
        m.onsetGridP95Ms === null
          ? "Ölçüm yok"
          : `${m.onsetGridP95Ms.toFixed(2)} ms / ${m.onsetSamples} örnek`,
      ],
      [
        "Üçgen / draw call",
        `${m.triangles.toLocaleString("tr")} / ${m.drawCalls}`,
      ],
      [
        "JS heap",
        m.heapMB === null ? "Bu tarayıcıda yok" : `${m.heapMB.toFixed(1)} MiB`,
      ],
    ];
    const dl = el("metrics");
    if (dl.children.length !== rows.length * 2) {
      dl.replaceChildren(
        ...rows.flatMap(([a, b]) => {
          const dt = document.createElement("dt"),
            dd = document.createElement("dd");
          dt.textContent = a!;
          dd.textContent = b!;
          return [dt, dd];
        }),
      );
    } else
      rows.forEach(([, b], i) => {
        dl.children[i * 2 + 1]!.textContent = b!;
      });
    el("sound").textContent = scene.music.unlocked
      ? m.playing
        ? "Müziği durdur"
        : "Müziği başlat"
      : "Ses motorunu aç";
  },
  (e) => {
    el("error").textContent = e instanceof Error ? e.message : String(e);
  },
);
const record = document.createElement("button");
record.textContent = "16 sn sesli kayıt";
record.onclick = () => {
  record.disabled = true;
  document.body.classList.add("recording");
  void scene
    .recordCycle(16)
    .then((blob) => {
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "halay-technical-review.webm";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      el("notice").textContent =
        "Teknik çalışma videosu kaydedildi; gerçek halay kabulü değildir.";
    })
    .catch((e) => {
      el("error").textContent = String(e);
    })
    .finally(() => {
      record.disabled = false;
      document.body.classList.remove("recording");
    });
};
document.querySelector(".tools")!.append(record);
const disconnect = connectGateway(
  (message) => {
    if (message.kind === "snapshot") scene.sync(message.snapshot);
    else if (message.kind === "music")
      scene.music.applyLibrary(message.library);
    else if (message.kind === "event") {
      hasEvent = true;
      scene.event(message.event);
      el("event").textContent =
        `MOCK · ${message.event.displayName ?? "Demo"} · ${message.event.type}`;
    }
  },
  (status) => {
    el("connection").textContent =
      status === "connected"
        ? "Yerel servis bağlı · gerçek TikTok yok"
        : `Yerel servis: ${status}`;
  },
);
el("sound").addEventListener("click", () => {
  void scene.music.toggle().catch((e) => {
    el("error").textContent = String(e);
  });
});
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-view]",
))
  button.onclick = () => {
    const view = button.dataset["view"] as "front" | "side" | "auto";
    scene.setView(view);
    for (const b of document.querySelectorAll("[data-view]"))
      b.setAttribute("aria-pressed", String(b === button));
  };
el("population").onchange = () => {
  const v = (el("population") as HTMLSelectElement).value;
  scene.setReviewCount(v === "live" ? undefined : Number(v));
};
el("import").onclick = () => {
  void (async () => {
    el("error").textContent = "";
    const file = (el("motion") as HTMLInputElement).files?.[0],
      meta = (el("manifest") as HTMLInputElement).files?.[0];
    if (!file || !meta)
      throw new Error("Animasyon ve JSON manifest dosyasını seçin.");
    if (meta.size > 128 * 1024) throw new Error("Manifest sınırı: 128 KiB");
    await scene.addMotion(file, JSON.parse(await meta.text()));
    el("notice").textContent =
      "Klip inceleme sekansına alındı. İzin ve yöresel doğruluk kabulü açık.";
  })().catch((e) => {
    el("error").textContent = e instanceof Error ? e.message : String(e);
  });
};
// Read-only diagnostics: browser tests and evidence recorder use the exact displayed scene.
Object.defineProperty(window, "__halayReview", { get: () => latest });
window.addEventListener(
  "pagehide",
  () => {
    disconnect();
    void scene.dispose();
  },
  { once: true },
);
