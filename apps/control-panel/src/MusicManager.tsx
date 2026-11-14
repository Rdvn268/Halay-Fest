import { useEffect, useRef, useState } from "react";
import { connectGateway, postJson } from "@halay/runtime-client";
import type {
  MusicLibrary,
  MusicTrack,
  MusicTelemetry,
  DanceStyle,
} from "@halay/contracts";
import "./music.css";

const danceNames: Record<DanceStyle, string> = {
  halay: "Halay",
  horon: "Horon",
  govend: "Govend",
  zeybek: "Zeybek",
};
function TrackEditor({
  track,
  save,
  analyze,
}: {
  track: MusicTrack;
  save: (data: unknown) => Promise<boolean>;
  analyze: () => void;
}) {
  const [draft, setDraft] = useState(track);
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) setDraft(track);
  }, [track]);
  const update = (patch: Partial<MusicTrack>) => {
    dirty.current = true;
    setDraft((prev) => ({ ...prev, ...patch }));
  };
  return (
    <form
      className="track-editor"
      onSubmit={(event) => {
        event.preventDefault();
        void save({
          title: draft.title,
          bpm: draft.bpm,
          bpmSource: "manual",
          firstBeatSec: draft.firstBeatSec,
          beatsPerBar: draft.beatsPerBar,
          beatUnit: draft.beatUnit,
          dance: draft.dance,
          calibrationMs: draft.calibrationMs,
        }).then((saved) => {
          if (saved) dirty.current = false;
        });
      }}
    >
      <h3>Parça ve ritim düzeltmesi</h3>
      <div className="music-fields">
        <label>
          Parça adı
          <input
            aria-label="Parça adı"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            required
            maxLength={120}
          />
        </label>
        <label>
          Dans türü
          <select
            aria-label="Parça dans türü"
            value={draft.dance}
            onChange={(e) => {
              const dance = e.target.value as DanceStyle;
              update({
                dance,
                beatsPerBar: { halay: 2, horon: 7, govend: 4, zeybek: 9 }[
                  dance
                ],
                beatUnit: dance === "horon" || dance === "zeybek" ? 8 : 4,
              });
            }}
          >
            {Object.entries(danceNames).map(([id, title]) => (
              <option value={id} key={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label>
          BPM (dörtlük)
          <input
            aria-label="Manuel BPM"
            type="number"
            min="40"
            max="240"
            step="0.1"
            value={draft.bpm}
            onChange={(e) => update({ bpm: Number(e.target.value) })}
            required
          />
        </label>
        <label>
          İlk vuruş (sn)
          <input
            aria-label="İlk vuruş"
            type="number"
            min="0"
            max={Math.max(0, (track.durationSec ?? 3600) - 0.001)}
            step="0.001"
            value={draft.firstBeatSec}
            onChange={(e) => update({ firstBeatSec: Number(e.target.value) })}
            required
          />
        </label>
        <label>
          Ölçü vuruş sayısı
          <select
            aria-label="Ölçü vuruş sayısı"
            value={draft.beatsPerBar}
            onChange={(e) => update({ beatsPerBar: Number(e.target.value) })}
          >
            {[2, 3, 4, 7, 9].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ölçü paydası
          <select
            aria-label="Ölçü paydası"
            value={draft.beatUnit}
            onChange={(e) =>
              update({ beatUnit: Number(e.target.value) as 4 | 8 })
            }
          >
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </label>
        <label>
          Ritim kalibrasyonu (ms)
          <input
            aria-label="Ritim kalibrasyonu"
            type="number"
            min="-500"
            max="500"
            step="5"
            value={draft.calibrationMs}
            onChange={(e) => update({ calibrationMs: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="actions">
        <button className="primary">Parça ayarlarını kaydet</button>
        <button type="button" onClick={analyze}>
          Ritmi analiz et
        </button>
      </div>
      <p className="muted">
        Çalan parçada grid/dans değişikliği sonraki ölçüde uygulanır. Analiz,
        sahnede yaklaşık 12–30 saniye dinler; BPM tek başına dans türü
        belirlemez.
      </p>
      <p data-testid="bpm-source">
        BPM kaynağı:{" "}
        {track.bpmSource === "default"
          ? "Varsayılan; henüz ölçülmedi"
          : track.bpmSource === "manual"
            ? "Yönetici düzeltmesi"
            : "Ses analizi tahmini"}
      </p>
      {track.analysis && (
        <p data-testid="rhythm-analysis">
          Tahmin: {track.analysis.bpm} BPM · güven %
          {Math.round(track.analysis.confidence * 100)} ·{" "}
          {track.analysis.onsetCount} onset · düzenlilik %
          {Math.round(track.analysis.regularity * 100)}. Vurgu/ölçü adayları:{" "}
          {track.analysis.meterCandidates
            .map((m) => `${m.beats} (%${Math.round(m.confidence * 100)})`)
            .join(", ")}
          . Ölçüyü elle doğrulayın.
        </p>
      )}
    </form>
  );
}

export function MusicManager({
  volume,
  onVolume,
}: {
  volume: number;
  onVolume: (value: number) => Promise<unknown>;
}) {
  const [library, setLibrary] = useState<MusicLibrary>();
  const [telemetry, setTelemetry] = useState<MusicTelemetry>();
  const [selected, setSelected] = useState<string>();
  const [playlistName, setPlaylistName] = useState("Yeni liste");
  const [localVolume, setLocalVolume] = useState(volume);
  const [seek, setSeek] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const telemetrySeen = useRef(0);
  useEffect(() => setLocalVolume(volume), [volume]);
  useEffect(
    () =>
      connectGateway(
        (message) => {
          if (message.kind === "music") {
            setLibrary(message.library);
            setSelected((id) =>
              message.library.tracks.some((t) => t.id === id)
                ? id
                : message.library.tracks[0]?.id,
            );
          }
          if (message.kind === "music_telemetry") {
            setTelemetry(message.telemetry);
            telemetrySeen.current = Date.now();
          }
        },
        () => undefined,
      ),
    [],
  );
  const run = async (operation: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setNotice(success);
      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Müzik işlemi başarısız.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const active = library?.playlists.find(
    (p) => p.id === library.activePlaylistId,
  );
  const track = library?.tracks.find((t) => t.id === selected);
  const current = library?.tracks.find(
    (t) => t.id === library.transport.trackId,
  );
  const fresh =
    telemetry &&
    now - telemetrySeen.current < 5000 &&
    telemetry.sequence === library?.transport.sequence &&
    telemetry.trackId === library.transport.trackId;
  const saveLists = (patch: Partial<MusicLibrary>) => {
    if (!library)
      return Promise.reject(new Error("Müzik servisi hazır değil."));
    return postJson("/api/music/library", {
      playlists: patch.playlists ?? library.playlists,
      activePlaylistId: patch.activePlaylistId ?? library.activePlaylistId,
      autoplay: patch.autoplay ?? library.autoplay,
      repeat: patch.repeat ?? library.repeat,
    });
  };
  const transport = (
    action: "play" | "pause" | "next" | "previous" | "seek",
    trackId?: string,
  ) =>
    run(
      () =>
        postJson("/api/music/transport", {
          action,
          ...(trackId ? { trackId } : {}),
          ...(action === "seek" ? { positionSec: seek } : {}),
        }),
      "Oynatma komutu sahneye gönderildi.",
    );
  const reorder = (id: string, delta: number) => {
    if (!library || !active) return;
    const ids = [...active.trackIds],
      from = ids.indexOf(id),
      to = from + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to]!, ids[from]!];
    void run(
      () =>
        saveLists({
          playlists: library.playlists.map((p) =>
            p.id === active.id ? { ...p, trackIds: ids } : p,
          ),
        }),
      "Liste sırası kaydedildi.",
    );
  };
  return (
    <section className="music-manager" aria-label="Müzik Yöneticisi">
      <div className="music-heading">
        <div>
          <p className="eyebrow">YEREL DOSYALAR · SES SAHNEDE ÇALAR</p>
          <h2>Müzik Yöneticisi</h2>
        </div>
        <span>
          {library
            ? `${library.tracks.length} / 200 parça · ${(library.tracks.reduce((sum, t) => sum + t.bytes, 0) / 1024 / 1024).toFixed(1)} MiB / 1 GiB`
            : "Müzik servisi bekleniyor"}
        </span>
      </div>
      <p className="muted">
        MP3, WAV, OGG · dosya başına 64 MiB, en fazla 1 saat. Yalnızca
        kullanım/yayın hakkınız olan kayıtları ekleyin. Müzikler bu bilgisayarda
        kalır; paneli kapatmak sahnedeki sesi durdurmaz.
      </p>
      <label className="upload">
        Müzik dosyası ekle
        <input
          aria-label="Müzik dosyası ekle"
          type="file"
          accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
          multiple
          disabled={busy || !library}
          onChange={(event) => {
            const files = [...(event.currentTarget.files ?? [])];
            event.currentTarget.value = "";
            void run(async () => {
              for (const file of files) {
                if (file.size > 64 * 1024 * 1024 || file.size === 0)
                  throw new Error(
                    `${file.name}: boş dosya veya 64 MiB sınırı.`,
                  );
                const extension = file.name.split(".").at(-1)?.toLowerCase();
                const type = {
                  mp3: "audio/mpeg",
                  wav: "audio/wav",
                  ogg: "audio/ogg",
                }[extension ?? ""];
                if (!type) throw new Error("Desteklenmeyen dosya türü.");
                const response = await fetch(
                  `/api/music/upload?filename=${encodeURIComponent(file.name)}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": type },
                    body: file,
                  },
                );
                if (!response.ok) {
                  const body = (await response.json()) as { error?: string };
                  throw new Error(body.error ?? "Dosya yüklenemedi.");
                }
              }
            }, "Müzik dosyaları yerel kütüphaneye kaydedildi.");
          }}
        />
      </label>
      {error && (
        <p role="alert" data-testid="music-error" className="error">
          {error}
        </p>
      )}
      <p aria-live="polite" data-testid="music-notice">
        {busy ? "Müzik işlemi sürüyor…" : notice}
      </p>
      <div className="transport">
        <strong data-testid="current-track">
          {current?.title ?? "Henüz parça seçilmedi"}
        </strong>
        <p data-testid="playback-state">
          {fresh
            ? (telemetry.error ??
              (telemetry.playing
                ? "Sahnede çalıyor"
                : telemetry.unlocked
                  ? "Ses duraklatıldı"
                  : "Sahnede ses motorunu bir kez açın"))
            : "Sahneden güncel ses ölçümü bekleniyor"}
        </p>
        <div className="actions">
          <button
            disabled={busy || !current}
            onClick={() => void transport("previous")}
          >
            Önceki parça
          </button>
          <button
            className="primary"
            disabled={busy || !library?.tracks.length}
            onClick={() => void transport("play", selected)}
          >
            Oynat
          </button>
          <button
            disabled={busy || !current}
            onClick={() => void transport("pause")}
          >
            Müziği duraklat
          </button>
          <button
            disabled={busy || !current}
            onClick={() => void transport("next")}
          >
            Sonraki parça
          </button>
        </div>
        <div className="music-fields">
          <label>
            Ses seviyesi · {localVolume}%
            <input
              aria-label="Müzik ses seviyesi"
              type="range"
              min="0"
              max="100"
              step="1"
              value={localVolume}
              onChange={(e) => setLocalVolume(Number(e.target.value))}
            />
          </label>
          <button
            disabled={busy}
            onClick={() =>
              void run(() => onVolume(localVolume), "Ses düzeyi kaydedildi.")
            }
          >
            Ses düzeyini uygula
          </button>
          <label>
            Parçada konum (sn)
            <input
              aria-label="Parçada konum"
              type="number"
              min="0"
              max={current?.durationSec ?? 3600}
              step="0.1"
              value={seek}
              onChange={(e) => setSeek(Number(e.target.value))}
            />
          </label>
          <button
            disabled={busy || !current}
            onClick={() => void transport("seek")}
          >
            Konuma git
          </button>
        </div>
        <p>
          {fresh
            ? `${telemetry.mediaSeconds.toFixed(1)} / ${telemetry.durationSec.toFixed(1)} sn · ${telemetry.bpm} BPM · ölçü ${telemetry.bar + 1}`
            : "—"}
        </p>
      </div>
      {library && active && (
        <div className="music-columns">
          <div>
            <h3>Oynatma listeleri</h3>
            <label>
              Etkin liste
              <select
                aria-label="Etkin liste"
                value={active.id}
                disabled={busy}
                onChange={(e) =>
                  void run(
                    () => saveLists({ activePlaylistId: e.target.value }),
                    "Etkin liste kaydedildi.",
                  )
                }
              >
                {library.playlists.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="actions">
              <input
                aria-label="Yeni liste adı"
                value={playlistName}
                maxLength={80}
                onChange={(e) => setPlaylistName(e.target.value)}
              />
              <button
                disabled={
                  busy || !playlistName.trim() || library.playlists.length >= 20
                }
                onClick={() => {
                  const id = crypto.randomUUID();
                  void run(
                    () =>
                      saveLists({
                        playlists: [
                          ...library.playlists,
                          { id, name: playlistName.trim(), trackIds: [] },
                        ],
                        activePlaylistId: id,
                      }),
                    "Oynatma listesi oluşturuldu.",
                  );
                }}
              >
                Liste oluştur
              </button>
              <button
                disabled={busy || library.playlists.length <= 1}
                onClick={() => {
                  const playlists = library.playlists.filter(
                    (p) => p.id !== active.id,
                  );
                  void run(
                    () =>
                      saveLists({
                        playlists,
                        activePlaylistId: playlists[0]!.id,
                      }),
                    "Liste silindi; dosyalar kütüphanede korundu.",
                  );
                }}
              >
                Listeyi sil
              </button>
            </div>
            <label className="toggle">
              <input
                aria-label="Otomatik sonraki parça"
                type="checkbox"
                checked={library.autoplay}
                disabled={busy}
                onChange={(e) =>
                  void run(
                    () => saveLists({ autoplay: e.target.checked }),
                    "Otomatik oynatma kaydedildi.",
                  )
                }
              />
              Parça bittiğinde otomatik sonraki
            </label>
            <label className="toggle">
              <input
                aria-label="Liste tekrarı"
                type="checkbox"
                checked={library.repeat}
                disabled={busy}
                onChange={(e) =>
                  void run(
                    () => saveLists({ repeat: e.target.checked }),
                    "Liste tekrarı kaydedildi.",
                  )
                }
              />
              Listeyi tekrarla
            </label>
            <ol className="playlist" aria-label="Oynatma sırası">
              {active.trackIds.map((id, index) => {
                const t = library.tracks.find((t) => t.id === id)!;
                return (
                  <li key={id}>
                    <button
                      className={id === selected ? "selected" : ""}
                      onClick={() => setSelected(id)}
                    >
                      {t.title}
                    </button>
                    <button
                      aria-label={`Yukarı ${t.title}`}
                      disabled={busy || index === 0}
                      onClick={() => reorder(id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Aşağı ${t.title}`}
                      disabled={busy || index === active.trackIds.length - 1}
                      onClick={() => reorder(id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      aria-label={`Listeden çıkar ${t.title}`}
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            saveLists({
                              playlists: library.playlists.map((p) =>
                                p.id === active.id
                                  ? {
                                      ...p,
                                      trackIds: p.trackIds.filter(
                                        (item) => item !== id,
                                      ),
                                    }
                                  : p,
                              ),
                            }),
                          "Parça listeden çıkarıldı.",
                        )
                      }
                    >
                      Çıkar
                    </button>
                  </li>
                );
              })}
            </ol>
            <h3>Müzik kütüphanesi</h3>
            <ul className="library-list" aria-label="Müzik kütüphanesi">
              {library.tracks.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setSelected(t.id)}>{t.title}</button>
                  <small>
                    {t.extension.toUpperCase()} ·{" "}
                    {t.durationSec?.toFixed(1) ?? "?"} sn ·{" "}
                    {danceNames[t.dance]}
                  </small>
                  <button
                    disabled={busy || active.trackIds.includes(t.id)}
                    onClick={() =>
                      void run(
                        () =>
                          saveLists({
                            playlists: library.playlists.map((p) =>
                              p.id === active.id
                                ? { ...p, trackIds: [...p.trackIds, t.id] }
                                : p,
                            ),
                          }),
                        "Parça listeye eklendi.",
                      )
                    }
                  >
                    Listeye ekle
                  </button>
                  <button
                    aria-label={`Dosyayı sil ${t.title}`}
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => postJson("/api/music/delete", { id: t.id }),
                        "Dosya ve liste referansları silindi.",
                      )
                    }
                  >
                    Dosyayı sil
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {track && (
              <TrackEditor
                key={track.id}
                track={track}
                save={(patch) =>
                  run(
                    () => postJson(`/api/music/tracks/${track.id}`, patch),
                    "Parça metadata’sı kaydedildi; çalarken sonraki ölçüde uygulanır.",
                  )
                }
                analyze={() =>
                  void run(async () => {
                    await postJson(`/api/music/tracks/${track.id}`, {
                      analysis: null,
                    });
                    await postJson("/api/music/transport", {
                      action: "play",
                      trackId: track.id,
                    });
                  }, "Ses sahnede dinlenerek analiz ediliyor. Ses izni gerekiyorsa sahnede açın.")
                }
              />
            )}
            <h3>Sahne ölçümleri</h3>
            <dl className="diagnostics" data-testid="scene-diagnostics">
              <dt>FPS / kare p95</dt>
              <dd>
                {fresh
                  ? `${telemetry.fps.toFixed(1)} / ${telemetry.frameP95Ms.toFixed(1)} ms`
                  : "Ölçüm yok"}
              </dd>
              <dt>Ses saati farkı p95</dt>
              <dd>{fresh ? `${telemetry.driftP95Ms.toFixed(1)} ms` : "—"}</dd>
              <dt>Algılanan onset-grid farkı p95</dt>
              <dd>
                {fresh && telemetry.onsetErrorP95Ms !== null
                  ? `${telemetry.onsetErrorP95Ms.toFixed(1)} ms (${telemetry.onsetSamples} örnek)`
                  : "Henüz onset ölçümü yok"}
              </dd>
              <dt>Bellek / rig / draw call</dt>
              <dd>
                {fresh
                  ? `${telemetry.heapMB?.toFixed(1) ?? "Desteklenmiyor"} MiB / ${telemetry.rigs} / ${telemetry.drawCalls}`
                  : "—"}
              </dd>
              <dt>Figür / el bağlantı farkı</dt>
              <dd>
                {fresh
                  ? `${telemetry.clip} / ${telemetry.handGapMeters.toFixed(3)} m`
                  : "—"}
              </dd>
            </dl>
            <p className="muted">
              Ölçümler bu tarayıcı/donanım içindir. 60 FPS veya 5 saat
              kesintisiz çalışma garantisi değildir.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
