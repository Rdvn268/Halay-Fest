# Risk ve bağımlılık kaydı — 14 Kasım 2026

## Mevcut riskler

| ID | Risk / gözlem | Sonraki eylem |
|---|---|---|
| R01 | Three.js ve Google Fonts CDN/internet bağımlılığı | Faz 1: paketle ve lisansları koru; kontrollü çevrimdışı açılış |
| R02 | Tek HTML: panel/sahne aynı yaşam döngüsünde | Faz 1: ayrı sayfa/süreç, kapanma testi |
| R03 | Ad temelli kimlik; gerçek olay idempotency yok | Faz 4: kararlı ID ve dedupe/streak testleri |
| R04 | Kapasite azaltma mevcut oyuncuyu çıkarmıyor; kuyruk yok | Faz 3: açık kapasite/FIFO politikası |
| R05 | NPC/oyuncu kaldırmada eksik GPU dispose | Faz 2/8: kaynak yönetimi ve gerçek soak |
| R06 | Clamp edilen render zamanı duvar saatinden sapabilir; müzik duraklatmadan bağımsız | Faz 2/3: beat clock ve tick tasarımı; saat testleri |
| R07 | 9:16, tam NPC etiketi ve HUD güvenli alanı henüz hedef düzeyde değil | Faz 2/7: yayın görünümü kabulü |
| R08 | Kaynak özgünlük iddiası lisans/üçüncü taraf hak onayı yerine geçmez | Yayından önce varlık sahibi ve hak kanıtları |
| R09 | Depo public; yol haritası private öneriyor | Mevcut görünürlük değişmedi; hassas veri ekleme |
| R10 | Tarihsel ZIP yok | İki kaynak korundu; yeni ZIP açık provenance ile üretildi |
| R11 | Resmî olmayan TikTok sağlayıcısı, takip/streak/platform belirsizlikleri | Faz 5 öncesi güncel sağlayıcı/lisans/şart değerlendirmesi; henüz kurulmadı |
| R12 | 100 oyuncu FPS, 20 dk gerçek tur, 5 saat ve canlı pilot ölçülmedi | İlgili fazların kabul testleri; bu fazın kısa testlerinden sonuç çıkarma |

## Kurulan araçlar

Tümü geliştirme bağımlılığıdır; doğrudan sürümler sabittir, transitive bütünlük `package-lock.json` ile kilitlidir.

| Paket | Sürüm | Paket lisansı | Amaç |
|---|---|---|---|
| typescript | 6.0.3 | Apache-2.0 | Araçların strict tip kontrolü/build |
| vitest | 5.1.0 | MIT | Denetim, HTTP, koruma testleri |
| eslint | 10.14.0 | MIT | Statik kod denetimi |
| typescript-eslint | 8.72.2 | MIT | TS lint |
| @types/node | 24.19.2 | MIT | Node 24 tipleri |
| @playwright/test | 1.65.0 | Apache-2.0 | Chromium regresyon ve ekran görüntüsü |
| minimatch (override) | 11.0.8 | ISC | Güvenlik düzeltmesi; ESLint ağacında kullanılır |

TypeScript 7 yerine 6.0.3 seçildi: typescript-eslint 8.72.2 peer aralığı `>=4.8.4 <6.1.0`. Başlangıç kurulumundaki 8 orta önem bildirimi aynı minimatch zincirinden geldi. [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) için `minimatch` 11.0.8 override uygulandı; lint/typecheck/test/build ve `npm audit` ile doğrulandı. Bu büyük sürüm override'ı upstream uyumlu geçiş sunduğunda yeniden değerlendirilmelidir. Güncel taramada 0 bildirim, genel güvenlik garantisi değildir.

Node 24 LTS ve npm 11 kullanılır ([Node sürüm tablosu](https://nodejs.org/en/about/previous-releases)). `npm ci` kilit dosyasına göre kurar ([npm belgesi](https://docs.npmjs.com/cli/v11/commands/npm-ci/)). GitHub Actions'lar doğrulanan commit SHA'larına sabitlendi; CI Windows/Linux üzerinde aynı komutları çalıştırır ([Actions Node rehberi](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)). Playwright gerçek Chromium indirir; yerel sürüm 158.0.8127.18, SwiftShader yazılım WebGL kullanır. Bu ortam FPS ölçümü için yayın donanımını temsil etmez.
