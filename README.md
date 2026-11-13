# HALAY FEST

Windows odaklı, yerelde çalışan 3D halay/horon simülatörü. **Faz 1: modüler iskelet ve mock aktarım. Gerçek TikTok bağlantısı desteklenmiyor.** Ana gereksinim [ROADMAP.md](ROADMAP.md); Faz 0 referansı [korunmuş v0.2](legacy/v0.2/README.md).

## Başlatma

Git, Node **24 LTS** (en az 24.13.1) ve npm **11** gerekir. Sürüm seçimi `.nvmrc` / `.node-version` ile yapılabilir.

```powershell
git clone --branch feat/phase-1-modular-runtime https://github.com/Rdvn268/Halay-Fest.git
cd Halay-Fest
npm ci
npm run dev
```

| Yerel pencere/servis | Geliştirme | Build önizlemesi |
|---|---|---|
| Three.js yayın sahnesi | http://127.0.0.1:5173 | http://127.0.0.1:4174 |
| React yönetim paneli | http://127.0.0.1:5174 | http://127.0.0.1:4175 |
| Node API / WebSocket | http://127.0.0.1:8787/api/health | Aynı |

Panel ve sahneyi ayrı sekmelerde açın. Panelde demo kullanıcı ID ve adını girip `katıl` yorumu gönderin. Karakter sahneye eklenir; aynı ID ikinci karakter açmaz. Hediyeler **tekli mock efektlerdir**. Müziği tarayıcı izni nedeniyle **yayın sahnesindeki Müziği başlat** düğmesinden bir kez açın. Paneldeki dans/ses/ayar değişiklikleri **Ayarları kaydet** ile uygulanır.

Panel kapandığında sahne devam eder. Yerel servis bağlantısı kesilince durum görünür; sahne render etmeyi sürdürür ve WS yeniden bağlanır. TikTok bağlantısı kurulmuş gibi gösterilmez. `Ctrl+C` başlatıcının servislerini kapatır.

```powershell
npm run build
npm start
```

`build`, ortak paketleri, Node servisini ve iki Vite uygulamasını derler. `start`, bu build'lerin localhost önizlemesidir; Windows kurulum paketi veya internete dağıtım değildir. Yeni uygulama Three.js'i npm'den paketler; CDN/font isteği yapmaz. Eski prototip için `npm run dev:legacy` → http://127.0.0.1:4173; eski HTML'nin CDN bağımlılığı değişmedi.

## Veri ve test ortamı

SQLite varsayılanı `data/halay-fest.sqlite`; klasör otomatik oluşur, Git'e alınmaz. Farklı dosya için PowerShell'de `$env:DATABASE_PATH='data/dev.sqlite'` ayarlayın. Gateway `.env` dosyasını otomatik yüklemez; `.env.example` örnektir. Ayarlar yeniden açılışta korunur. Oyuncular ve tur durumu bu fazda bellektedir; tam restart restore Faz 3'tedir.

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

`npm run verify`: lint + typecheck + birim/entegrasyon testleri + build. Playwright ayrıca çalıştırılır; geliştirme ve üretim önizlemesini destekler. Linux'ta `npx playwright install --with-deps chromium` kullanın. E2E yalnızca `data/e2e.sqlite` içinde sentetik verilerle çalışır; 4173, 8787 ve uygulama portlarının boş olması gerekir. Legacy testleri internet ister; yeni sahne CDN gerektirmez.

## Modüller ve kabul kapsamı

- `apps/broadcaster`: bağımsız Three.js yayın penceresi, native Web Audio ve HUD.
- `apps/control-panel`: React yönetim paneli; doğrulanmış servis durumu, ayarlar, mock kontrolleri ve olay listesi.
- `services/live-gateway`: Node HTTP/WS, mock adaptörü, SQLite migration ve yerel kayıt.
- `packages/contracts`: Zod şemaları ve sürümlü DTO; `game-core`: saf oyuncu/ayar/kontrol durumu.
- `packages/halay-game`: v0.2'den taşınan geometri, dans, kamera, efekt ve müzik modülleri.
- `packages/runtime-client`: doğrulamalı WS istemcisi ve tekrar bağlanma.
- `legacy/v0.2`: değişmemiş kaynaklar, SHA-256 manifesti ve koruma ZIP'i.

[Faz 1 raporu](docs/PHASE_1_REPORT.md), [mimari](docs/architecture.md), [olay sözleşmeleri](docs/event-contracts.md), [görev panosu](docs/TASK_BOARD.md), [riskler](docs/risks-and-dependencies.md), [lisanslar](docs/licensing.md).

Faz 2–10 uygulanmadı. Gelişmiş koreografi/beat geçişleri, ortak otoriter tur saati, FIFO kuyruk, streak, tam kurallar, gerçek TikTok, güvenli LAN paneli, 100 oyuncu FPS ve 5 saat soak henüz kabul edilmiş değildir. Node 24.13.1 yerelde SQLite için deneysel API uyarısı verir; ayrıntılar rapordadır.
