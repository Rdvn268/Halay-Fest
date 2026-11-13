# Faz 2 Sonuç ve Açık Kabul Raporu

**Tarih:** 14 Kasım 2026, Europe/Istanbul. **Durum:** çalışan teknik kapsam teslim edildi; profesyonel görsel/işitsel ve yayın donanımı kabulü açık olduğundan Faz 2 bütünü tamamlandı olarak işaretlenmedi. [Taslak PR #3](https://github.com/Rdvn268/Halay-Fest/pull/3). **Faz 3'e geçilmedi.**

## Kapsam ve yapılan işler

ROADMAP.md baştan sona, docs/PHASE_1_REPORT.md ve mevcut kaynaklar incelendi. Yeni dal `feat/phase-2-music-and-choreography`, Faz 1 `896d75b` üzerine kuruldu. Faz 0/1 PR'ları henüz main'e birleştirilmediği için PR tabanı `feat/phase-1-modular-runtime`; otomatik merge yapılmadı. ROADMAP, legacy ve önceki iki faz raporu değiştirilmedi.

- **Müzik:** React Müzik Yöneticisi; MP3/WAV/OGG yükleme, kütüphane ve çoklu listeler, sıralama/çıkarma/silme, önceki/sonraki, play/pause/seek, autoplay/repeat, ses, dans türü ve manuel BPM/ilk vuruş/ölçü/kalibrasyon. Gerçek dosya oynatma yayın sahnesindedir; panel kapanınca ses sürer.
- **Kalıcı kayıt:** disk stream/HTTP Range + SQLite migration 2, doğrulanmış metadata/listeler. Dosya 64 MiB, kütüphane 1 GiB/200 parça, en fazla 20 liste/1 saat. Uzantı/MIME/imza/konteyner/süre kontrolü; disk/DB hatası, eşzamanlı işlem, boyut ve stale-ended kontrolü. DB hatasında dosya/metadata rollback'i gerçek SQLite hata enjeksiyonuyla sınandı. Her DB'nin `.music` klasörü ayrıdır.
- **Ritim:** AudioContext beat-clock, buffering/pause/seek anchor, 7/8 dahil gerçek beat-grid, streaming worklet RMS/onset analizi, güvenli BPM/faz tahmini ve ölçü adayları. Manuel BPM ezilmez; dans metadata'dır. Çalarken grid/dans sonraki ölçüde, figür dört ölçü sonunda değişir. Şarkı/figür değişiminde kemik pozları 350 ms blend edilir; oyuncu girişi ortak fazı sıfırlamaz.
- **Gerçek skeletal asset:** binary GLB, tek skinned mesh, 17 kemik, ağırlıklı vertexler ve 12 farklı quaternion/position klibi. Halay/Horon ayrı; Govend/Zeybek genişletilebilir başlangıç figürleridir. Altı kostüm **rengi** vardır; altı farklı giysi kesimi/mocap paketi olduğu iddia edilmez. Model, skin ve klipler özgün generator kaynaklıdır; üçüncü taraf model kullanılmadı. Hash manifesti/CC0 asset lisansı depoda.
- **Sahne:** iki kemikli el IK; iç halka/dış halkalar ve eksik dış halkada açık zincir; yedinci oyuncunun mevcut halkaya eklenmesi; görünür etiketlerde ekran çakışma reddi, en fazla 24 etiket; kadraja göre kamera uzaklığı; özgün döşeme/çatı/sıva dokuları, dekoratif davul, bank/çiçek/ışık/flama detayları, gölgeler ve ton eşleme. `?broadcast=1` gerçek 9:16 yüzey sunar.
- **Performans/koruma:** paylaşılan GLB geometri/material/klipler, ayrı skeleton/mixer, bounded frame/onset/clock geçmişi, kalabalıkta sınırlı gölge ve DPR. Oyuncu sayısı değişince profil geçmişi sıfırlanır. Düşük FPS artık yerel tur süresini yavaşlatmaz; 20 dk sınırı saf zaman testiyle sınanır. Ortak tur otoritesi/restart restore eklenmedi.
- **Faz 1:** mock yorum/takip/hediye, WS kesintisi/yeniden bağlanma, ayarlar, panel/sahne ayrımı sürer. Eski v0.2 dans ve sentez kaynakları byte/hareket/nota regresyonunda korunur; yeni runtime dosya yerine canlı osilatör üretmez.

## Çalıştırma

Son görsel doğrulamada karakter ayaklarının kaplamaya gömülmesi ve ışık/flama iplerinin yakın kamera kadrajını kapatması bulundu; zemin yüksekliği, relative el IK, dekor yüksekliği ve gerçek halka yarıçapına bağlı kadraj düzeltildi. Worklet stereo kanalların ortalama enerjisini izler; sağ kanal ritmi ve PCM passthrough unit testlidir. Panel yalnız güncel track/sequence telemetrisini oynatma durumu olarak kullanır. Aynı sequence ile restore edilen `playing=false` snapshot'ının çalan sesi durdurması WS hata enjeksiyonuyla sınanır; bu test gerçek gateway restart orkestrasyonu olarak sunulmaz.

Gerçek GPU profili tam Chromium ile Radeon RX550/D3D11 üzerinde çalıştırılır; SwiftShader ölçümüyle karıştırılmaz. Son görsel düzeltmelerden önceki software JSON'u tanı kaydıdır. Final donanım testi en az 600 gerçek saniye altı rig, ardından en az 60 saniye 106 rig örnekler; otomatik süre hızlandırması yoktur.

```powershell
git clone --branch feat/phase-2-music-and-choreography https://github.com/Rdvn268/Halay-Fest.git
cd Halay-Fest
npm ci
npm run dev
# Sahne 5173, React panel 5174; API/WS 8787
# Yayın görünümü: http://127.0.0.1:5173/?broadcast=1
npm run build
npm start
# Build: sahne 4174, panel 4175
```

Node 24.13.1+ / npm 11. `npm ci` üst masaüstü klasöründe değil, package.json + package-lock.json bulunan depo kökünde çalıştırılır. [Ayrıntılı müzik rehberi](music-and-choreography.md). Veritabanı ve ona ait `.music` klasörü birlikte yedeklenir. Yeniden açılışta metadata/listeler kalır; ses otomatik başlamaz, yeni sahnede izin/Oynat gerekir.

## Doğrulama

| Komut/kontrol | Gerçek sonuç |
|---|---|
| npm ci | Başarılı; 173 paket kuruldu, 181 paket audit, 0 bildirim |
| npm run lint / typecheck | Geçti; strict TS ve uyarısız lint |
| npm run test | **49/49**: mevcut 26 + beat/ritim 9 + müzik servis/depolama 9 + GLB/formasyon/tur 4 + stereo worklet 1 |
| npm run build | Paketler + Node + iki UI başarılı; en büyük JS chunk yaklaşık 318,5 kB |
| npm run check:legacy | Kaynak varlığı kontrolü geçti; ayrıca koruma/hareket/nota testleri geçti |
| npm audit --audit-level=moderate | 0 bildirilen açık; genel güvenlik garantisi değildir |
| Tam dev Chromium | **11 geçti / 1 uzun test bilinçli atlandı**, 1,8 dk; retries=0 |
| Tam production Chromium | **11 geçti / 1 uzun test bilinçli atlandı**, 1,7 dk; retries=0 |
| Son build gerçek süreli sync/profil | Son koşu ve görüntü doğrulaması bekleniyor; aşağıdaki metrikler final kanıtla doldurulacak |
| GitHub CI | `185c6e9` için [CI #14](https://github.com/Rdvn268/Halay-Fest/actions/runs/43524942468) **4/4 başarılı**: Windows/Linux tooling ve dev/production Chromium. Final kanıt commit'i ayrıca kontrol edilecek |

49 testin 26'sı eski koruma/altyapı regresyonudur; yeni Faz 2 kabulü olarak sayılmaz. Yeni testler gerçek WAV stream/Range, metadata/listelerin DB kapat/aç sonrası geri gelmesi, sahte/bozuk konteyner, disk hatası, chunk/header kotası, SQLite rollback, eşzamanlı upload, autoplay/repeat ve duplicate-ended davranışını sınar. GLB gerçekten parse edilir; bone quaternion'u iki farklı klipte değişir ve hash/source inventory doğrulanır.

E2E: gerçek WAV/MP3/OGG browser decoding; liste ekleme/sıralama/metadata/reload; ses/seek ve disk hatası görünürlüğü; decoded 108 BPM kaydından analiz sonucu (oynatıcıda createOscillator çağrısı yasaklanır); yönetici Govend seçiminin BPM tahminiyle değişmemesi; Zeybek registry geçişi; gerçek AudioContext, panel kapanması, otomatik Halay→Horon, yeni oyuncu ve 7 rig; Faz 1 mock/reconnect kontrolleri. Tarayıcı içi bağlantı ortamda `missing sandboxPolicy` hatası verdi; bağımsız gerçek Chromium/Playwright ile doğrulandı.

İlk clock testinde ölçü sınırındaki floating-point hatası bulundu; küçük sınır toleransı ve regresyon eklendi. İlk asset testinde birbirine çok yakın iki faz seçilmişti; farklı hareketleri ayıran çeyrek ölçü karşılaştırması kullanıldı. İlk E2E koşusu **5/6** oldu: test sırasında kaynak düzenlemesi Vite HMR reload'u oluşturdu, sahnenin ses izni sıfırlandı. Kaynaklar sabitlenip senaryo tekrarlandı ve geçti; retries eklenmedi. İlk TypeScript kontrolünde Playwright inputFiles içinde path/Buffer karışımı reddedildi; gerçek dosya Buffer'larıyla düzeltildi. Bu ilk başarısız koşular gizlenmedi.

## Görsel ve uzun süreli ölçüm kanıtı

Ön uzun koşu 11,4 dakika sürdü ve geçti. Sonrasında halka/kamera, el merkezi ve profil penceresi düzeltmeleri yapıldığı için **son build üzerinde uzun test tekrar çalıştırılır**; bu ön ölçüm final performansı olarak sunulmaz. Commit'lenen final JSON ve görüntüler aynı son koşudan alınacak.

Uzun senaryo: 1080×1920, altı NPC ile en az **600 gerçek saniye** dosya müziği, 10 saniyelik telemetri örnekleri; sonra 100 mock oyuncu + 6 NPC ile en az **60 gerçek saniye**. Time mocking kullanılmaz. Clock/media farkı ile worklet'ten algılanan onset/grid farkı ayrıdır. Test sinyali 120 BPM / 0,15 sn ilk onset'tir; gerçek folklor kaydı değildir. Çıktı browser/CPU/GPU/viewport/build asset manifestini, FPS/frame p95/heap/rig/draw/triangle ve hata listesini taşır.

**Final metrikler:** bekleniyor. 60 FPS sağlandı veya 5 saat çalıştı iddiası yoktur. Yazılım GPU'sunun düşük FPS'i işitsel-clock ölçümü iyi olsa da görüntünün akıcılığını sınırlar. Clock/onset farkı hoparlör/OBS çıkışındaki uçtan uca işitsel-görsel gecikme ölçümü değildir.

## Kabul kapısı ve açık konular

| İstenen kabul | Durum |
|---|---|
| Yönetici kendi dosyasını ekler; kalıcılık | Geçti: gerçek codec E2E + DB reopen/dosya karşılaştırması |
| Otomatik sonraki/tekrar | Geçti: gerçek ended → Node → WS → sonraki dosya; unit repeat/autoplay |
| Müziğe bağlı ayrı Halay/Horon figürleri | Teknik akış/GLB klip hareketi geçti; profesyonel folklor doğruluğu açık |
| Çalarken senkron ölçümü | Kısa E2E geçti; son build 10 dk kanıtı bekleniyor |
| Panel kapanınca oyun + ses | Gerçek iki sayfa close sonrası ilerleme/otomatik geçiş geçti |
| Mock TikTok korunması | Geçti; gerçek TikTok kurulmuş gibi gösterilmez |
| Yeni görselin ekran görüntüleri | Son build görsel incelemesi bekleniyor |
| Unit/integration/Playwright | Unit/integration 49, dev 11 ve production 11 geçti; Windows/Linux/Chromium CI 4/4 yeşil; final kanıt commit'i bekleniyor |
| Profesyonel karakter/kostüm/koreografi | **Kısmi:** özgün rig/keyframe ve tek kostümün altı rengi var. Artist üretimi çeşitli giysi kesimleri, profesyonel folk mocap ve folklor uzmanı kabulü yok |
| İzinli gerçek müzikte işitsel kabul | **Açık:** yayın izni belgeli gerçek Halay/Horon kaydı sağlanmadı. Lisansı belirsiz kayıt indirilmedi; test sinyali gerçek müzikmiş gibi sunulmadı |
| 100 oyuncu/60 FPS | 106 mock rig profili alınacak; hedef yayın donanımında 60 FPS kabulü açık |
| 20 dk otomatik döngü / 5 saat | 20 dk sınır mantığı unit testli; **20 dk gerçek tur ve 5 saat soak çalıştırılmadı** |

Başlıca değişiklikler: apps/broadcaster ve control-panel; packages/contracts/halay-game; gateway music-service/migration; asset/audio generator + GLB/fixture'lar; unit/e2e/long test; kullanım/mimari/lisans/risk belgeleri. Yeni doğrudan bağımlılık music-metadata 12.5.0 MIT; [lisans kaydı](licensing.md). SQLite deneysel API ve headless SwiftShader GPU stall uyarıları görüldü, gizlenmedi.

Sonraki küçük görev **Faz 2 içinde**: izin belgeli iki gerçek kayıtla işitsel grid/koreografi incelemesi, profesyonel kıyafet/hareket varlıkları ve hedef yayın PC'sinde 1080×1920 profil/akıcılık kabulü. Bu açık konular kapanmadan PR taslak kalır ve Faz 3 başlatılmaz.
