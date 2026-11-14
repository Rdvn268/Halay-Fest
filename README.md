# HALAY FEST

Windows odaklı, yerelde çalışan 3D halay/horon simülatörü. **Faz 2 çalışması: dosya müziği, beat-clock ve iskeletli GLB karakterler. Gerçek TikTok bağlantısı desteklenmiyor.** Ana gereksinim [ROADMAP.md](ROADMAP.md); Faz 0 referansı [korunmuş v0.2](legacy/v0.2/README.md). Açık kabul konuları [Faz 2 raporunda](docs/PHASE_2_REPORT.md) izlenir.

## Başlatma

[Yeni yayıncı stüdyosu](docs/evidence/phase-2/ui-refresh/overview.png) · [Güncel müzik görünümü](docs/evidence/phase-2/ui-refresh/music.png) · [Panel yenileme raporu](docs/PANEL_UI_REPORT.md)

Panel bölümleri doğrudan açılabilir: http://127.0.0.1:5174/#overview · http://127.0.0.1:5174/#music · http://127.0.0.1:5174/#test. Menü geçişleri kaydedilmemiş müzik/oyun ayarlarını korur.

[Yeni iskeletli 3D sahne](docs/evidence/phase-2/hardware-preview-6.png) · [Müzik Yöneticisi](docs/evidence/phase-2/music-manager.png) · [Ölçüm ve görüntü kanıtları](docs/evidence/phase-2/README.md)

Git, Node **24 LTS** (en az 24.13.1) ve npm **11** gerekir. Sürüm seçimi `.nvmrc` / `.node-version` ile yapılabilir.

```powershell
git clone --branch feat/phase-2-music-and-choreography https://github.com/Rdvn268/Halay-Fest.git
cd Halay-Fest
npm ci
npm run dev
```

| Yerel pencere/servis | Geliştirme | Build önizlemesi |
|---|---|---|
| Three.js yayın sahnesi | http://127.0.0.1:5173 | http://127.0.0.1:4174 |
| React yönetim paneli | http://127.0.0.1:5174 | http://127.0.0.1:4175 |
| Node API / WebSocket | http://127.0.0.1:8787/api/health | Aynı |

`npm ci`, **Halay-Fest klasöründe** package.json ve package-lock.json yanında çalışır. Main dalındaki yol haritası veya üst masaüstü klasörü kurulum kökü değildir; henüz birleştirilmemiş geliştirme dalları yukarıdaki komutla alınır.

Panel ve sahneyi ayrı sekmelerde açın. Panelde demo kullanıcı ID ve adını girip `katıl` yorumu gönderin. Karakter sahneye eklenir; aynı ID ikinci karakter açmaz. Hediyeler **tekli mock efektlerdir**. Müzik Yöneticisi'nden MP3/WAV/OGG ekleyin, dans ve ritim ayarını kaydedin, **yayın sahnesindeki Ses motorunu aç** düğmesine bir kez basın. Oynat/duraklat/sonraki/önceki, listeler, tekrar, ses ve kalibrasyon paneldedir. Müzik eklenmediyse sahne sessiz önizleme yapar; hazır şarkı paketi dağıtılmaz. [Müzik kullanım ve depolama rehberi](docs/music-and-choreography.md).

1080×1920 yayın görünümü: sahne URL'sine `/?broadcast=1` ekleyin. Tarayıcı ses izni bu görünümde de gerekir. Gerçek LIVE Studio yayını/pilot bu fazda sınanmadı.

Panel kapandığında sahne devam eder. Yerel servis bağlantısı kesilince durum görünür; sahne render etmeyi sürdürür ve WS yeniden bağlanır. TikTok bağlantısı kurulmuş gibi gösterilmez. `Ctrl+C` başlatıcının servislerini kapatır.

```powershell
npm run build
npm start
```

`build`, ortak paketleri, Node servisini ve iki Vite uygulamasını derler. `start`, bu build'lerin localhost önizlemesidir; Windows kurulum paketi veya internete dağıtım değildir. Yeni uygulama Three.js'i npm'den paketler; CDN/font isteği yapmaz. Eski prototip için `npm run dev:legacy` → http://127.0.0.1:4173; eski HTML'nin CDN bağımlılığı değişmedi.

## Veri ve test ortamı

SQLite varsayılanı `data/halay-fest.sqlite`; klasör otomatik oluşur, Git'e alınmaz. Ses dosyaları `data/halay-fest.sqlite.music/` içinde saklanır. Farklı dosya için PowerShell'de `$env:DATABASE_PATH='data/dev.sqlite'` ayarlayın; müzik klasörü aynı yol + `.music` olur. Gateway `.env` dosyasını otomatik yüklemez; `.env.example` örnektir. Ayarlar, müzik metadata'sı ve listeler yeniden açılışta korunur; ses otomatik başlamaz. Oyuncular ve tur durumu bellektedir; tam restart restore Faz 3'tedir.

Mock olay günlüğü en fazla 1000 kayıt tutar; açılışta 24 saatten eski kayıtlar temizlenir. Tekilleştirme bu sınırlı kayıt penceresini kapsar. Tam inbox/queue/streak/rule motoru Faz 4'tedir. Gerçek izleyici kaydı, şifre veya çerez kullanmayın.

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:legacy
npm audit --audit-level=moderate
npx playwright install chromium
npm run test:e2e
$env:TEST_PRODUCTION='1'
npm run test:e2e
```

`npm run verify`: lint + typecheck + birim/entegrasyon testleri + build. Playwright ayrıca çalıştırılır; geliştirme ve üretim önizlemesini destekler. Linux'ta `npx playwright install --with-deps chromium` kullanın. E2E yalnızca `data/e2e.sqlite` ve ona ait `.music` klasöründe sentetik verilerle çalışır. Testler `HALAY_PORT_OFFSET=10000` kullanır: dev sahne/panel 15173/15174, üretim 14174/14175, API/WS 18787; legacy 4173'te kalır. Bu test portları boş olmalıdır; normal önizleme ayrı portlarında açık kalabilir. Legacy testleri internet ister; yeni sahne CDN gerektirmez.

## Modüller ve kabul kapsamı

- `apps/broadcaster`: bağımsız Three.js yayın penceresi, native Web Audio ve HUD.
- `apps/control-panel`: React yönetim paneli; doğrulanmış servis durumu, ayarlar, mock kontrolleri ve olay listesi.
- `services/live-gateway`: Node HTTP/WS, mock adaptörü, SQLite migration ve yerel kayıt.
- `packages/contracts`: Zod şemaları ve sürümlü DTO; `game-core`: saf oyuncu/ayar/kontrol durumu.
- `packages/halay-game`: dosya oynatıcı, AudioContext beat-clock, onset analizi, rigged koreografi, el IK, kamera ve efektler. v0.2 dans/sentez kaynakları regresyon referansı olarak korunur.
- `packages/runtime-client`: doğrulamalı WS istemcisi ve tekrar bağlanma.
- `legacy/v0.2`: değişmemiş kaynaklar, SHA-256 manifesti ve koruma ZIP'i.

[Faz 1 raporu](docs/PHASE_1_REPORT.md), [mimari](docs/architecture.md), [olay sözleşmeleri](docs/event-contracts.md), [görev panosu](docs/TASK_BOARD.md), [riskler](docs/risks-and-dependencies.md), [lisanslar](docs/licensing.md).

**Faz 3'e geçilmedi.** Ortak otoriter tur saati, FIFO kuyruk, streak, tam kurallar, gerçek TikTok, güvenli LAN paneli ve 5 saat soak henüz yok. Yeni görsel varlıklar özgün stilize çalışmalardır; profesyonel folklor/mocap doğruluğu iddia edilmez. Node 24.13.1 yerelde SQLite için deneysel API uyarısı verir. Ölçüm, görüntüler ve açık kabul sınırları [Faz 2 raporundadır](docs/PHASE_2_REPORT.md).
