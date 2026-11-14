# Faz 2 — Teknik Teslim ve Açık Kabul Raporu

**Sonraki UI güncellemesi:** [Yayıncı stüdyosu raporu](PANEL_UI_REPORT.md), yeni ekran görüntüleri ve güncel kısa test sonuçları burada izlenir. Aşağıdaki donanım ölçümleri önceki koşuya aittir; UI yenilemesinde tekrarlanmış sayılmaz.

**Tarih:** 14 Kasım 2026, Europe/Istanbul. **Durum:** çalışan müzik/rig/ritim altyapısı teslim edildi; profesyonel görsel/işitsel kabul açık olduğu için Faz 2 bütünü tamamlandı olarak işaretlenmedi. [Taslak PR #3](https://github.com/Rdvn268/Halay-Fest/pull/3). **Faz 3'e geçilmedi.**

ROADMAP.md baştan sona, docs/PHASE_1_REPORT.md ve mevcut kaynaklar incelendi. Dal `feat/phase-2-music-and-choreography`, kabul edilmiş Faz 1 `896d75b` üzerine kuruldu. Faz 0/1 PR'ları henüz main'e birleştirilmediği için PR tabanı `feat/phase-1-modular-runtime`; otomatik merge yapılmadı. ROADMAP, legacy ve önceki iki faz raporu değiştirilmedi.

## Yapılan somut işler

- **Müzik Yöneticisi:** React panelinde MP3/WAV/OGG yükleme; kütüphane/çoklu listeler; sıra, çıkarma ve silme; play/pause/seek/önceki/sonraki; autoplay/repeat/ses; dans, BPM, ilk vuruş, ölçü ve kalibrasyon. Ses çıkışını yayın sahnesi sahiplenir; panel kapanınca sürer.
- **Kalıcı ve sınırlı depolama:** disk stream/HTTP Range + SQLite migration 2. Dosya 64 MiB, toplam 1 GiB/200 parça, 20 liste, parça başına 1 saat. Uzantı/MIME/imza/konteyner/örnekleme hızı/süre doğrulanır. Upload RAM'de tüm dosyayı biriktirmez; her chunk kotadan geçer. Dosya/DB hatası, rollback, concurrent mutation ve stale-ended senaryoları testlidir. Her DB'nin ayrı `.music` klasörü vardır.
- **Ritim:** AudioContext beat-clock; pause/seek/buffering anchor; 7/8 dahil beat-grid; stereo PCM passthrough RMS worklet, onset/BPM/faz/güven ve ölçü adayları. Manuel BPM ezilmez; BPM dans türü seçmez. Grid/dans değişimi sonraki ölçüde, figür dört tam ölçü sonunda uygulanır. Şarkı/figür değişimi kemik pozlarından 350 ms blend edilir; yeni oyuncu ortak fazı sıfırlamaz.
- **Gerçek skeletal asset:** binary GLB, tek skinned mesh, 17 kemik, ağırlıklı vertexler, 7.616 üçgen ve 12 quaternion/position klibi. Halay ve Horon ayrı figürler; Govend/Zeybek aynı registry'de başlangıç çalışmalarıdır. Altı varyasyon aynı kostümün **renkleridir**; farklı giysi kesimleri veya profesyonel mocap paketi olduğu iddia edilmez. Özgün generator, SHA-256 manifesti ve asset lisansı depoda.
- **Sahne:** el IK; kapalı iç halka ve dış halkalar/açık zincirler; yedinci oyuncunun mevcut halkaya katılması; ekran koordinatında etiket çakışma reddi, en fazla 24 görünür etiket; gerçek halka yarıçapına göre kamera uzaklığı; 9:16 yayın görünümü; özgün döşeme/çatı/sıva dokuları, bank/çiçek/davul/ışık/flama detayları, gölge ve ton eşleme. Ayak/zemin ve kamerayı kapatan dekor sorunları görsel incelemede bulunup düzeltildi.
- **Performans:** paylaşılan geometri/material/klip, karakter başına skeleton/mixer; sınırlı frame/onset/clock geçmişi; kalabalıkta gölge ve DPR sınırı. Karakter sayısı değişince profil penceresi sıfırlanır. Düşük FPS artık yerel tur süresini yavaşlatmaz. Ortak otoriter tur saati/FIFO/restart restore eklenmedi.
- **Faz 1 korunması:** mock yorum/takip/hediye, WS kesintisi/yeniden bağlanma, ayarlar ve bağımsız panel/sahne sürer. Eski v0.2 hareket/nota/sentez kaynakları regresyon referansı olarak korunur; yeni runtime dosyanın yerine osilatör çalıştırmaz. Panel eski track/sequence telemetrisini güncel durum olarak göstermez. Aynı sequence ile restore edilmiş paused snapshot'ı çalan sesi durdurur.

## Çalıştırma

```powershell
git clone --branch feat/phase-2-music-and-choreography https://github.com/Rdvn268/Halay-Fest.git
cd Halay-Fest
npm ci
npm run dev
# Sahne 5173, panel 5174, API/WS 8787
# Yayın görünümü: http://127.0.0.1:5173/?broadcast=1
npm run build
npm start
# Build: sahne 4174, panel 4175
```

Node 24.13.1+ / npm 11. `npm ci`, üst masaüstü klasöründe değil **package.json ve package-lock.json bulunan depo kökünde** çalışır. Main'deki yalnız yol haritası uygulama kurulumu değildir. [Müzik ve depolama rehberi](music-and-choreography.md). DB + ona ait `.music` klasörü birlikte yedeklenir. Yeniden açılışta listeler/metadata korunur; ses kendiliğinden başlamaz. Tek aktif yayın sahnesi desteklenir.

## Testler ve gerçek sonuçlar

| Kontrol | Sonuç |
|---|---|
| npm ci | Başarılı; 173 paket kuruldu, 181 paket audit, 0 bildirim |
| npm run lint / typecheck | Geçti; strict TS ve uyarısız lint |
| npm run test | **49/49**: önceki 26 + clock/ritim 9 + müzik servis/depolama 9 + GLB/formasyon/tur 4 + stereo worklet 1 |
| npm run build | Paketler + Node + iki UI başarılı; en büyük JS chunk yaklaşık 318,5 kB |
| npm run check:legacy | Kaynak kontrolü geçti; ayrıca byte/hareket/nota koruma testleri geçti |
| npm audit --audit-level=moderate | 0 bildirilen açık; genel güvenlik garantisi değildir |
| Kısa dev Chromium | 11/11 geçti; son runtime ayrıca GitHub dev işinde yeşil. İki opt-in uzun/donanım testi normal CI'da atlanır |
| Kısa production Chromium | **11/11**, son yerel koşu 1,7 dk; 2 opt-in test atlandı, retries=0 |
| Software sync tanısı | 1/1 geçti, 11,4 dk; 600+ sn sync + 60+ sn 106 rig; son görsel/stereo düzeltmelerinden önceki ayrı tanı kaydı |
| Son runtime / gerçek Radeon | **1/1 geçti, 11,5 dk**; 602,2 sn altı NPC + 60,3 sn 106 rig, 1080×1920; zaman hızlandırılmadı |
| GitHub CI | Runtime `7ee81aa` için [CI #18](https://github.com/Rdvn268/Halay-Fest/actions/runs/43527605910) **4/4 başarılı**: Windows, Linux, Chromium dev ve production. Son kanıt commit'inin güncel kontrolleri PR #3 üzerinde izlenir |

49 testin 26'sı eski koruma/altyapı regresyonudur; yeni Faz 2 kabulü olarak sayılmaz. Yeni testler gerçek disk stream/Range, DB kapat/aç sonrası metadata/listeler/dosya byte'ları, bozuk konteyner, disk hatası, chunk/header kotası, SQLite rollback, eşzamanlı upload, autoplay/repeat ve yinelenen ended davranışını sınar. GLB parse edilir, skin/kemik/klip envanteri ve source/hash doğrulanır; farklı kliplerde gerçek bone quaternion'u değişir. Aynı asset generator tekrar çalıştırıldığında GLB SHA-256 değişmedi: `3e6fdfc7b6fdcce9defdec035c6df2684e7234c76fcff39c51b25dd7ba66d4a6`.

E2E gerçek WAV/MP3/OGG decoding; liste sırası/metadata/reload; ses/seek; disk hatası; panel close sonrası ses/otomatik Halay→Horon; yeni oyuncu ve rig; mock/reconnect davranışını sınar. Decoded 108 BPM kayıt analizinde createOscillator çağrısı yasaklanır; tahmin 108 BPM olur ve yönetici Govend seçimi değişmez. Zeybek geçişi de sınanır. Paused restore snapshot'ı WS üzerinden **enjekte edilir**; bu test gerçek gateway restart orkestrasyonu olarak sunulmaz. Kalıcı kayıt ayrıca gerçek SQLite reopen testlidir.

İlk clock testindeki floating-point ölçü sınırı hatası düzeltildi. İlk asset testi birbirine çok yakın fazları kıyaslıyordu; ayırt edici çeyrek ölçü örneği kullanıldı. Playwright inputFiles içinde path/Buffer karışımı tip hatası gerçek Buffer'larla düzeltildi. İlk E2E **5/6** oldu: test sürerken kaynak düzenlemesi Vite reload'u doğurdu ve ses izni sıfırlandı. Kaynaklar sabitlenip tekrarlandı, geçti; otomatik retry eklenmedi. Uygulama içi tarayıcı bağlantısı `missing sandboxPolicy` ortam hatası verdi; bağımsız gerçek Chromium/Playwright ile doğrulandı. SQLite ExperimentalWarning ve SwiftShader ReadPixels uyarıları gizlenmedi.

## Görsel ve performans kanıtı

[Halay](evidence/phase-2/hardware-6-1080x1920.png) · [Horon](evidence/phase-2/hardware-horon-1080x1920.png) · [106 rig](evidence/phase-2/hardware-106-1080x1920.png) · [Müzik Yöneticisi](evidence/phase-2/music-manager.png) · [Disk hatası](evidence/phase-2/music-storage-error.png) · [Grafik](evidence/phase-2/hardware-performance.png) · [Ham donanım JSON'u](evidence/phase-2/hardware-performance.json) · [Hesaplanan özet](evidence/phase-2/measurement-summary.json).

Görüntüler tarayıcıdan alındı ve görsel olarak incelendi; rötuşlanmadı. [Kanıt envanteri](evidence/phase-2/README.md), [Faz 1 önceki görüntüsü](evidence/phase-1/phase1-scene.png). Grafik ham veriden matplotlib ile üretilir; ekran görüntüsü olarak sunulmaz. Son runtime bundle `index-tfIivJWg.js`, worklet hash ve GLB manifesti ham JSON'dadır.

**Ortam:** Windows 11 (10.0.22631), Ryzen 5 5500, Radeon RX550/D3D11, Chromium 158.0.8127.18, gerçek 1080×1920 canvas. Test kaydı özgün 120 BPM / 0,15 sn kalibrasyon sinyalidir; gerçek halk müziği icrası değildir. Başka aktif yayın sahnesi veya panel açık tutulmadı.

| Ölçüm | 6 NPC / 602,2 sn | 100 mock + 6 NPC / 60,3 sn |
|---|---|---|
| Örneklenen kayan pencere FPS min / medyan / max | 82,2 / **92,6** / 112,2 | 66,9 / **71,9** / 77,2 |
| Kare süresi p95 aralığı | 13,9–14,0 ms | **20,8–20,9 ms** |
| JS heap min–max | 24,2–49,3 MiB | 33,7–62,4 MiB |
| Clock/media farkı p95 medyanı | 6,93 ms | 6,99 ms |
| Decoded onset/grid farkı p95 medyanı | 9,26 ms | 9,31 ms |
| Telemetri örnekleri | 121; özet için ilk 30 sn hariç 115 | 13 |

Son 10 dk örneğinde medya 612,24 sn, clock farkı p95 **6,86 ms**, onset-grid p95 **9,30 ms**, 600 onset örneği; JS hata listesi boştur. Örneklenen en büyük el endpoint farkı altı NPC'de yaklaşık 20 mm, 106 rig'de 7 mm'dir. Son kalabalık örneği 484 draw call / 863.189 üçgen gösterir; bu, tüm çalışma boyunca sabit draw sayısı değildir.

FPS değerleri her kare için alt sınır değil, 600 gözlemlik pencerelerden örneklenmiş ortalamalardır. Kalabalıkta kare p95 16,7 ms'yi aşar; **sabit 60 FPS garantisi verilmez**. JS heap GPU belleği/process RSS değildir ve 10 dakikalık gözlem memory leak/5 saat kabulü değildir. Clock/onset-grid farkı hoparlör veya OBS capture'ın uçtan uca işitsel-görsel gecikmesini ölçmez. Software ölçümü final donanım ölçümüyle karıştırılmaz.

## Kabul kapısı ve kalan işler

| Kabul | Durum |
|---|---|
| Kendi dosyasını ekleme / kalıcılık / listeler | Geçti: üç codec E2E, gerçek DB reopen ve dosya karşılaştırması |
| Otomatik parça değişimi / repeat | Geçti: gerçek ended → API → WS → sonraki dosya; unit autoplay/repeat |
| Müziğe bağlı ayrı Halay/Horon figürleri | Teknik akış ve gerçek GLB hareketi geçti; profesyonel yöresel doğruluk açık |
| Çalarken senkron ölçümü | Geçti: son runtime'da 602 gerçek saniye, ham clock/onset verisi |
| Panel kapanınca oyun ve müzik | Geçti: iki gerçek sayfa; close sonrası ses, render ve otomatik geçiş |
| Mevcut mock etkileşimleri | Geçti; gerçek TikTok destekleniyor gibi gösterilmez |
| Yeni görsel / testler | Gerçek PNG'ler incelendi; unit/integration/E2E/CI geçti |
| 100 oyuncu kapasite profili | 106 gerçek skinned rig mock kimliklerle ölçüldü. Pencere FPS'leri bu koşuda 60 üzerindeydi; her kare/uzun yayın garantisi değildir |
| Profesyonel karakter/kostüm/koreografi | **Kısmi:** özgün stilize rig/keyframe ve tek kostümün altı rengi var. Çeşitli profesyonel giysi kesimleri, folk mocap ve folklor uzmanı kabulü yok. Govend/Zeybek başlangıç etütleridir |
| İzinli gerçek kayıtla işitsel kabul | **Açık:** çalışmada yayın izni belgeli gerçek Halay/Horon icrası kullanılmadı. Kalibrasyon sesleri gerçek müzik paketi olarak sunulmadı; lisansı belirsiz kayıt/model indirilmedi |
| 20 dk otomatik döngü / 5 saat | Yerel 20 dk sınır mantığı unit testli. **20 dk gerçek tur ve 5 saat soak çalıştırılmadı**; ortak tur otoritesi Faz 3'tür |

Yeni doğrudan bağımlılık **music-metadata 12.5.0 MIT**; [lisans kaydı](licensing.md). Modeller/motion capture için üçüncü taraf asset eklenmedi; özgün asset CC0 kapsamında, tüm depoya/legacy'ye lisans atanmadı. Python/soundfile/numpy/matplotlib yalnız isteğe bağlı fixture/grafik üretim araçlarıdır; app veya CI bağımlılığı değildir. Dosya ve DB iki ayrı kalıcı ortamdır: normal hata rollback'i testlidir, ani süreç kesilmesinde sahipsiz `.part`/`.delete` kalabilir; otomatik veri silinmez, kotaya sayılır. [Diğer sınırlar](music-and-choreography.md).

Sonraki küçük görev **Faz 2 içinde**: izinli iki gerçek kayıtla işitsel grid/koreografi incelemesi, çeşitli profesyonel kıyafet/hareket varlıkları ve LIVE Studio içinde görsel/işitsel kabul. Bu açık konular kapanmadan PR taslak kalır ve Faz 3 başlatılmaz.
