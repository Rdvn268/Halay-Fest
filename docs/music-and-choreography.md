# Faz 2: müzik ve koreografi

## Yerel kullanım

1. Node 24.13.1+ / npm 11 ile **deponun kökünde**, `package.json` ve `package-lock.json` yanında `npm ci` çalıştırın. Üst klasör veya yalnızca ROADMAP içeren main dalı uygulama kurulumu değildir.
2. `npm run dev` ile iki ayrı pencereyi açın: sahne 5173, panel 5174. Derlenmiş sürüm `npm run build` / `npm start`: 4174 ve 4175.
3. Panelin Müzik Yöneticisi'nden yayın hakkınız olan MP3, WAV veya OGG dosyalarını ekleyin. Kütüphane ve varsayılan liste diske kaydedilir. Birden çok liste oluşturabilir; parçaları ekleyebilir, çıkarabilir, yukarı/aşağı taşıyabilir veya dosyayı silebilirsiniz.
4. Parçayı seçin, dans türü / BPM / ilk vuruş / ölçü / kalibrasyonu kaydedin. BPM **dörtlük nota** cinsindedir: 120 BPM / 7/8 için bir sekizlik 0,25 sn, bir ölçü 1,75 sn. Halay, Horon, Govend ve Zeybek seçimi metadata'dır; algoritma kültürel dans türü tahmin etmez.
5. Sahnedeki **Ses motorunu aç** düğmesine bir kez basın. Tarayıcının ses iznini panel veremez. Panelde Oynat, Müziği duraklat, önceki/sonraki, konum, ses seviyesi, otomatik sonraki ve liste tekrarı kullanılabilir. Paneldeki ses düğmesi yalnızca sahneye komut gönderir.
6. Panel kapatılabilir. **Sahne, yerel Node servisi ve bilgisayar açık kalmalıdır.** Sahne sekmesini kapatma, bilgisayar uyku modu veya gateway'i kapatma kesintisiz ses kapsamında değildir. Tasarım tek aktif yayın sahnesi içindir; iki sesli sahne açmayın.

`?broadcast=1` sahneyi 9:16 yayın görünümünde açar: örneğin `http://127.0.0.1:5173/?broadcast=1`. 1080×1920 viewport'ta çizim yüzeyi aynı boyuttadır (DPR 1). Sesi bir kez açtıktan sonra alt kontrol odağı/fare dışında gizlenir. UI güvenli alanları ayrılır; TikTok LIVE Studio'da gerçek kaynak yerleşimi henüz pilotta doğrulanmadı.

## Depolama ve hata davranışı

- SQLite: `DATABASE_PATH`, varsayılan `data/halay-fest.sqlite`. Ses dosyaları: **aynı tam yol + `.music`**, varsayılan `data/halay-fest.sqlite.music/`. Test DB'si ve müzik klasörü ayrıdır. `.env.example` açıklayıcıdır; PowerShell ortam değişkeni kullanın.
- Veritabanı ve ona ait müzik klasörü **birlikte** yedeklenir. DB metadata, playlistler ve oynatma seçeneklerini saklar; dosyalar UUID adlarıyla tutulur. Yeniden açılışta listeler/metadata korunur; ses kendiliğinden başlamaz. Oynat düğmesi ve yeni sahnede ses izni gerekir. Oyuncu/tur restore Faz 3 kapsamındadır.
- Tek dosya **64 MiB**, toplam gerçek disk dosyaları **1 GiB**, en fazla **200 parça**, **20 liste**, parça başına **1 saat**. Dosya uzantısı, MIME, sihirli baytlar, konteyner, örnekleme hızı ve süre kontrol edilir. Codec çözülemiyorsa sahne açık hata verir; yalnızca uzantı kontrolüne güvenilmez.
- Yükleme bounded/backpressure stream ile `.part` dosyasına yazılır; limit Content-Length'e ek olarak her chunk'ta kontrol edilir. HTTP Range ile diskten 64 KiB bloklar okunur. Browser MediaElement codec tamponunu yönetir; bütün kütüphane PCM'e açılmaz.
- Mutation işlemleri seri tutulur. İkinci eşzamanlı işlem 409 ile reddedilir; tekrar deneyin. Dosya/DB kaydı başarısızsa başarı mesajı verilmez. DB commit hatasında yükleme temizlenir, silinen dosya geri taşınır. Süreç tam bu iki kalıcı ortam arasındayken kapanırsa sahipsiz `.part` / `.delete` dosyası kalabilir: otomatik veri silinmez ve dosya kotaya dahil edilir. Servis kapalıyken yedeğe alıp metadata ile karşılaştırarak temizleyin.
- `POST /api/music/transport` → oynatma; `GET /api/music` → kütüphane; `GET /api/music/audio/:id` → Range/HEAD; `POST /api/music/tracks/:id` → doğrulanmış metadata; `POST /api/music/library` → listeler; `POST /api/music/delete` → dosya/referanslar. `ended` komutu transport sequence taşır; yinelenen/gecikmiş bitiş tek parçayı iki kez atlatamaz.

## Ritim ve animasyon

`HTMLAudioElement` dosyayı stream eder → `MediaElementAudioSourceNode` → passthrough `AudioWorkletNode` → Gain → çıkış. Sesi **yayın sahnesi** sahiplenir. Eski v0.2 sentez motoru kaynak ve regresyon testlerinde korunur; yeni dosya oynatıcısının yerine sentez çalıştırılmaz.

BeatClock, AudioContext.currentTime ile medya konumunu eşler. Pause/seek/buffering durumlarında anchor yenilenir. Renderer FPS'i beat biriktirmez; her kare aynı mutlak beat/bar fazını örnekler. Saat farkı 250 ms aralıklarla gözlenir, büyük kesintide yeniden anchor alınır. Metadata değişikliği çalarken bir sonraki mevcut ölçü sınırında uygulanır. Figür her dört tam ölçüde değişir; şarkı/figür değişimi kemik pozlarından 350 ms boyunca yumuşatılır. Yeni oyuncu mevcut global fazdan başlar.

Worklet yaklaşık 10 ms RMS blokları gönderir. Son 30 saniye / en çok 300 onset üzerinden tempo, faz, düzenlilik, güven ve vurgu/ölçü adayları hesaplanır. Güvenli tahmin varsa yalnızca **henüz ölçülmemiş varsayılan BPM** otomatik güncellenir; manuel değer ezilmez. İlk vuruş tahmini dörtlük periyodu içindeki fazdır; intro/downbeat/ölçü başlangıcı için insan doğrulaması gerekir. Değişken tempo, zayıf transient ve senkopta analiz yanılabilir. Ölçü adayları kesin ölçü tanısı değildir. Kısa veya yetersiz kayıtta sonuç üretilmez; manuel ayar kullanılmalıdır.

Kalibrasyon (+ms) grid'i geciktirir. Teşhis ekranı medya-clock farkı ve algılanan onset-grid farkını ayrı gösterir. Bunlar hoparlör, ses kartı veya OBS capture gecikmesinin uçtan uca akustik ölçümü değildir. İşitsel doğrulama ve yayın yazılımında loopback kaydı ayrıca gerekir.

GLB: tek birleşik vertex-color skinned mesh, 17 kemik, 7.616 üçgen, 12 özgün klip. Halay ve Horon farklı kalça/diz/gövde figürleri kullanır. Govend/Zeybek başlangıç çalışmaları aynı registry'yi genişletir; bunlar doğrulanmış yöresel mocap setleri değildir. Altı renk çeşidi aynı kostüm kesimini kullanır. Kapalı iç halka ve kapasite doldukça dış halkalar/açık zincirler, iki kemikli el IK, ekran koordinatlarında çakışma reddi ve en çok 24 görünür etiket vardır. Zeybek açık kol düzeninde el IK kullanmaz.

Geometri/klipler paylaşımlıdır; skeleton/mixer her karaktere aittir. Kalabalıkta yalnız iç halka karakter gölgesi üretir, DPR üst sınırı 1 olur. Frame history 600 gözlemle sınırlıdır ve karakter sayısı değişince temizlenir. Bellek/clock/onset geçmişleri sınırlıdır; bu, beş saat leak testi yerine geçmez.

## Tekrar üretilebilir kontroller

`npm run assets:character` özgün model/skin/klipler ve hash manifestini yeniden üretir. Blender veya ücretli asset servisi gerektirmez. MP3/OGG fixture'larını yeniden kodlamak isteğe bağlıdır: `scripts/create-test-audio.py` (numpy + soundfile); bu Python paketleri app/CI bağımlılığı değildir. Test kayıtları özgün kalibrasyon sinyalidir, gerçek halay/horon icrası olarak sunulmaz.

```powershell
npm run verify
npx playwright install chromium
npm run test:e2e
$env:TEST_PRODUCTION='1'
npm run test:e2e
# Gerçek süreli uzun test; en az 12 dakika bekler, zamanı hızlandırmaz:
$env:RUN_LONG_SYNC='1'
npx playwright test --project=phase-2-long
```

Uzun test JSON'u ortamı, 10 dk ses ölçümlerini, 106 mock karakter / kare / heap örneklerini ve gerçek 1080×1920 görüntülerini kaydeder. Kontrol paneli kapanma, gerçek codec decoding ve mock gerilemesi kısa E2E testlerinde ayrıca sınanır. 60 FPS, gerçek izleyici kapasitesi, 20 dk duvar süresi, 5 saat dayanıklılık ve profesyonel folklor doğruluğu yalnız bu testlerden çıkarılmaz.

Birincil teknik referanslar: [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader), [AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer), [MediaElementAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode), [AudioContext.currentTime](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime), [music-metadata](https://github.com/Borewit/music-metadata). Paket lisansları kurulu sürümlerden ayrıca kaydedilir.
