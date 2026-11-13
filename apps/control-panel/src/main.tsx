import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { defaultSettings } from "@halay/contracts";
import type {
  GameSettings,
  GameSnapshot,
  MockInput,
  GiftKind,
  ControlAction,
} from "@halay/contracts";
import { connectGateway, postJson } from "@halay/runtime-client";
import type { ConnectionStatus } from "@halay/runtime-client";
import "./style.css";
import { MusicManager } from "./MusicManager.js";

const gifts: { id: GiftKind; label: string }[] = [
  { id: "rose", label: "🌹 Gül" },
  { id: "heart", label: "💝 Kalp" },
  { id: "drum", label: "🥁 Davul" },
  { id: "confetti", label: "🎊 Konfeti" },
  { id: "crown", label: "👑 Taç" },
  { id: "fireworks", label: "🎆 Havai fişek" },
];
const statuses = {
  connected: "Bağlı",
  connecting: "Bağlanıyor",
  reconnecting: "Yeniden bağlanıyor",
  disconnected: "Bağlantı kapalı",
};
function App() {
  const [snapshot, setSnapshot] = useState<GameSnapshot>();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [settings, setSettings] = useState<GameSettings>({
    ...defaultSettings,
  });
  const [userId, setUserId] = useState("demo-001");
  const [displayName, setDisplayName] = useState("misafir_01");
  const [message, setMessage] = useState("katıl");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);
  useEffect(
    () =>
      connectGateway((message) => {
        if (message.kind === "snapshot") {
          setSnapshot(message.snapshot);
          if (!dirty.current) setSettings(message.snapshot.settings);
        }
      }, setStatus),
    [],
  );
  const change = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K],
  ) => {
    dirty.current = true;
    setNotice("Kaydedilmemiş değişiklikler");
    setSettings((prev) => ({ ...prev, [key]: value }));
  };
  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setError(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  };
  const send = (
    event:
      | Omit<Extract<MockInput, { type: "chat" }>, "userId" | "displayName">
      | Omit<
          Extract<MockInput, { type: "follow" | "like" }>,
          "userId" | "displayName"
        >
      | Omit<Extract<MockInput, { type: "gift" }>, "userId" | "displayName">,
  ) =>
    run(
      () => postJson("/api/mock", { ...event, userId, displayName }),
      "Mock olay yerel servise kaydedildi.",
    );
  const control = (action: ControlAction) =>
    run(() => postJson("/api/control", { action }), "Oyun komutu uygulandı.");
  const disabled = busy || status !== "connected";
  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">HALAY FEST · YEREL DEMO</p>
          <h1>Şenlik Kontrolü</h1>
        </div>
        <a
          href={`http://127.0.0.1:${location.port === "4175" ? "4174" : "5173"}`}
          target="_blank"
          rel="noreferrer"
        >
          Yayın sahnesini aç ↗
        </a>
      </header>
      <p className="notice">
        Simülasyon modu. Gerçek TikTok bağlantısı desteklenmiyor; takip ve
        hediyeler mock olaylardır.
      </p>
      <div className="summary">
        <div>
          <small>Yerel servis</small>
          <strong data-testid="connection">{statuses[status]}</strong>
        </div>
        <div>
          <small>Simüle oyuncu</small>
          <strong data-testid="players">
            {snapshot?.players.length ?? 0} /{" "}
            {snapshot?.settings.capacity ?? 100}
          </strong>
        </div>
        <div>
          <small>NPC</small>
          <strong>{snapshot?.settings.npc ?? 6}</strong>
        </div>
        <div>
          <small>Mock olay</small>
          <strong data-testid="events">{snapshot?.eventCount ?? 0}</strong>
        </div>
      </div>
      <p role="alert" className="error">
        {error}
      </p>
      <p role="status">{notice}</p>
      <div className="columns">
        <section>
          <h2>Oyun ve müzik</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const result = await postJson("/api/settings", settings);
                dirty.current = false;
                return result;
              }, "Ayarlar SQLite’a kaydedildi.");
            }}
          >
            <label>
              Döngü (dakika)
              <input
                aria-label="Döngü (dakika)"
                type="number"
                min="5"
                max="60"
                value={settings.duration}
                onChange={(e) => change("duration", Number(e.target.value))}
              />
            </label>
            <label>
              NPC sayısı
              <input
                aria-label="NPC sayısı"
                type="number"
                min="0"
                max="30"
                value={settings.npc}
                onChange={(e) => change("npc", Number(e.target.value))}
              />
            </label>
            <label>
              Oyuncu kapasitesi
              <input
                aria-label="Oyuncu kapasitesi"
                type="number"
                min="1"
                max="100"
                value={settings.capacity}
                onChange={(e) => change("capacity", Number(e.target.value))}
              />
            </label>
            <label>
              Katılım
              <select
                value={settings.joinMethod}
                onChange={(e) =>
                  change(
                    "joinMethod",
                    e.target.value as GameSettings["joinMethod"],
                  )
                }
              >
                <option value="both">Yorum + mock takip</option>
                <option value="comment">Yorum</option>
                <option value="follow">
                  Mock takip + ücretsiz yorum alternatifi
                </option>
              </select>
            </label>
            <label>
              Dans ve müzik
              <select
                aria-label="Dans ve müzik"
                value={settings.musicMode}
                onChange={(e) =>
                  change(
                    "musicMode",
                    e.target.value as GameSettings["musicMode"],
                  )
                }
              >
                <option value="auto">Otomatik · 4 dakikada bir</option>
                <option value="halay">Halay · 2/4</option>
                <option value="horon">Horon · 7/8</option>
              </select>
              <small>
                Müziksiz önizleme içindir. Dosya çalarken Müzik Yöneticisi'ndeki
                dans seçimi kullanılır.
              </small>
            </label>
            <label>
              Ses seviyesi · {settings.musicVolume}%
              <input
                aria-label="Ses seviyesi"
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.musicVolume}
                onChange={(e) => change("musicVolume", Number(e.target.value))}
              />
            </label>
            {(["autoLoop", "autoCamera", "randomEvents"] as const).map(
              (key, i) => (
                <label className="toggle" key={key}>
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => change(key, e.target.checked)}
                  />
                  {
                    [
                      "Otomatik döngü",
                      "Otomatik kamera",
                      "Rastlantısal NPC etkinlikleri",
                    ][i]
                  }
                </label>
              ),
            )}
            <p className="muted">
              Tarayıcı ses izni için müziği yayın sahnesinden bir kez başlatın.
            </p>
            <button className="primary" disabled={disabled}>
              Ayarları kaydet
            </button>
          </form>
          <div className="actions">
            <button
              disabled={disabled}
              onClick={() =>
                void control(snapshot?.paused ? "resume" : "pause")
              }
            >
              {snapshot?.paused ? "Devam et" : "Duraklat"}
            </button>
            <button
              disabled={disabled}
              onClick={() => void control("new_round")}
            >
              Yeni döngü
            </button>
            <button
              disabled={disabled}
              onClick={() => {
                dirty.current = true;
                setSettings({ ...defaultSettings });
                setNotice("Varsayılanlar yüklendi; kaydedin.");
              }}
            >
              Varsayılanları yükle
            </button>
          </div>
        </section>
        <section>
          <h2>Olay simülatörü</h2>
          <label>
            Kararlı demo kullanıcı ID
            <input
              aria-label="Demo kullanıcı ID"
              value={userId}
              maxLength={64}
              onChange={(e) => setUserId(e.target.value)}
            />
          </label>
          <label>
            Görünen ad
            <input
              aria-label="Görünen ad"
              value={displayName}
              maxLength={32}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label>
            Yorum
            <input
              aria-label="Yorum"
              value={message}
              maxLength={256}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <div className="actions">
            <button
              disabled={disabled}
              onClick={() => void send({ type: "chat", message })}
            >
              💬 Yorum gönder
            </button>
            <button
              disabled={disabled}
              onClick={() => void send({ type: "follow" })}
            >
              👤 Mock takip
            </button>
            <button
              disabled={disabled}
              onClick={() => void send({ type: "like" })}
            >
              ♥ Mock beğeni
            </button>
          </div>
          <h3>Tekli mock hediyeler</h3>
          <div className="gifts">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                disabled={disabled}
                onClick={() => void send({ type: "gift", gift: gift.id })}
              >
                {gift.label}
              </button>
            ))}
          </div>
          <p className="muted">
            Streak/combo ve gelişmiş kural editörü henüz yok.
          </p>
          <button
            disabled={disabled}
            onClick={() => void control("clear_players")}
          >
            Demo oyuncuları sıfırla
          </button>
          <h3>Son mock olaylar</h3>
          <ol aria-label="Son olaylar">
            {snapshot?.recentEvents.map((event) => (
              <li key={`${event.source}:${event.roomId}:${event.eventId}`}>
                <b>MOCK · {event.type}</b> · {event.displayName}{" "}
                {event.type === "chat"
                  ? String(event.payload["message"])
                  : event.type === "gift"
                    ? String(event.payload["gift"])
                    : ""}
              </li>
            ))}
          </ol>
        </section>
      </div>
      <MusicManager
        volume={snapshot?.settings.musicVolume ?? 45}
        onVolume={(musicVolume) =>
          postJson("/api/settings", {
            ...(snapshot?.settings ?? defaultSettings),
            musicVolume,
          })
        }
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
