import {
  cinematicFrame,
  loopPreflight,
} from "../../../packages/halay-game/src/cinematic-plan.js";
import { DANCE_BRIEFS } from "../../../packages/halay-game/src/dance-briefs.js";
import "./cinematic.css";

const root = document.querySelector<HTMLElement>("#cinematic")!;
root.innerHTML = `
  <header><a href="/">HALAY FEST</a><span>FAZ 2 / SANAT YÖNETİMİ</span></header>
  <section class="intro"><p class="eyebrow">ÜRETİM HAZIRLIĞI · 01</p>
    <h1>Önce gerçek insanlar.<br>Sonra gerçek Halay.</h1>
    <p>Altı kişi, açık zincir, iki doğrulanmış figür. İlk 45 saniyenin çekim ve hareket planı.</p>
  </section>
  <aside role="status"><strong>Üretim sahnesi hazır değil · sanatsal kabul açık</strong>
    <p>Altı gerçekçi karakter, izinli insan performansları, .blend kaynakları ve yayın hakkı belgeli gerçek müzik eksik.
    Aşağıdaki görünüm bir çekim planıdır; 3D oyun görüntüsü veya tamamlanmış dans animasyonu değildir.</p></aside>
  <section class="planning"><div><p class="eyebrow">45 SANİYE / 1080 × 1920 HEDEF</p><h2>Çekim masası</h2>
    <label for="time">Plan konumu <output id="time-value">0.0 sn</output></label>
    <input id="time" type="range" min="0" max="45" step="0.1" value="0">
    <h3 id="shot"></h3><p id="camera"></p>
    <p class="muted">Önden → yandan → başçeken → çapraz → başlangıca dönüş. Kamera önerisi; animasyon üretmez. Gerçek sahnede görüş ve mesafe yeniden ayarlanacak.</p>
    <details><summary>45 saniye / ölçü uyumunu kontrol et</summary>
      <p>Yalnız aritmetik ön kontrol. Gerçek müziğin grid'i ve iki figürün onaylı beat sayısı girilmeli.</p>
      <div class="grid"><label>BPM<input id="bpm" type="number" min="1" max="400" value="120"></label>
      <label>Ölçü başına beat<input id="bar" type="number" min="1" max="32" value="4"></label>
      <label>Figür A beat<input id="figure-a" type="number" min="1" max="128" value="8"></label>
      <label>Figür B beat<input id="figure-b" type="number" min="1" max="128" value="8"></label></div>
      <p id="grid-result" role="status"></p><p class="muted">Başlangıç sayıları örnektir. Bu değerler araştırmadaki Halay adımlarının ölçüsü değildir. Matematiksel uyum ses dikişini veya performansı onaylamaz.</p>
    </details></div>
    <div class="portrait" aria-label="9:16 kadraj şeması; oyun görüntüsü değil">
      <span>9:16 · KADRAJ ŞEMASI</span><div class="safe">Üst yayın güvenli alanı</div>
      <div class="chain" aria-hidden="true">01 — 02 — 03<br>↳ 04 — 05 — 06</div>
      <p>Altı farklı insan<br>El ve ayaklar görünür</p><div class="safe bottom">Alt yayın güvenli alanı</div>
    </div>
  </section>
  <section><p class="eyebrow">İNSAN PERFORMANSI İÇİN ÜRETİM TALİMATLARI</p>
    <h2>Figür araştırma kütüphanesi</h2><p>Erkek ve kadın take'leri ayrı çekilecek. Bütün kayıtlar taslak; oynatılabilir klip yok.</p>
    <label for="family">Dans araştırması</label><select id="family"><option value="all">Tümü</option>
      <option value="halay">Halay</option><option value="kolbasti">Kolbastı</option>
      <option value="oyun-havasi">Oyun havası</option><option value="pop">Pop</option></select>
    <div id="briefs" class="briefs"></div>
  </section><footer><a href="/review.html">Önceki teknik inceleme sahnesi</a>
    <p>Önceki sahne kullanıcı tarafından kabul edilmedi. Burada eski modeller veya temas çalışmaları nihai çözüm olarak kullanılmaz.</p></footer>`;

function updateTime() {
  const seconds = Number(root.querySelector<HTMLInputElement>("#time")!.value);
  const frame = cinematicFrame(seconds);
  root.querySelector("#time-value")!.textContent = `${seconds.toFixed(1)} sn`;
  root.querySelector("#shot")!.textContent = frame.label;
  root.querySelector("#camera")!.textContent =
    `Önerilen kamera (metre): ${frame.position.map((v) => v.toFixed(2)).join(" / ")}`;
}
function updateGrid() {
  const value = (id: string) =>
    Number(root.querySelector<HTMLInputElement>(`#${id}`)!.value);
  const result = root.querySelector("#grid-result")!;
  try {
    const check = loopPreflight(value("bpm"), value("bar"), [
      value("figure-a"),
      value("figure-b"),
    ]);
    result.textContent = `${check.beats.toFixed(2)} beat · tam ölçü: ${check.wholeBars ? "evet" : "hayır"} · tam figür sekansı: ${check.wholeSequences ? "evet" : "hayır"} · figürler tam ölçü: ${check.figuresFitBars ? "evet" : "hayır"}. Ses ve hareket dikişi doğrulanmadı.`;
  } catch {
    result.textContent =
      "Geçerli bir BPM ve pozitif tam sayı ölçü/figür beat değerleri girin.";
  }
}
function showBriefs() {
  const family = root.querySelector<HTMLSelectElement>("#family")!.value;
  const container = root.querySelector("#briefs")!;
  container.replaceChildren();
  for (const brief of DANCE_BRIEFS.filter(
    (b) => family === "all" || b.family === family,
  )) {
    const card = document.createElement("article");
    // Content is inserted as text, never executable markup from a future authoring source.
    const status = document.createElement("small");
    status.textContent = "TASLAK / OYNATILABİLİR KLİP YOK";
    const heading = document.createElement("h3");
    heading.textContent = brief.title;
    card.append(status, heading);
    for (const text of [
      brief.formation,
      brief.instruction,
      brief.timing,
      brief.takes.male,
      brief.takes.female,
    ]) {
      const p = document.createElement("p");
      p.textContent = text;
      card.append(p);
    }
    const link = document.createElement("a");
    link.href = brief.source;
    link.textContent = "Araştırma kaynağı ↗";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    card.append(link);
    container.append(card);
  }
}
root.querySelector("#time")!.addEventListener("input", updateTime);
for (const id of ["bpm", "bar", "figure-a", "figure-b"])
  root.querySelector(`#${id}`)!.addEventListener("input", updateGrid);
root.querySelector("#family")!.addEventListener("change", showBriefs);
updateTime();
updateGrid();
showBriefs();
