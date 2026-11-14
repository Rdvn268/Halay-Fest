# Mimari — Faz 1–2

Faz 2 müzik akışı: React Müzik Yöneticisi → doğrulanan `/api/music/*` → dosya stream + SQLite metadata/listeler → WS `music` → **yayın sahnesindeki FileMusicPlayer** → HTMLAudioElement / AudioContext / passthrough RMS worklet → BeatClock → GLB AnimationMixer / el IK. Sahne 1 Hz `music_telemetry` gönderir; panel kapanması ses sahibini etkilemez. [Ayrıntılar ve sınırlar](music-and-choreography.md).

İkinci migration `music_tracks` ve `music_library` tablolarını ekler. DB + ona ait `.music` klasörü birlikte yedeklenir. Metadata transaction'ı ile dosya rename arasında normal hata rollback'i vardır; ani süreç kesilmesine karşı iki kaynaklı atomik commit garantisi yoktur. Test ve geliştirme DB'leri kendi müzik klasörlerini kullanır.

npm workspaces: broadcaster, control-panel, live-gateway, contracts, game-core, halay-game, runtime-client. Kaynaklar strict TypeScript kontrolü altındadır. Desktop/event-engine/game-sdk/ui hedefleri sonraki fazlara aittir.

Akış: React panel → aynı origin `/api/mock` → Node HTTP → MockSourceAdapter + Zod → SQLite kayıt/temel tekilleştirme → saf game-core → WebSocket snapshot/event → bağımsız Three.js sahnesi. Panel ve sahne ayrı WS aboneleridir; panel kapanması sunucuyu veya sahneyi kapatmaz.

| Paket | Sorumluluk |
|---|---|
| contracts | Varsayılan ayarlar, oyuncu/olay/snapshot şeması, protokol v1 |
| game-core | Kararlı demo userId ile katılım, kapasite sınırı, ayar ve manuel kontrol reducer'ları |
| live-gateway | Loopback HTTP/WS, origin/host/body sınırları, migration ve yerel kayıt |
| runtime-client | Snapshot doğrulama, gerçek WS mesajından sonra bağlı durumu, backoff ve tekrar bağlanma |
| halay-game | Scene/environment, dosya oynatıcı, beat-clock/onset analizi, GLB rig/klip/IK, yerel tur ve 3D/ses yaşam döngüsü; eski modüller regresyon referansı |
| broadcaster | 9:16 yerel sahne, ayrı ses etkileşimi ve açık mock/bağlantı durumu |
| control-panel | React kontrolleri; yalnızca kayıt başarılıysa başarı bildirimi |

`npm run dev` ayrı Node gateway sürecini başlatır, hazır sinyalini bekler ve iki Vite URL'sini servis eder. `npm start` derlenmiş Node + Vite build önizlemelerini kullanır. Tüm dinleyiciler `127.0.0.1` üzerinde; port çakışması hata verir.

Geliştirmede workspace development export'ları TS kaynaklarına, üretim Node çalışmasında default export'lar paket dist dosyalarına gider. Önce ortak paketler, sonra Node ve UI build edilir. Kök typecheck tüm kaynakları kapsar. Three.js 0.180.0 korunur; core/renderer ayrı build parçalarıdır. Yeni uygulamada CDN import'u yoktur.

## Sınırlar

Sunucu oyuncu/ayar/kontrol için yerel otoritedir. Sahnenin 20 dk yerel tur/kamera saati v0.2 davranışını korur; farklı zamanda açılan iki sahnenin tur fazı ortak otoriter saatte senkron değildir. Bu, Faz 3 işidir. Oyuncu/tur restart restore ve tam kalıcı olay işleme garantisi henüz yoktur.

Migration runner schema_migrations sürümlerini transaction içinde uygular. İlk migration game_settings ve indeksli event_inbox tablolarını kurar. Ayarlar atomik upsert ile kaydedilir. Olay anahtarı `(source, room_id, event_id)`; en fazla 1000 kayıt ve açılışta 24 saat saklama. Kayıt penceresinin dışındaki tekrarlar için garanti yoktur. Tam tablo seti, kuyruk, streak ve moderasyon sonraki fazlardadır.

Geometri/material/canvas texture/shadow ve ses bağlamı kapanışta dispose edilir; bu bir 5 saat bellek kabulü değildir. Eski animasyon formülleri/nota tabloları özgün v0.2 ile regresyon testinde karşılaştırılır; yeni runtime bunlar yerine dosya müziği ve gerçek GLB kemik kliplerini kullanır. Beat kalitesi ve uzun test ham sonuçları Faz 2 raporundadır. Yerel tur duvar zamanıyla ilerler; bu, Faz 3 ortak tur otoritesi değildir.
