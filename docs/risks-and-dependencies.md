# Risk ve bağımlılık kaydı — 14 Kasım 2026

## Faz 2 görsel revizyonu

- Önceki profesyonel karakter/koreografi görseli kullanıcı tarafından reddedildi; yeni çalışma kabulü kapatmaz. [Güncel denetim](PHASE_2_VISUAL_REVIEW.md).
- Yeni npm bağımlılığı yok. Quaternius Standard CC0 model/kıyafet paketleri, kaynak sayfası ve ZIP lisansıyla doğrulandı; iki manifest ve lisans kanıtları depodadır. Genel kıyafetlerin yöresel doğruluğu yoktur.
- Offline doku dönüştürme Windows PowerShell/System.Drawing ve Python standard library kullanır; runtime/CI bu araçlara ihtiyaç duymaz. GLB'lerde maksimum 1024 px doku, paylaşılan materyal/geometri/klip ve uygun skeleton paylaşımı vardır. 106 teknik instance kısa ölçümü gerçek 100 izleyici/yayın kabulü değildir.
- Retarget doğrudan iki segmentli limb hiyerarşisi ve hazırlanmış bind/in-place veri bekler. Gerçek Halay mocap/Blender figürleri, FBX teslim dosyası ve uzman/kullanıcı kabulü eksiktir. Görünen mühendislik çalışmaları bu eksikleri gizlemez.
- Kayıt 16 sn VP8/Opus WebM, en çok 24 MiB; klip dosyası 32 MiB, manifest 128 KiB, sekans en çok iki imported klip. İzin JSON'u bağımsız lisans doğrulaması sayılmaz. Ayak/avuç proxy ölçümü gerçek taban/parmak temasını kanıtlamaz.

## Faz 2 güncellemesi

- Yeni runtime bağımlılığı: **music-metadata 12.5.0 (MIT)**, Node konteyner/süre kontrolü. Doğrudan sürüm ve transitive bütünlük lockfile'da; lisans `assets/licenses/music-metadata-MIT.txt` içinde. Ayrı native ses decoder'ı, cloud storage veya ücretli servis kurulmadı.
- R05: rig geometry/material/clip paylaşımı, karakter skeleton/mixer dispose, 600 frame/onset kaydı sınırı ve kalabalık gölge/DPR sınırı var. Kısa profil memory leak veya 5 saat kabulü değildir.
- R06: müzik AudioContext zamanı ile örneklenir; render dt clamp artık yerel tur süresini yavaşlatmaz. Ortak otoriter tur/restart restore hâlâ Faz 3. Saat-grid ölçümü akustik/OBS gecikmesi ölçmez.
- R07: gerçek rig, el IK, etiket çakışma reddi, kadraja göre kamera uzaklığı, 1080×1920 yayın görünümü eklendi. En fazla 24 etiket görünür; 100 ismin aynı anda okunacağı vaat edilmez. TikTok UI/OBS pilotu açık.
- R08/R12: test sesleri gerçek folk icrası değildir. Hakları doğrulanmış kayıt ve yöresel koreografi incelemesi yapılmadan profesyonel yayın kabulü verilmez. Yazılım GPU ölçümü hedef donanım 60 FPS sonucu değildir; beş saat/20 dk gerçek tur ayrı kabul konularıdır.
- R15: dosya/DB iki ayrı kalıcı ortamdır. Normal işlem hatası rollback ile sınanır; süreç iki commit arasında kesilirse sahipsiz dosya kalabilir. Dosyalar kotaya sayılır, otomatik silinmez; DB + müzik klasörü birlikte yedeklenmelidir.
- R16: onset analizi sabit tempolu, belirgin transient içeren kayıtlar içindir. Düşük güven/karmaşık ritim/değişken tempo manuel grid gerektirir. Dans/ölçü metadata'sı tempo tahmininden bağımsızdır.
- R17: tarayıcı ses izni sahnede bir kez verilir; panel kapanınca çalışır. Tek aktif sesli sahne desteklenir. Uyku, sahne kapanması veya Node kapanması için kesintisiz ses garantisi yoktur.

Güncel ölçümler ve kabul sınırları [Faz 2 raporunda](PHASE_2_REPORT.md); eski faz tablosu aşağıda tarihsel gözlem olarak korunur.

Faz 0 tablosu aşağıda tarihsel gözlemdir; güncel Faz 1 karşılıkları bu belgenin sonundadır.

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

## Faz 1 güncellemesi

- R01: yeni uygulama Three.js'i paketler, CDN/font yüklemez. Legacy eski CDN bağımlılığını korur.
- R02: sahne/panel ayrıldı; panel kapanması ve WS kesintisinde render devamı E2E ile sınanır.
- R03: mock kararlı userId ve sınırlı event ID tekilleştirmesi var; tam üretim idempotency/streak açık.
- R04: kapasite aşımı/uygunsuz kapasite azaltma reddedilir; FIFO yok.
- R05: karakter/sahne dispose eklendi; 5 saat leak kabulü yapılmadı.
- R06: özgün hareket/nota tabloları korunur; render dt clamp ve bağımsız yerel tur fazı sürer. Ortak tur saati Faz 3, beat ölçümü Faz 2.
- R07: ayrı 9:16 sahne ve NPC etiketleri var; TikTok güvenli alan/100 oyuncu okunabilirliği henüz kabul edilmedi.
- R08–R12: yayın hakları, public repo veri riski, tarihsel ZIP, gerçek TikTok ve uzun süre/performans riskleri açık.
- R13: kullanılan Node 24.13.1 node:sqlite için ExperimentalWarning verir; gizlenmez. Sürüm değişiminde migration/reopen testleri zorunlu.
- R14: inbox 1000 kayıt / açılışta 24 saat. Pencere dışı tekrarlar ve kaçan geçici efektler için recovery garantisi yok. Oyuncu/tur restart restore yok; ayarlar geri gelir.

| Yeni doğrudan bağımlılık | Sürüm | Lisans |
|---|---|---|
| three | 0.180.0 | MIT |
| react / react-dom | 19.3.1 | MIT |
| ws | 8.23.0 | MIT |
| zod | 4.6.7 | MIT |
| vite | 8.3.8 | MIT |
| tsx | 4.23.15 | MIT |
| prettier (biçimleme aracı) | 3.10.1 | MIT |
| @types/three | 0.180.0 | MIT |
| @types/react / @types/react-dom | 19.3.0 | MIT |
| @types/ws | 8.18.2 | MIT |

Metadata ve kurulan LICENSE dosyaları kontrol edildi. SQLite için ek native bağımlılık kurulmadı. [Vite preview proxy](https://vite.dev/config/preview-options.html#preview-proxy), [Rolldown kod bölme](https://rolldown.rs/reference/OutputOptions.codeSplitting) ve [Playwright WS hata enjeksiyonu](https://playwright.dev/docs/api/class-websocketroute) birincil belgelerden doğrulandı.

## Yerel video-hareket denemesi — 16 Kasım 2026

Normal npm kurulumuna veya runtime'a yeni bağımlılık eklenmedi. İzole `.git/tools/pose-site` dizininde Python 3.11 ile kullanılan isteğe bağlı üretim araçları: `mediapipe==0.10.21` (Apache-2.0), `opencv-contrib-python==4.11.0.86` (paket MIT, OpenCV Apache-2.0), `numpy==1.26.4` (BSD-3-Clause), `imageio-ffmpeg==0.6.0` (BSD-2-Clause sarmalayıcı). Sonuncunun Windows wheel'indeki FFmpeg **7.1** GPL özellikli ayrı bir ikilidir; sarmalayıcının BSD lisansı FFmpeg'i yeniden lisanslamaz. İkili, Python bağımlılıkları ve model dosyası Git'e/ürün build'ine alınmadı. Blender 4.5.16 ve sistem Node 24 mevcut araçlardır.

Pose Landmarker Heavy, resmi [MediaPipe API belgesi](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker?tab=Python) ve [BlazePose model kartı](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20BlazePose%20GHUM%203D.pdf) üzerinden seçildi. Yerel `.task` SHA-256: `64437af838a65d18e5ba7a0d39b465540069bc8aae8308de3e318aad31fcbc7b`. SDK/model Apache-2.0 kaydı, işlenen performansın veya müziğin kullanım hakkı değildir. [SDK lisansı](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE), [imageio-ffmpeg lisansı](https://github.com/imageio/imageio-ffmpeg/blob/v0.6.0/LICENSE) ve kurulan paket metadata'ları kontrol edildi. Otomatik SDK dünya koordinatları, ölçülmüş mocap/temas/yerel dans doğruluğu sayılmaz. Sonuç ve izlenen kalite kapısı `DELI_HORON_LOCAL_PROTOTYPE.md` içindedir.

## Tek karakter üretim araçları — 15 Kasım 2026

Yeni npm/runtime bağımlılığı yok. Yerel, Git'e alınmayan üretim araçları: Blender **4.5.16 LTS** (GPL; resmi Windows ZIP SHA-256 `e258e90a1ebc14798ad65b3426bc5f11f5e0e013541c61cc7c3ee9bbf4ca0ce6`) ve MPFB **2.0.18 kaynak sürümü**, commit `9de0707fdc88438d7c53a1a2ac7937d9221e2431` (kod GPL-3.0-or-later, grafik varlıklar/çıktılar CC0-1.0). MakeHuman System Assets CC0 paketi ve seçilmiş dosyaların kaynak/hash/lisans kanıtları `assets/licenses/makehuman-character-provenance.txt` ile karakter `build-info.json` içindedir. Blender/MPFB son kullanıcı kurulumu veya normal CI için gerekli değildir; paketlenmiş GLB runtime'da yüklenir. Blender kaynağındaki rig/mesh/dokular eklentisiz açılabilir; phenotype yeniden üretimi MPFB ister. Gerçek Halay klibi, artist onayı, yöresel giysi ve altılı/uzun süre performans kabulü açık.
