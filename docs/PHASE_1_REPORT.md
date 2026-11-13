# Faz 1 Sonuç Raporu

**Tarih:** 14 Kasım 2026, Europe/Istanbul. **Kapsam:** ROADMAP §9 Faz 1 ve kullanıcının yedi önceliği. Faz 2'ye geçilmedi. Yerel doğrulamalar ve en güncel GitHub kabul sonucu aşağıda / Faz 1 PR kontrollerinde kayıtlıdır. Açık kabul kriteri varsa PR taslak kalır.

## Yapılan somut işler

- Yeni dal: `feat/phase-1-modular-runtime`. Faz 0 PR #1 henüz main'e merge edilmediği için doğrulanmış `98af99b` üzerine kuruldu; Faz 1 PR tabanı `chore/phase-0-audit`. Main'e otomatik merge yapılmadı.
- npm workspaces ile 7 paket: broadcaster, control-panel, live-gateway, contracts, game-core, halay-game, runtime-client. Strict TS, ortak DTO/Zod doğrulaması, paket build'leri ve dev/production export sınırları kuruldu.
- Bağımsız Vite/Three.js sahnesi ve Vite/React paneli. Panel → HTTP → mock adaptörü → SQLite → game-core → gerçek WS → sahne aktarımı çalışır. Panel kapanması sahneyi kapatmaz.
- Canonical LiveEvent, Player, GameSettings, GameSnapshot ve sürüm 1 server mesajları. 20 dk, 6 NPC, kapasite 100, both, otomatik döngü/kamera/etkinlik varsayılanları korundu.
- Mock chat/follow/gift/like; Türkçe katıl, kararlı demo userId, sınırlı event ID tekilleştirme ve tekli hediye efektleri. Gerçek TikTok durumu açıkça unsupported; sağlayıcı kurulmadı.
- Node HTTP/WS servisi loopback üzerinde; origin/host/JSON/şema/boyut/rate sınırları, WS heartbeat/backoff/snapshot uzlaştırma. İstemciden WS mutasyonu reddedilir.
- SQLite migration runner + version tablosu; game_settings ve indeksli event_inbox. Ayarların atomik kaydı/yeniden açılışta yüklenmesi ve sınırlı mock logu.
- v0.2 geometri, karakter, kamera, Halay/Horon hareket ve Web Audio sentezi typed modüllere taşındı. Nota/tempo/ölçü/perküsyon tablosu ve örneklenmiş hareket dönüşümleri özgün v0.2 fonksiyonuyla karşılaştırılır. Native AudioContext tarayıcıda çalıştırılır.
- Sahne kaynakları için dispose, askı sonrası sınırlı ses planlama, açık NPC/mock etiketleri, temel 9:16 görünüm ve ayrı ses başlatma. Bunlar Faz 2 görsel kalite/beat kabulü olarak gösterilmez.
- Three.js 0.180.0 npm'den paketlenir; yeni uygulama CDN/Google Fonts yüklemez. React/Zod/Three.js bildirimleri build'lere dahil edilir. Legacy HTML/README/ZIP, ROADMAP ve Faz 0 raporu değiştirilmedi.

## Çalıştırma

```powershell
npm ci
npm run dev
# Sahne: http://127.0.0.1:5173   Panel: http://127.0.0.1:5174
npm run build
npm start
# Build sahnesi: http://127.0.0.1:4174   Panel: http://127.0.0.1:4175
```

Node API/WS: 127.0.0.1:8787. Başlatıcı gateway hazır sinyalinden sonra iki UI'ı başlatır; Ctrl+C ile servislerini kapatır. Eski referans `npm run dev:legacy` / 4173 olarak korunur.

## Testler ve kabul kanıtları

Yerel ortam: Windows, Node 24.13.1, npm 11.8.0, Chromium 158.0.8127.18 / SwiftShader. Sonuçlar gerçek Three.js/Web Audio/HTTP/WS/SQLite ile alındı; kimlik ve olaylar sentetiktir. Kayıt hatası ve socket kesintisi senaryoları test tarafından açıkça enjekte edilir.

| Kontrol | Sonuç |
|---|---|
| npm ci | Temiz kurulum başarılı; 161 paket, audit 0 |
| npm run lint | Geçti; lint uyarısı yok |
| npm run typecheck | Geçti; kaynaklar strict TS |
| npm run test | **26/26**: Faz 0 koruma/denetim/HTTP 13 + modeller 5 + gateway/SQLite 5 + eski müzik/hareket 3 |
| npm run build | Ortak paketler + Node + iki UI derlendi |
| npm run check:legacy | Geçti; orijinal kaynak/ZIP hash testleri de geçti |
| npm audit --audit-level=moderate | 0 bildirilen açık |
| Geliştirme E2E | **8/8**, 44,6 sn; legacy 4 + Faz 1 4 |
| Üretim build E2E | **8/8**, 46,5 sn; derlenmiş Node ve Vite build'leri üzerinden |
| git diff --check / legacy ve ROADMAP farkı | Whitespace temiz; legacy/ROADMAP/Faz 0 raporu değişmedi |

E2E kapsamı: dört v0.2 referans testi; panelden yorum/takip/Gül → gerçek sahne karakteri/efekti; panel kapandıktan sonra kare/saat ilerlemesi; native ses başlat/durdur ve pause/resume; dans/manuel tur/ayar reload; kaydetme hatasının görünmesi; WS kesintisinde render ve yeniden snapshot ile toparlama. Retries=0; yavaş yazılım WebGL'de saat ilerlemesine Faz 0'daki 20 sn sınırı uygulanır.

Faz 1'in ilk iki tam E2E koşusu (dev 40,5 sn, production 38,8 sn) 7/7 geçti. Ek socket kesinti testinin ilk denemesi 7/8 oldu: test yalnızca route'un sunucu ucunu kapattığı için tarayıcı ucunda close oluşmadı. Test iki ucu kapatacak şekilde düzeltildi; hedefli production testi 1/1 geçti. Son tam koşular aşağıda güncel kayıtla izlenir. Bu hata gizlenmedi; kontrol kaldırılmadı ve otomatik retry eklenmedi.

İlk geliştirme typecheck'inde CSS modül bildirimi eksikti; Vite client declaration eklendi. İlk lint'te kullanılmayan bir import vardı; kaldırıldı. İlk build'de 603 kB chunk uyarısı vardı; Three.js core/renderer ayrıldı. Son sahne JS parçaları yaklaşık 111/175/318 kB, panel JS 321 kB; build'in 500 kB uyarısı giderildi. Bunlar FPS ölçümü değildir.

Yerelde Node SQLite ExperimentalWarning ve test ortamının NO_COLOR/FORCE_COLOR çakışma uyarısı görülür; gizlenmedi. SQLite API değişebilir; migration/reopen testi korunmalıdır.

## Faz 1 kabul kapısı

| ROADMAP kabulü | Kanıt |
|---|---|
| Panel kapanınca sahne kapanmaz | İki gerçek sayfa; panel close sonrası render frame ve saat ilerler |
| Mock olay panelden yayın sahnesine ulaşır | UI yorumu → Node → WS → gerçek canvas player-count; Gül banner/efekti |
| Typecheck/build yeşil | Strict typecheck + paket/Node/Vite build |
| npm dev/build/test ve ayrı URL | Dev ve üretim önizlemesi E2E; yukarıdaki komutlar |
| SQLite migration / ortak contract | Version/reopen ve şema testleri |

Güncel GitHub commit kabulü Faz 1 PR kontrollerinde izlenir; yalnızca tüm kontroller geçtiğinde PR incelemeye hazır yapılır. Windows/Linux araç işleri ve dev/production Chromium işleri CI'a eklendi.

## Görsel kanıt ve değişen dosyalar

[React panel](evidence/phase-1/phase1-panel.png), [Three.js sahne ve mock oyuncu](evidence/phase-1/phase1-scene.png), [Horon](evidence/phase-1/phase1-horon.png). Başarılı yerel koşuldan alındı ve görsel olarak incelendi; bunlar gerçek izleyici değildir.

Ana dosyalar: apps/broadcaster/src, apps/control-panel/src, packages/contracts/game-core/halay-game/runtime-client, services/live-gateway/src, scripts/dev.ts, workspace/TS/Vite/Playwright/CI ayarları, yeni unit/e2e testleri, README ve mimari/olay/güvenlik/operasyon/risk/lisans belgeleri. Git diff dosya bazında kesin listedir.

## Açık sınırlar ve sonraki küçük görev

Ortak otoriter tur saati, 20 dk gerçek süreli tur kabulü, oyuncu/tur restart restore, FIFO, tam rules/replay/streak, tüm tablolar, moderasyon, gelişmiş rig/beat geçişleri, müzik hak onayı, 100 oyuncu FPS, 5 saat soak, LIVE Studio/pilot ve güvenli LAN paneli henüz yok. Mevcut yerel tur/otomatik dans saati korunur; iki sahnenin tur fazı farklı açılışlarda senkron değildir. DisplayName profil yenilemesi henüz yok. Kopuklukta kaçan geçici efektler tekrar oynatılmaz; inbox tekilleştirmesi 1000 kayıt / açılışta 24 saat sınırındadır.

Yeni bağımlılıklar/lisanslar [risk kaydında](risks-and-dependencies.md), dağıtılan MIT bildirimleri apps/*/public altında. Node SQLite dışında yeni veritabanı servisi/native paket/ücretli servis yok. TikTok şifre/çerez/gerçek hediye veya bulut uygulama kurulumu kullanılmadı.

Sonraki küçük görev kullanıcı Faz 2'yi başlattığında ayrı dalda beat-clock ve müzik/dans geçiş ölçümünü ele almaktır. **Bu çalışma Faz 1 sonunda durur.**
