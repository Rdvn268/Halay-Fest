import type { ReactNode } from "react";
import type { GameSnapshot } from "@halay/contracts";
import type { ConnectionStatus } from "@halay/runtime-client";

export const studioPages = [
  {
    id: "overview",
    icon: "✦",
    title: "Genel bakış",
    detail: "Şenliğin kontrol merkezi",
  },
  {
    id: "connection",
    icon: "🔗",
    title: "Bağlantı",
    detail: "Yerel servis durumu",
  },
  { id: "game", icon: "🎮", title: "Oyun", detail: "Döngü, katılım ve kamera" },
  {
    id: "music",
    icon: "🎵",
    title: "Müzik",
    detail: "Kütüphane, listeler ve ritim",
  },
  {
    id: "test",
    icon: "🧪",
    title: "Test Paneli",
    detail: "Yorum, takip ve hediyeler",
  },
  {
    id: "overlay",
    icon: "🖼️",
    title: "Yayın ekranı",
    detail: "Sahne ve 9:16 görünüm",
  },
  {
    id: "guide",
    icon: "💡",
    title: "Nasıl kullanılır",
    detail: "Adım adım hazırlık",
  },
] as const;
export type StudioPage = (typeof studioPages)[number]["id"];
export function pageFromHash(): StudioPage {
  const id = location.hash.slice(1);
  return studioPages.some((page) => page.id === id)
    ? (id as StudioPage)
    : "overview";
}
const statusNames: Record<ConnectionStatus, string> = {
  connected: "Bağlı",
  connecting: "Bağlanıyor",
  reconnecting: "Yeniden bağlanıyor",
  disconnected: "Bağlantı kapalı",
};
export const sceneUrl = () =>
  `http://127.0.0.1:${Number(location.port) ? Number(location.port) - 1 : 5173}`;

export function StudioShell({
  page,
  onNavigate,
  status,
  notice,
  error,
  views,
  snapshot,
}: {
  page: StudioPage;
  onNavigate: (page: StudioPage) => void;
  status: ConnectionStatus;
  notice: string;
  error: string;
  views: Record<StudioPage, ReactNode>;
  snapshot: GameSnapshot | undefined;
}) {
  const active = studioPages.find((item) => item.id === page)!;
  return (
    <main className="studio">
      <header className="studio-header">
        <a
          className="brand"
          href="#overview"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("overview");
          }}
          aria-label="Halay Fest genel bakış"
        >
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <span>
            <strong>Halay Fest</strong>
            <small>Müzik başlasın, şenlik büyüsün.</small>
          </span>
        </a>
        <div className="header-actions">
          <div className="service-pill">
            <span
              className={`status-dot ${status === "connected" ? "online" : ""}`}
              aria-hidden="true"
            />
            <span>
              <small>Yerel servis</small>
              <strong data-testid="connection">{statusNames[status]}</strong>
            </span>
          </div>
          <a
            className="button header-scene"
            href={sceneUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Yayın sahnesini aç <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <div className="studio-kicker">
        <span>YAYINCI STÜDYOSU</span>
        <div className="studio-live-meta">
          <span>
            Mock oyuncu{" "}
            <strong data-testid="players">
              {snapshot?.players.length ?? 0} /{" "}
              {snapshot?.settings.capacity ?? 100}
            </strong>
          </span>
          <span>
            Olay{" "}
            <strong data-testid="events">{snapshot?.eventCount ?? 0}</strong>
          </span>
          <span className="mode-pill">◌ Simülasyon modu</span>
        </div>
      </div>
      <div className="studio-workspace">
        <aside className="studio-sidebar">
          <p className="sidebar-title">KONTROL PANELİ</p>
          <nav aria-label="Yayıncı kontrolleri">
            {studioPages.map((item) => (
              <button
                type="button"
                id={`nav-${item.id}`}
                key={item.id}
                className={`nav-item ${page === item.id ? "active" : ""}`}
                aria-current={page === item.id ? "page" : undefined}
                aria-controls={`view-${item.id}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <span aria-hidden="true">🌿</span>
            <p>
              Önce prova,
              <br />
              <strong>sonra şenlik.</strong>
            </p>
            <small>Bu sürümde yorumlar ve hediyeler mock olaylardır.</small>
          </div>
        </aside>
        <div className="studio-content">
          <div className="pane-heading">
            <div>
              <span className="eyebrow">HALAY FEST / KONTROL MERKEZİ</span>
              <h1>{active.title}</h1>
            </div>
            <span className="pane-symbol" aria-hidden="true">
              {active.icon}
            </span>
          </div>
          <p className="feedback error" role="alert">
            {error}
          </p>
          <p className="feedback success" role="status">
            {notice}
          </p>
          {studioPages.map((item) => (
            <div
              id={`view-${item.id}`}
              key={item.id}
              hidden={page !== item.id}
              aria-labelledby={`nav-${item.id}`}
              className="studio-view"
            >
              {views[item.id]}
            </div>
          ))}
        </div>
      </div>
      <footer className="studio-footer">
        <span>Halay Fest · Yerel yayın stüdyosu</span>
        <span>Gerçek TikTok bağlantısı bu sürümde desteklenmiyor.</span>
      </footer>
    </main>
  );
}

export function SessionStats({
  snapshot,
  trackCount,
}: {
  snapshot: GameSnapshot | undefined;
  trackCount: number;
}) {
  return (
    <div className="summary">
      <div>
        <span className="stat-icon" aria-hidden="true">
          👥
        </span>
        <small>Simüle oyuncu</small>
        <strong>
          {snapshot?.players.length ?? 0}{" "}
          <em>/ {snapshot?.settings.capacity ?? 100}</em>
        </strong>
      </div>
      <div>
        <span className="stat-icon" aria-hidden="true">
          🌼
        </span>
        <small>Şenlik ekibi</small>
        <strong>
          {snapshot?.settings.npc ?? 6} <em>NPC</em>
        </strong>
      </div>
      <div>
        <span className="stat-icon" aria-hidden="true">
          ♫
        </span>
        <small>Müzik kütüphanesi</small>
        <strong>
          {trackCount} <em>parça</em>
        </strong>
      </div>
      <div>
        <span className="stat-icon" aria-hidden="true">
          ✧
        </span>
        <small>Mock olay</small>
        <strong>{snapshot?.eventCount ?? 0}</strong>
      </div>
    </div>
  );
}

export function Overview({
  snapshot,
  trackCount,
  onNavigate,
}: {
  snapshot: GameSnapshot | undefined;
  trackCount: number;
  onNavigate: (page: StudioPage) => void;
}) {
  return (
    <>
      <section className="welcome-card">
        <div>
          <span className="pill">✦ SENİN MÜZİĞİN, SENİN ŞENLİĞİN</span>
          <h2>
            Şenliğe biraz
            <br />
            <span>kendi ritmini kat.</span>
          </h2>
          <p>
            Müziğini ekle, dansını seç ve ilk katılımı prova et. Yayın sahnesi
            ayrı pencerede çalışmaya devam eder.
          </p>
          <div className="actions">
            <button className="primary" onClick={() => onNavigate("music")}>
              ♫ Müzik kütüphanesine git
            </button>
            <button onClick={() => onNavigate("test")}>
              Test panelini aç ↗
            </button>
          </div>
        </div>
        <div className="festival-emblem" aria-hidden="true">
          <span>✦</span>
          <b>HF</b>
          <small>HALAY FEST</small>
          <i>♫</i>
        </div>
      </section>
      <SessionStats snapshot={snapshot} trackCount={trackCount} />
      <div className="overview-grid">
        <section className="panel-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">BİRKAÇ KÜÇÜK ADIM</span>
              <h2>Yayına hazırlan</h2>
            </div>
            <span aria-hidden="true">✨</span>
          </div>
          <div className="setup-steps">
            {[
              {
                n: "01",
                title: "Şenliğin düzenini seç",
                description: "Döngü, oyuncu kapasitesi ve kamera ayarları.",
                page: "game",
              },
              {
                n: "02",
                title: "Müziğini ve dansını eşleştir",
                description: "Kütüphane, oynatma listesi ve ritim düzeltmesi.",
                page: "music",
              },
              {
                n: "03",
                title: "İlk katılımı prova et",
                description: "Mock yorum ve hediyeleri sahnede dene.",
                page: "test",
              },
            ].map((step) => (
              <button
                key={step.n}
                onClick={() => onNavigate(step.page as StudioPage)}
              >
                <span>{step.n}</span>
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </div>
                <b aria-hidden="true">↗</b>
              </button>
            ))}
          </div>
        </section>
        <section className="panel-card session-card">
          <span className="eyebrow">AYRI PENCERE, KESİNTİSİZ KONTROL</span>
          <h2>Sahnen seni bekliyor.</h2>
          <div className="scene-illustration" aria-hidden="true">
            <span>♫</span>
            <i />
            <i />
            <i />
            <i />
            <i />
            <b>HALAY FEST</b>
          </div>
          <p>
            Müzik yayın sahnesinde çalar. Bu paneli kapattığında açık sahne ve
            müzik devam eder.
          </p>
          <a
            className="button primary"
            href={sceneUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Yayın sahnesini aç ↗
          </a>
        </section>
      </div>
    </>
  );
}

export function ConnectionView({
  status,
  onNavigate,
}: {
  status: ConnectionStatus;
  onNavigate: (page: StudioPage) => void;
}) {
  return (
    <>
      <p className="lead">
        Kontrol paneli ile sahnenin aynı yerel servise bağlı olduğundan emin ol.
      </p>
      <section className="panel-card">
        <div className="connection-card">
          <span className="connection-icon" aria-hidden="true">
            🔗
          </span>
          <div>
            <h2>Yerel oyun servisi</h2>
            <p>
              Kontroller, müzik listeleri ve mock olaylar bu bağlantı üzerinden
              sahneye ulaşır.
            </p>
          </div>
          <span
            className={`connection-badge ${status === "connected" ? "online" : ""}`}
          >
            {statusNames[status]}
          </span>
        </div>
        <div className="info-strip">
          <span aria-hidden="true">💡</span>
          <p>
            Bağlantı kesilirse panel otomatik yeniden dener. Sahne penceresi
            açık kalmalıdır.
          </p>
        </div>
      </section>
      <section className="panel-card connection-unavailable">
        <span className="pill">MOCK / YEREL PROVA</span>
        <h2>TikTok canlı bağlantısı</h2>
        <p>
          Gerçek TikTok bağlantısı bu sürümde desteklenmiyor. Yorum, takip ve
          hediyeleri Test Paneli üzerinden simüle edebilirsin.
        </p>
        <button onClick={() => onNavigate("test")}>Test paneline git ↗</button>
      </section>
    </>
  );
}

export function OverlayView() {
  return (
    <>
      <p className="lead">
        Kontrol panelini yanında tut, yayın sahnesini ayrı bir pencerede aç.
      </p>
      <div className="overlay-choices">
        <section className="panel-card">
          <div className="format-art portrait" aria-hidden="true">
            9:16
          </div>
          <h2>Dikey yayın görünümü</h2>
          <p>
            1080 × 1920 yerleşimine uygun temiz sahne. Ses iznini sahnede bir
            kez aç.
          </p>
          <a
            className="button primary"
            href={`${sceneUrl()}/?broadcast=1`}
            target="_blank"
            rel="noreferrer"
          >
            9:16 sahneyi aç ↗
          </a>
        </section>
        <section className="panel-card">
          <div className="format-art" aria-hidden="true">
            ✦
          </div>
          <h2>Kontrollerle önizleme</h2>
          <p>
            Sahneyi, bağlantı durumunu ve ses düğmesini aynı pencerede
            görüntüle.
          </p>
          <a
            className="button"
            href={sceneUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Önizlemeyi aç ↗
          </a>
        </section>
      </div>
      <div className="info-strip">
        <span aria-hidden="true">💡</span>
        <p>
          Aynı anda tek sesli yayın sahnesi kullan. Paneli kapatmak sahneyi
          kapatmaz; sahne veya yerel servis kapanırsa müzik durur.
        </p>
      </div>
    </>
  );
}

export function GuideView({
  onNavigate,
}: {
  onNavigate: (page: StudioPage) => void;
}) {
  return (
    <>
      <p className="lead">İlk provanı birkaç adımda hazırla.</p>
      <div className="guide-steps">
        {[
          {
            title: "Oyun ayarlarını kaydet",
            text: "Döngü, NPC ve oyuncu kapasitesini seç. Kamera ve otomatik döngüyü buradan yönet.",
            page: "game",
          },
          {
            title: "Kendi müziğini ekle",
            text: "Yayın hakkına sahip olduğun MP3, WAV veya OGG dosyalarını yükle. Liste sırasını ve dans türünü seç.",
            page: "music",
          },
          {
            title: "Sahnede sesi aç",
            text: "Yayın ekranını aç ve Ses motorunu aç düğmesine bir kez bas. Müzik komutlarını daha sonra panelden yönet.",
            page: "overlay",
          },
          {
            title: "Yorum ve hediyeleri prova et",
            text: "Demo kullanıcıyla katıl yorumu ve mock hediye gönder. Gerçek TikTok bağlantısı bu sürümde bulunmuyor.",
            page: "test",
          },
        ].map((step, i) => (
          <section className="panel-card guide-step" key={step.page}>
            <span>{i + 1}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
              <button onClick={() => onNavigate(step.page as StudioPage)}>
                Bu adıma git ↗
              </button>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
