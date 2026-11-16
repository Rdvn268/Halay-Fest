# Deli Horon — yerel hareket denemesi, kabul edilmedi

16 Kasım 2026. `feat/deli-horon-local-prototype`, PR #7 üzerine. Kullanıcının belge istememe yönlendirmesiyle üretime devam edildi; tekrar izin sorulmadı. Herkese açık videonun hakları doğrulanmış sayılmadı. Kaynak görüntü/ses, ham tahmin verileri ve sesli inceleme kayıtları **Git tarafından yok sayılan `data/private-prototypes/deli-horon/`** altında kalır. Blender/GLB ve sessiz render kopyaları, kullanıcının GitHub inceleme teslimi kapsamında **`assets/animation-studies/deli-horon/`** altında taslak PR'a eklenir; ticari dağıtım varlığı veya otomatik oyun içeriği olarak sunulmaz. [İnceleme bildirimi](../assets/animation-studies/deli-horon/REVIEW_NOTICE.md) geometri ve hareket haklarını ayırır. Yeni karakter, panel, meydan veya başka dans üretilmedi.

## Çalışan somut çıktılar

PR #6'nın aynı anatomik karakteri kullanıldı; orijinal `.blend`/GLB değiştirilmedi. GitHub inceleme dosyaları:

- `assets/animation-studies/deli-horon/wedding-guest-01-study.blend`
- `assets/animation-studies/deli-horon/wedding-guest-01-study.glb`
- `assets/animation-studies/deli-horon/front-study.mp4`, `side-study.mp4` — **sessiz**, gerçek 3D render
- `assets/animation-studies/deli-horon/front-8s.png`, `side-8s.png` — gerçek tarayıcı ekran görüntüleri

Bu dosyalar uygulamanın `public/` veya build dizininde değildir. Aşağıdaki yollar repo köküne göredir ve **yalnız bu bilgisayarda** bulunur:

| Yerel dosya | Gerçek içerik |
|---|---|
| `data/private-prototypes/deli-horon/wedding-guest-01-deli-horon-study.blend` | Düzenlenebilir mevcut karakter, 52 kemikte video tahmininden keyframe action; 35 kayıp örnekte son poz tutulur |
| `data/private-prototypes/deli-horon/wedding-guest-01-deli-horon-study.glb` | 52 eklem, 9 mesh, 1 animasyon; tarayıcıda 19,97 sn klip. Orijinal karakterin yeni bir kopyasıdır |
| `data/private-prototypes/deli-horon/front-study-with-audio.mp4` | 1080×1920, önden yaklaşık 20 sn gerçek Three.js canvas kaydı, referans sesi; kabul edilmiş dans değildir |
| `data/private-prototypes/deli-horon/side-study-with-audio.mp4` | Aynı yerel çalışmanın yandan sesli kaydı |
| `data/private-prototypes/deli-horon/front-8s.png`, `side-8s.png` | Gerçek tarayıcı ekran görüntüleri; dosya kontrolleri ve inceleme durumu görünür |
| `data/private-prototypes/deli-horon/pose-estimates.json` | Zaman damgaları, 33 landmark/örnek ve güven değerleri; gerçek mocap değil |
| `data/private-prototypes/deli-horon/retarget-report.json` | Eksik örnekler, kaynak hash'leri, root düzeltmeleri ve tahmini ayak pozisyonları |
| `data/private-prototypes/deli-horon/front-playback.json`, `side-playback.json` | Ses/hareket saati örnekleri, renderer metrikleri ve sayfa hataları |

Ham kaynak bölüm `.git/deli-horon-reference/` altında kalır; Git'e eklenmez. Yeni motion/ses kütüphanesi normal oyuna otomatik bağlanmadı. Mevcut müzik yöneticisi, gateway, WS ve mock kodları değiştirilmedi.

## Ne çıkarıldı, ne başarısız oldu

Kaynak: `https://www.youtube.com/watch?v=lEE_s05sTkM`. HTML5 oynatıcıdan yerel inceleme için alınan bölümün kaynak zamanı **6,045044–26,045626 sn**. Bunlar figür sınırı değildir. Yerel CFR kopya 600 kare, çıkarım her iki karede bir: **300 örnek**, son kaynak örnek aralığı **19,966667 sn**. MediaPipe Heavy kullanıldı; üç yöntem gerçekten denendi:

| Yöntem | Bulunan / toplam | Bacak görünürlük güveni <0,7 |
|---|---:|---:|
| Tam kadraj, zamansal takip | 265 / 300 | 192 / 265 |
| Dansçı çevresine kırpılmış takip | 223 / 300 | 223 / 223 |
| Her karede yeniden algılama | 180 / 300 | 130 / 180 |

Kırpma ve bağımsız algılama sonucu iyileştirmedi. Tam kadraj çıktı **yalnız teşhis klibi** için kullanıldı. 35 örnekte gözlenen poz yok; en uzun kayıp 10 örnek, yaklaşık 0,67 sn. Bu aralıklar sinüs/yapay figürle doldurulmadı; son gözlenen poz tutuldu, dolayısıyla takılmalar beklenir. Hata ölçümü bir insan performansı uzmanı onayı değildir; güven değerleri doğruluk yüzdesi değildir.

Gövde/kol/bacak yönleri gerçek karelerin tahminlerinden rig'in bind eksenlerine aktarıldı. Üç örnekli simetrik filtre uygulandı. İlk yön öne normalize edildi. Root X ve yükseklik sabit kameranın görüntü düzleminden yaklaşık ölçekle çıkarıldı; **root derinliği çıkarılmadı**. Yüz/parmak hareketi yakalanmadı. İlk 3D kontrolde tahmin edilen parmak ucu derinliği ayakkabı tabanlarını ters çevirdi; bu hatalı ayak rotasyonları reddedilerek ayaklar gövdeye göre nötr bind yönünde bırakıldı. Bu, doğru ayak basışının elde edildiği anlamına gelmez.

Zemine giren ayak bileğini yükselten geometrik düzeltme var; **stance/foot locking, ağırlık aktarımı veya ground-truth temas ölçümü yok**. El tutuşu tek karakterde doğrulanamaz. Kendiliğinden loop/crossfade veya altılı gruba geçiş yapılmadı. İki gerçek Deli Horon figürü, doğru sağ/sol basış, doğal diz/omuz, sıçrama, kaymasız ayak, uzman doğruluğu ve kesintisiz döngü **açık kabul koşullarıdır**. Bu çalışmayı tamamlanmış gerçek Deli Horon diye sunmuyoruz.

## Ses ve render ölçümü

Referans bölümün gerçek sesi yerel WAV olarak çıkarıldı. Ses dosyası sessiz değil: çözülen PCM RMS **−19,35 dBFS**, 48 kHz. İki tarayıcı WebM kaydında da VP8 1080×1920 + Opus kanalının çözülebildiği ve RMS'nin yaklaşık −19,35/−19,38 dBFS olduğu doğrulandı; MP4 inceleme kopyaları H.264/AAC'ye çevrildi. Ses kayıtları Git'e alınmadı.

Viewer'ın `AnimationMixer` zamanı birikimli render dt yerine doğrudan `HTMLAudioElement.currentTime` ile örneklenir. Son kayıtta her açıdan 401 ölçüm var. Klip sürerken en yüksek örneklenen medya saati farkı iki açıda **10,667 ms**. Klip sonundaki 19,966667 sn clamp ve 100 ms durdurma kontrol aralığı da dahil edildiğinde maksimumlar **43,551 / 62,666 ms**. Blender kare başlangıcı 0 yapıldı; glTF'de ilk keyframe **0,000 sn**, son keyframe **19,966667 sn**; frame 1'in eklediği 33 ms ofset giderildi. Bu ölçüm frame/audio saatidir; **müzikal beat/figür veya ayak vuruşu senkronu kabulü değildir**. BPM/ölçü tahmin edilip doğru diye yazılmadı.

Yerel Radeon RX550/550 Series (sürücü 31.0.12029.10015), Chromium, tek karakter, 1080×1920, canvas 30 FPS kayıt hedefi. Son 300 render karesinden hesaplanan son pencere FPS **143,995 / 143,988**, p95 iki açıda **7,0 ms**; tüm 20 saniyenin global p95'i veya kayıt FPS'si değildir. Sahne 105.890 üçgen / 11 draw call. İki sayfada 0 `pageerror`. Sessiz MP4'ler ayrıca incelendi: **20,03 sn**, H.264 1080×1920 30 FPS, **0 ses kanalı**. Altı/100 kişi ve uzun süre performans kabulü yapılmadı; 60 FPS veya 5 saat garanti edilmez.

Kayıtlara “VIDEO ESTIMATE / DIAGNOSTIC ONLY” etiketi eklendi. Root hareketinde dikey kadrajdan çıkma ve bind-pose bounding sphere nedeniyle kaybolan mesh'ler düzeltildi: yalnız inceleme kamerası X/Z'de hips'i takip eder, tek karakter incelemesinde eski sınırlara göre frustum culling kapatılır. Root animasyonu dosyadan silinmez. Ön/yan, başlangıçtaki model yönüne göre sabit kamera adlarıdır; dansçı döndükçe yüzün her karede kameraya bakacağı iddia edilmez. Gerçek kayıt karelerinde ayakların havada kalması ve giysinin bacak hareketinde açılması görülüyor; bu kusurlar kabul edilmedi.

## Tekrar çalıştırma ve kabul kapısı

Normal uygulama: `npm ci`, `npm run dev`, `http://127.0.0.1:5173/character.html`. **Yerel hareket incelemesi** bölümünde yukarıdaki GLB'yi ve `reference-audio.wav` dosyasını seçin; Oynat/Duraklat, zaman sürgüsü ve Önden/Yandan çalışır. Dosyalar sunucuya yüklenmez ve kalıcı kütüphaneye eklenmez. Varsayılan dağıtılan karakter 0 klipli A-pozunu korur; yerel yükleme açıkça etiketlenir.

İsteğe bağlı izole Python 3.11 araçları: `mediapipe==0.10.21`, `opencv-contrib-python==4.11.0.86`, `numpy==1.26.4`, `imageio-ffmpeg==0.6.0`. Model ve lisanslar `risks-and-dependencies.md` içinde. Normal npm kurulumuna bunlar eklenmedi.

```powershell
# Yerel, sağlanan timestamp'li CFR video; kaynak edinme/izin otomasyonu yok.
python scripts/extract-reference-pose.py --video SOURCE.mp4 --model pose_landmarker_heavy.task --out data/private-prototypes/deli-horon --source-start 6.045044

# Varsayılan kapı bu gerçek düşük kaliteli girdiyi reddeder (beklenen nonzero exit).
blender -b --python-exit-code 1 --python scripts/retarget-reference-study.py -- --poses data/private-prototypes/deli-horon/pose-estimates.json --out data/private-prototypes/deli-horon

# Yalnız hata inceleme dosyası üretmek için açık seçenek gerekir.
blender -b --python-exit-code 1 --python scripts/retarget-reference-study.py -- --poses data/private-prototypes/deli-horon/pose-estimates.json --out data/private-prototypes/deli-horon --diagnostic-only

# Node 24'ün yerleşik TS desteği; tsx evaluate callback'lerine __name ekleyebiliyor.
node scripts/record-local-motion.ts data/private-prototypes/deli-horon/wedding-guest-01-deli-horon-study.glb data/private-prototypes/deli-horon/reference-audio.wav data/private-prototypes/deli-horon
python -m unittest discover -s test -p reference_pose_validation_test.py -v
```

`--diagnostic-only` olmadan eksik veya düşük güvenli girdiler reddedilir. Eşik geçse bile kod sanatsal/temas kabulü vermez. Sonraki gerekli somut girdi: **tek dansçının iki ayağının kesintisiz göründüğü 20–30 sn kayıt** (tercihen eşzamanlı ön/yan ve A/T kalibrasyonu) veya gerçek Deli Horon BVH/FBX/mocap. Mevcut grup görüntüsüyle profesyonel 3D hareket kalitesi elde edilemedi. Yeniden izin sorusu yöneltilmiyor.

## Otomatik kontroller

16 Kasım 2026, Windows / Node 24.13.1:

- `npm ci`: başarılı, 173 paket, 0 bildirilen açık.
- `npm run verify`: lint, typecheck, **70/70 unit/entegrasyon** ve tüm build'ler geçti. Son kamera yakın plan/idempotent oynat düzeltmesinden sonra da çalıştırıldı.
- Python `unittest`: **4/4** geçti; eksik/düşük güvenli, NaN, bozuk landmark ve zaman damgalı girdileri reddeder. Standart npm/CI'nin ayrı, isteğe bağlı üretim aracı testidir.
- Tam `npm run test:e2e`: **21 geçti / 3 atlandı**, geliştirme; `TEST_PRODUCTION=1` ile **21 geçti / 3 atlandı**, üretim. Atlananlar opt-in uzun/GPU testleri; bu görevde altılı/106 kişi veya uzun süre testi çalıştırılmadı.
- Son kamera yakın plan/idempotent oynat düzeltmesinden sonra `--project=production-character`: geliştirme **3/3**, üretim **3/3** tekrar geçti. Yerel klip yükleme, 3 m root hareketinde mesh kaybolmaması, seek, pause, ses saatinin zorla ileri alınmasını takip etme, hatalı dosyanın önceki klibi bozmadan reddi sınanır.
- Yerel çalışma GLB'si: 52 eklem, 9 skinned mesh, 1 klip, 156 kanal; animasyon değerleri sonlu, zamanlar artan ve sıfırdan başlıyor. Orijinal Blender/GLB hash kontrolleri geçti.
- Varsayılan retarget kapısı bu gerçek veriyi **beklendiği gibi reddetti**. Yalnız `--diagnostic-only` çıktısı üretildi; bunu dans kabulü saymıyoruz.

İlk tam geliştirme koşusunda mevcut müzik yükleme testinin telemetri beklemesi zaman aşımına uğradı; tek başına ve sonraki tam dev/üretim koşularında geçti, müzik kodu değiştirilmedi. Yeni testin ilk canlı 150 ms frame/ses beklentisi yazılım render'ında başarısızdı; test, ses saatini 1,25 sn'ye atlatıp gerçekten izlediğini ve pause sonrası aynı saatte durduğunu doğrulayacak şekilde düzeltildi. Pause örneklemesi ses durduktan sonra alınır. Bu önceki başarısızlıklar gizlenmedi.

Mevcut SQLite ExperimentalWarning, NO_COLOR ve test fixture'ının accessor min/max uyarıları sürüyor. Blender aktarıcısı bazı mesh'lerde >4 vertex weight bulunduğunu ve en yüksek 4 ağırlığı normalize ettiğini, çoklu image node'da ilk sampler'ı kullandığını bildirdi; temel karakterin üretim yöntemi korundu. Geçen testler bu görsel kusurların onayı değildir.

Python testlerinin sentetik koordinatları ve Playwright'ın sentetik/sessiz klibi yalnız hata reddi, yükleyici ve saat regresyonudur; Deli Horon kanıtı değildir. Faz 2 ve sanatsal kabul açık; PR taslak, Faz 3'e geçilmez. Dosya hash'leri, yerel/sessiz inceleme ayrımı ve gerçek ölçümler [teknik sonuç kaydındadır](evidence/deli-horon-local/technical-results.json).
