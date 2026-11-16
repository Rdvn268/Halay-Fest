# Deli Horon — referans incelemesi, üretim kabulü açık

**Güncelleme, 16 Kasım:** Kullanıcı ayrı izin belgesi isteme koşulunu kaldırdı. Yeniden izin sorulmadan yerel video-tabanlı hareket denemesi yapıldı; aşağıdaki “yanıt bekleniyor / klip üretilmedi” ifadeleri önceki incelemeyi anlatır. Güncel somut sonuçlar [yerel prototip raporundadır](DELI_HORON_LOCAL_PROTOTYPE.md). Ticari haklar doğrulandı diye işaretlenmedi.

16 Kasım 2026. Öncelik kullanıcı isteğiyle Halay'dan Deli Horon'a değişti. Başlangıç PR #6 / `db5ce92d22fcf341e795706c6caae34c4da858e3`. Bu kayıt bir animasyon teslimi değildir; yeni karakter, panel veya meydan üretilmedi.

## Gerçekten erişilen kaynak

- Video: https://www.youtube.com/watch?v=lEE_s05sTkM
- Oynatıcı başlığı: **Hadi Dans Edelim - Deli Horon**. Görünen yayıncı **Engin Işık**, kanal `/@enginisiksanat`.
- Açılan açıklama oyunu Deli Horon, yöreyi Artvin olarak tanımlar. Görünen yayın tarihi 31 Mayıs 2026. Bu bilgiler yayıncının beyanıdır; bağımsız yöresel uzman kabulü değildir.
- HTML5 oynatıcı süresi **64,781 saniye**. İlk kare kapak görüntüsüydü ve hareket kanıtı sayılmadı. Oynat düğmesine basılıp video zamanı ilerledikten sonra duraklatma/seek ile gerçek görüntüler incelendi.
- Web aracı önce hız kısıtlaması verdi; uygulama içi Browser `missing sandboxPolicy` hatası nedeniyle açılamadı. Ayrı Chromium/Playwright oturumu kullanıldı. Video çözünürlüğü ilk örneklerde 640×360, sonra 1280×720 olarak bildirildi.

## Görüntü bulguları ve sınırları

Aşağıdaki zamanlar figür başlangıç/bitişi **değil**, oynatıcının duraklatılmış gerçek kare konumlarıdır. Seek sırasında gösterilen `+5/+10` yazıları dans sayımı değildir. İnceleme görüntüleri yalnız yerel `.git/` altında tutuldu; Git'e, web build'ine veya prototip videosuna eklenmedi.

| Örnek zamanı | Görsel gözlem |
|---|---|
| 6,089 sn | İçeri bakan, elleri bağlı halka; bağlı eller omuzların altında. Ön oyuncular diğer bedenlerin bir bölümünü örtüyor. |
| 11,089 sn | Bağlı eller baş üstüne çıkmış; gövde duruşu daha dik. |
| 16,089 sn | Birden fazla oyuncuda ayakların yerden kesildiği ve bacakların büküldüğü sekme pozu; hafif gövde eğilmesi. Tek kareden iniş ayağı veya yük dağılımı çıkarılamaz. |
| 31,089 sn | Kollar yüksek; bazı oyuncularda ayak ileri uzatılmış. Bedenler ve ayaklar kısmen örtüşüyor. |
| 51,089 sn | El bağlantısı sürüyor; serbest bacakların büküldüğü hareket pozu. |

11,089 / 16,089 / 31,089 / 51,089 saniyedeki görseller ayrıca tek tek açılarak incelendi. Toplam on duraklatılmış örnek 6,089–51,089 saniye aralığında alındı. Sürekli kare kare analiz veya bütün performansın biyomekanik çözümü yapılmış sayılmaz.

Gözlenen yapı kapalı, merkeze dönük halkadır; önceki açık Halay zinciriyle aynı yerleşim kullanılmamalı. Kol yüksekliği değişiyor, kısa sekmeler ve bacak kaldırmalar var. Halka içinde konum değişimi görülüyor; örtüşme nedeniyle bütün oyuncuların kimliği ve kesin dönüş yönü henüz işaretlenmedi.

**Çıkarılmayanlar:** kesin figür sınırları ve tekrar uzunluğu, sağ/sol destek ayağı çizelgesi, stance/swing aralıkları, sıçrama yüksekliği, root trajectory, omuz rotasyon açıları, ağırlık merkezi veya zemin kuvveti. Seyrek tek-kamera görüntüsü bunları sayısal olarak doğrulamıyor. Ses/onset analizi ve gerçek sesli beat eşlemesi yapılmadı; BPM/ölçü uydurulmadı. Mevcut genel Horon 7/8 varsayımı bu videoya otomatik uygulanmadı.

## İzin durumu ve gereken somut girdi

Açılan video açıklamasında ticari kullanım, animasyon türetme, kaynak Blender/GLB dağıtımı veya sesin prototip videosunda yeniden paylaşımı için açık izin görülmedi. Bu, hak sahibinin izin vermeyeceği anlamına gelmez; izin bu oturumda **doğrulanamadı**. Görüntülenebilmesi veya kullanıcının bağlantı paylaşması izin belgesi sayılmadı. Hakları doğrulayan belge/bağlantı/yerel dosya yolu kullanıcıdan soruldu; yanıt bekleniyor. Kimseye otomatik mesaj gönderilmedi.

Üretim için gerekli girdiler:

1. **Bu belirli kayda ilişkin izin:** kayıt/performans/müzik için yetkili hak sahibini ve kapsamı tanımlayan yazılı belge. Video referansından 3D hareket çıkarımı veya elle animasyon, 52 kemikli rig'e retarget/düzeltme, ticari oyun/yayın kullanımı ve türev `.blend`/GLB ile sesli kanıt videosunun GitHub'da paylaşımı kapsanmalı. Videonun kendisi paylaşılmayacaksa bu ayrım belgede açık olmalı; müzik izni ayrıca açıklanmalı.
2. **Yerel inceleme kaydı veya izinli mocap:** bu videonun hukuka uygun sağlanan MP4/WebM kopyası ve varsa eşzamanlı yan kamera; alternatif olarak gerçek Deli Horon performansına ait BVH/FBX/GLB, kaynak rig, FPS, ölçek ve aynı hak kanıtları. Video halinde en az bir tam figür döngüsü, kesintisiz 20–30 sn ve her iki ayağın görünmesi tercih edilir. Kalibrasyon A/T-pozu ve bilinen ölçek derinlik/retarget belirsizliğini azaltır. Tek kameradan çıkmayan derinlik/temas elle uydurulmaz.
3. **İzinli müzik kaydı:** mümkünse aynı performansın sesi; kayıt/master ve video/oyun/yayın kullanım kapsamı. Gerçek hareket kabulü yerine kalibrasyon sinyali veya sentez ritim konmayacak.

Yerel dosya gelirse önce süre/FPS/çözünürlük ve SHA-256 kaydedilecek; mevcut Blender'daki 52 kemik eşlemesi ve kaynak performer yönü korunarak incelenecek. Yerel kopya tek başına izin sorununu çözmez. Bu, yeni bir pano veya genel yol haritası değildir; bu referans için eksik teslim girdisinin kaydıdır.

## Dosya ve test durumu

PR #6'daki `assets/characters/wedding-guest-01/wedding-guest-01.blend` ve `apps/broadcaster/public/characters/production/wedding-guest-01.glb` SHA-256'ları `build-info.json` ile eşleşti. GLB **0 animasyon klibi** içeriyor; yeni Deli Horon klibi, root motion, retarget, contact correction veya sesli 15–20 saniye prototip **üretilmedi**. Önden/yandan animasyon kanıtı ve ayak/senkron kabul testleri henüz yok. Eski teknik çalışmalar Deli Horon diye yeniden adlandırılmadı.

Bu dal yalnız bu inceleme kaydını içerir. Müzik yöneticisi, gateway, WebSocket, mock, karakter ve oyun kodu değişmedi. Regresyon kontrol sonuçları tamamlandığında aşağıya kaydedilir; geçen altyapı testleri Deli Horon hareket doğrulaması sayılmaz. Altı karakterlik koreografiye veya Faz 3'e geçilmez. PR taslak kalır.

Kontroller: karakter kaynak/GLB hash doğrulaması geçti. `npm ci` başarılı (173 paket, 0 bildirilen açık); `npm run verify` ile lint, typecheck, **70/70 unit/entegrasyon testi** ve tüm build'ler geçti. Bunlar korunmuş altyapının kontrolleridir, üretilmemiş Deli Horon animasyonunun kabulü değildir. Bu yalnız-belge değişikliği için yerel Playwright koşusu tekrarlanmadı. SQLite ExperimentalWarning ve mevcut test fixture'ının accessor min/max uyarısı test çıktısında kaldı; hatalar gizlenmedi.
