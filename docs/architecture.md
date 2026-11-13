# Mimari — Faz 1

npm workspaces: broadcaster, control-panel, live-gateway, contracts, game-core, halay-game, runtime-client. Kaynaklar strict TypeScript kontrolü altındadır. Desktop/event-engine/game-sdk/ui hedefleri sonraki fazlara aittir.

Akış: React panel → aynı origin `/api/mock` → Node HTTP → MockSourceAdapter + Zod → SQLite kayıt/temel tekilleştirme → saf game-core → WebSocket snapshot/event → bağımsız Three.js sahnesi. Panel ve sahne ayrı WS aboneleridir; panel kapanması sunucuyu veya sahneyi kapatmaz.

| Paket | Sorumluluk |
|---|---|
| contracts | Varsayılan ayarlar, oyuncu/olay/snapshot şeması, protokol v1 |
| game-core | Kararlı demo userId ile katılım, kapasite sınırı, ayar ve manuel kontrol reducer'ları |
| live-gateway | Loopback HTTP/WS, origin/host/body sınırları, migration ve yerel kayıt |
| runtime-client | Snapshot doğrulama, gerçek WS mesajından sonra bağlı durumu, backoff ve tekrar bağlanma |
| halay-game | scene/environment/dancers/choreography/rhythm/music; 3D/ses yaşam döngüsü |
| broadcaster | 9:16 yerel sahne, ayrı ses etkileşimi ve açık mock/bağlantı durumu |
| control-panel | React kontrolleri; yalnızca kayıt başarılıysa başarı bildirimi |

`npm run dev` ayrı Node gateway sürecini başlatır, hazır sinyalini bekler ve iki Vite URL'sini servis eder. `npm start` derlenmiş Node + Vite build önizlemelerini kullanır. Tüm dinleyiciler `127.0.0.1` üzerinde; port çakışması hata verir.

Geliştirmede workspace development export'ları TS kaynaklarına, üretim Node çalışmasında default export'lar paket dist dosyalarına gider. Önce ortak paketler, sonra Node ve UI build edilir. Kök typecheck tüm kaynakları kapsar. Three.js 0.180.0 korunur; core/renderer ayrı build parçalarıdır. Yeni uygulamada CDN import'u yoktur.

## Sınırlar

Sunucu oyuncu/ayar/kontrol için yerel otoritedir. Sahnenin 20 dk yerel tur/kamera saati v0.2 davranışını korur; farklı zamanda açılan iki sahnenin tur fazı ortak otoriter saatte senkron değildir. Bu, Faz 3 işidir. Oyuncu/tur restart restore ve tam kalıcı olay işleme garantisi henüz yoktur.

Migration runner schema_migrations sürümlerini transaction içinde uygular. İlk migration game_settings ve indeksli event_inbox tablolarını kurar. Ayarlar atomik upsert ile kaydedilir. Olay anahtarı `(source, room_id, event_id)`; en fazla 1000 kayıt ve açılışta 24 saat saklama. Kayıt penceresinin dışındaki tekrarlar için garanti yoktur. Tam tablo seti, kuyruk, streak ve moderasyon sonraki fazlardadır.

Geometri/material/canvas texture/shadow ve ses bağlamı kapanışta dispose edilir; bu bir 5 saat bellek kabulü değildir. Animasyon formülleri/nota tabloları özgün v0.2 ile regresyon testinde karşılaştırılır. Askıda kalan sekmeden sonra sınırsız ses catch-up sınırlandı; beat kalitesi/10 dk senkron kabulü Faz 2'de ölçülecek.
