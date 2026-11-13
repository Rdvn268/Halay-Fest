# HALAY FEST

Windows odaklı, TikTok LIVE etkileşimlerini ileride 3D halay/horon oyununa dönüştürmeyi hedefleyen proje. **Şu an çalışan çıktı v0.2 yerel simülasyonudur. Gerçek TikTok bağlantısı yoktur.**

Ana gereksinim: [ROADMAP.md](ROADMAP.md). Bu teslim yalnızca **Faz 0** kapsamındadır; React paneli, Node API/WebSocket, SQLite ve modüler oyun uygulaması Faz 1'de ele alınacaktır.

Faz 0 kabulü tamamlandı; GitHub Windows/Linux araç kontrolleri ve Chromium smoke testi başarılı. [PR #1](https://github.com/Rdvn268/Halay-Fest/pull/1) incelemeye sunulur. Faz 1'e geçilmedi.

## Windows kurulumu

Node.js **24 LTS** (en az 24.13.1), npm **11** ve Git gerekir. Node sürümünü `.nvmrc` / `.node-version` ile seçebilirsiniz. Yerelde doğrulanan sürümler: Node 24.13.1, npm 11.8.0.

```powershell
git clone https://github.com/Rdvn268/Halay-Fest.git
cd Halay-Fest
git switch chore/phase-0-audit
node --version
npm --version
npm ci
npm run dev
```

`http://127.0.0.1:4173` adresini Chrome/Edge'de açın. `Ctrl+C` sunucuyu durdurur. Port doluysa PowerShell'de `$env:PORT=4174` ayarlayın. `.env.example` gelecekteki servisler için belgedir; bu fazda `.env` yüklenmez.

Three.js ve Google Fonts dışarıdan yüklenir, dolayısıyla **internet gerekir**. Müzik için bir kez **Müziği başlat** düğmesine basın. `katıl`, `Takip et`, toplu katılım ve hediyeler simülasyondur. Sahneyi büyütme mevcut prototip özelliğidir; yayın kurulum kabulü yapılmadı.

## Kontroller

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:legacy
npm audit --audit-level=moderate
npx playwright install chromium
npm run test:e2e
```

`npm run verify` lint, typecheck, birim/HTTP/koruma testleri ve build'i sırayla çalıştırır. `npm run build` yalnızca Faz 0 TypeScript araçlarını `dist/scripts/` altına derler; oyunu yeniden paketlemez. Playwright testi ayrıca çalıştırılır ve gerçek Chromium/WebGL/Web Audio ile prototipi açar; CDN erişimi gerekir. Linux'ta tarayıcı bağımlılıkları için `npx playwright install --with-deps chromium` kullanın.

`npm run audit:legacy` salt okunur SHA-256/varlık envanteri üretir. `npm run check:legacy` kaynaklar eksikse sıfırdan farklı kodla çıkar; kaynak varlığı oyun kabulü değildir. Çalışma kabulü rapor ve tarayıcı kanıtlarıyla değerlendirilir.

## Klasörler ve kanıtlar

- `legacy/v0.2/`: değişmemiş kaynaklar ve yeni koruma ZIP'i; kaynak dal geçmişi korunmuştur.
- `scripts/`: denetim CLI'ı ve yalnızca localhost'ta çalışan prototip önizlemesi.
- `test/unit/`, `test/e2e/`: Faz 0 doğrulamaları; `test/soak/` henüz plan.
- `apps/`, `services/`, `packages/`: yol haritasındaki sınırları gösteren açıklama klasörleri; çalışır Faz 1 paketleri değildir.
- [Faz 0 raporu](docs/PHASE_0_REPORT.md), [mevcut sistem](docs/current-system.md), [görev panosu](docs/TASK_BOARD.md), [risk/bağımlılıklar](docs/risks-and-dependencies.md), [lisans kaydı](docs/licensing.md).

Bu sürüm için 5 saat dayanıklılık, 100 oyuncuda FPS, gerçek TikTok, güvenli LAN kontrolü veya yayın hazır olma iddiası yoktur. Depo şu anda herkese açıktır; görünürlüğü bu görevde değiştirilmedi. Şifre, çerez, gerçek izleyici kaydı veya kişisel veri commit etmeyin.
