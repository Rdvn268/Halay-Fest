# Faz 2 — görsel ve koreografi revizyonu

**14–15 Kasım 2026 · Kabul açık.** Dal: `feat/phase-2-visual-choreography-review`, başlangıç `e605a9a`. Önceki Faz 2 görseli kullanıcı tarafından reddedildi. Bu revizyon profesyonel görsel/koreografi kabulü değildir; Horon, Govend, Zeybek geliştirmesine veya Faz 3'e geçilmedi.

## Denetim: eski sistem neden yeterli değil?

| İncelenen kaynak | Bulgu ve sonucu |
|---|---|
| `scripts/create-character.ts` | Birleştirilmiş basit geometriler ve elle atanmış skin ağırlıkları; aynı yüz/gövde/kostümün renkleri. Anatomik karakter çeşitliliği veya yöresel giysi paketi değildir. |
| Eski `festival-dancer.glb` | Gerçek skin ve 17 kemik vardır, fakat rig sayısı ve 12 klip varlığı sanatsal kalite kanıtlamaz. GLB formatı tek başına üretim kalitesi değildir. |
| Mevcut dans klipleri | Generator sinüs tabanlı eklem pozları üretir. ThreeStep/HeelTap/CrossStep adları insan performansı, doğru ağırlık aktarımı veya yöresel figür doğrulaması sağlamaz. |
| `rigged-dancers.ts` | Tek mesh/17 kemik/12 klip şartı; renk için geometri kopyaları; kol segmentleri `.32/.30` metreye sabit. Başka humanoid'e taşınabilir değil. Kapalı ve içe bakan halka, verilen açık zincir referansını karşılamıyor. |
| Ayak/kol davranışı | Eski kliplerde zemin temas işareti ve foot-lock yok; ayaklar sabit karakter köküne göre salınır. Grup yan ilerlemesi yoktur. Sabit kol IK'si, el hedefini zorlasa da gerçek parmak kavramasını kanıtlamaz. |
| `environment.ts` ve eski tarayıcı görüntüsü | Geniş boş zemin, basit ev/ağaç siluetleri ve küçük görünen karakterler; profesyonel düğün meydanı kabulü yok. Müzisyen animasyonu yoktur. |
| `beat-clock.ts` | AudioContext/media anchor, kalibrasyon ve ölçü sınırı desteği korunmaya değer. Saatlerin yakın olması, ayakların doğru müzik vuruşunda doğru yöresel adımı yaptığı anlamına gelmez. |

Önceki [gerçek sahne görüntüsü](evidence/phase-2/hardware-preview-6.png) ve kaynaklar incelendi. Eski generator/GLB/rig renderer, yeni üretim hedefi olmaktan çıkarıldı; yalnızca etiketli **eski görsel prototip/regresyon referansı** olarak korunuyor. Yeni `/review.html` bu generator'u veya eski dans kliplerini kullanmaz. ROADMAP, legacy ve Faz 0/1 raporları değişmedi.

## İnsan performansı referansı

Kullanıcının verdiği [Devrim Çalış'ın 15 saniyelik Shorts bağlantısı](https://www.youtube.com/shorts/EQDNYvKI43Q) tarayıcıda oynatılarak incelendi. Önden görülen açık zincir, birlikte yan ilerleme, çapraz ayak geçişleri ve alçak el tutuşu; mevcut halka ile açık bir görsel fark gösteriyor. Tek kamera, örtüşen ayaklar ve kısa kesit nedeniyle tüm ağırlık değişimleri/ayak temasları güvenilir biçimde çıkarılmadı; otomatik 3D pose/mocap çıkarımı veya uzman değerlendirmesi yapılmadı.

Video ve sesi projeye indirilmedi/gömülmedi/yeniden dağıtılmadı. İnceleme için alınan özel tarayıcı kareleri Git'e konmadı. Bağlantı bir mocap dosyası veya yeniden dağıtım lisansı değildir. Bu oturumda hakları doğrulanmış gerçek Halay mocap/Blender performans klibi elde edilemedi. İnternette böyle bir varlık hiç yoktur iddiasında bulunulmuyor.

## Çalışan yeni mimari

- `humanoid/rig.ts`: ad eşlemesiyle humanoid bağlama, çoklu skinned mesh, gerçek segment uzunluklarını kullanan iki kemikli IK, bağımsız clone kemikleri ve eşdeğer skeleton verisini instance içinde paylaşma. Eski 17 kemik/tek mesh koşulu kullanılmaz.
- `humanoid/assets.ts`: iki ayrı lisanslı anatomik insan gövdesi/yüzü, kısa/uzun saç ve farklı kesimli iki genel kıyafet. Ortak geometri, doku, materyal ve klipler instance'lar arasında paylaşılır. Baş maskesi, aynı iskelete bağlanan kıyafetlerin altındaki gövde taşmasını azaltır.
- `humanoid/retarget.ts`: kaynak/hedef bind pozları ve dünya eksenleri üzerinden, açık joint eşlemesiyle bir kez örneklenip paylaşılan retarget klibi. Kaynak ve hedef pozları işlem sonunda geri yüklenir. Doğrudan üst/alt segment/son eklem hiyerarşisi beklenir; bütün rig biçimleri için otomatik çözüm iddiası yoktur.
- `humanoid/motion-manifest.ts`: animasyon SHA-256, kaynak/yazar/izin beyanı, beat sayısı, root trajectory ve açık ayak temas aralıkları. **İzin beyanı doğrulanmış lisans sayılmaz.** Halay dışı yükleme reddedilir; diğer kütüphaneler kilitlidir. İnceleme sekansı iki kliple sınırlıdır.
- `humanoid/sequence.ts`: figür uzunluğunu tam ölçülere yuvarlama, ortak beat fazı ve sekanslar arasında biriken root travel. Şarkı/seek/figür değişiminde kısa poz blend'i ve temas ankrajı yeniden başlatma. Yeni instance ortak beat'e katılır; müzik saati yeniden başlatılmaz.
- `humanoid/contact.ts`: açık stance/swing işaretleriyle dünya koordinatında ayak bileği kilidi; erişilemeyen hedef hatasını ölçme. Grup yan hareketi ortak root trajectory'den gelir. Komşu avuç işaretçileri için IK, zincir uçlarında serbest kol pozu ve sınırlı gevşek parmak pozu vardır.
- `humanoid/courtyard.ts`: yeni inceleme meydanı; özgün taş rengi/bump girdileri, roughness, ahşap/sıva/kemerli pencere/çatı detayları, tabela, asılı ışıklar ve sınırlı ışık bütçesi. Bunlar fotoğrametri taraması veya doğrulanmış yöresel mimari değildir. Davul dekoru vardır; müzisyen performansı yoktur.
- `review.ts`: önden/yandan/otomatik kamera, gerçek ölçüm HUD'u, 9:16 kayıt kadrajı, yerel klip/manifest yükleme ve 16 saniyelik **sesli VP8/Opus WebM** kaydı. Video, gerçek 1080×1920 WebGL karelerinin canlı kabul/figür/vuruş yazılarıyla kayıt canvas'ında birleştirilmesidir; sonradan düzenlenmiş sahte görüntü değildir. Kayıt, mevcut gain çıkışına geçici bir ses dalı ekler; çıkış ve beat-clock sürer. Dal ve stream track'leri kapanışta temizlenir. Kayıt en çok 24 MiB; klip 32 MiB, manifest 128 KiB.

Yeni sahne aynı Node API, WebSocket, SQLite müzik kütüphanesi ve `FileMusicPlayer` ile çalışır; panelden müzik, gerçek dosya decoding, mock oyuncu/hediye aktarımı korunur. Eski çalışan oyun ve panel ayrıca regresyon testindedir. Eski sahneye dönüş bağlantısı vardır. Aynı anda yalnızca bir ses sahnesi açılmalıdır.

### Mevcut iki hareket tam olarak nedir?

`studies.ts` içindeki **yan ağırlık aktarımı** ve **çapraz temas**, açık ayak hedeflerinden gerçek iskelet kliplerine bir kez bake edilen özgün **mühendislik çalışmalarıdır**. Sinüs salınımı değildir; ancak insan performansı, mocap veya onaylı iki gerçek Halay figürü de değildir. Bu fark sahne üstünde, videoda ve raporda belirtilir. Böylece import/retarget/temas/senkron mekanizması sınanabilir; eksik gerçek koreografi gizlenmez.

## Lisans ve varlık kaydı

Yayıncının [Universal Base Characters](https://quaternius.itch.io/universal-base-characters) ve [Modular Character Outfits — Fantasy](https://quaternius.itch.io/modular-character-outfits-fantasy) sayfaları ile indirilen **ücretsiz Standard ZIP'lerinin kendi lisans dosyaları** kontrol edildi. Her iki pakette CC0 1.0 beyanı var. [CC0 birincil açıklaması](https://creativecommons.org/publicdomain/zero/1.0/) ticari kopyalama/değiştirme/dağıtımı kapsar. Ücretli Source sürümü veya hesap gerektiren içerik alınmadı.

| Kaynak | Arşiv SHA-256 | Kullanılan içerik |
|---|---|---|
| Quaternius Base Characters Standard | `fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40` | İki gövde/yüz, iki saç |
| Quaternius Modular Outfits Standard | `c3468b18871cc8c8f05ab14df7712baf22cb9f389cbd870babf130e595187f70` | Male/Female Peasant kıyafetleri |

[Model manifesti](../apps/broadcaster/public/characters/humanoid/manifest.json), [kıyafet manifesti](../apps/broadcaster/public/characters/humanoid/outfits-manifest.json) ve `assets/licenses/quaternius-*-CC0.txt` kaynak girdilerini, dönüştürülmüş dosya hash'lerini ve değişiklikleri kaydeder. Eksik iki duplicate normal-map URI'si arşivde gerçekten bulunan aynı normal haritasına bağlandı. Görüntüler maksimum 1024 px'e indirildi; geometry/skin korunur. Genel kıyafetler **Anadolu yöresel kostümü değildir**. İki insan tipi vardır; altı farklı yüz veya kapsamlı kostüm kataloğu yoktur.

`python scripts/import-quaternius.py base.zip outfits.zip`, doğrulanmış arşivleri Windows'ta standard-library Python ve yerleşik System.Drawing ile tekrar işler. Çalışan uygulama/CI, Python veya PowerShell görüntü aracına ihtiyaç duymaz; hazır GLB'ler paketlenir. Yeni npm bağımlılığı eklenmedi. FBX/GLTFLoader, SkeletonUtils ve MediaRecorder mevcut Three.js/tarayıcı altyapısıdır.

## Doğrulama durumu

| Kontrol | Gerçek sonuç |
|---|---|
| `npm ci` | 173 paket kuruldu, 181 audit, 0 bildirim. İlk deneme açık Vite'ın kilitlediği rolldown DLL'i nedeniyle EPERM verdi; yalnızca bu projenin sunucuları kapatılıp tekrarlandı ve geçti. Kullanıcı müzikleri silinmedi. |
| `npm run verify` | Lint, strict typecheck, **61/61 unit/entegrasyon** ve tüm build'ler geçti. 52 önceki + 9 humanoid/temas/retarget/sekans/izin testi. |
| Yeni iki tarayıcı testi, ilk koşu | 2/2 geçti; ilk koşu sesli recorder eklenmeden önceydi. |
| Tam dev/production ve sesli kayıt | Dev **16/16 (3,3 dk)**, production **16/16 (3,4 dk)** geçti. Üç opt-in uzun/GPU testi bu kısa koşularda atlandı; retries=0. İki yeni inceleme testi mevcut 14 regresyona eklendi; 16 sn sesli WebM kaydı da oluşturuldu. |
| Gerçek GPU kısa profil | Son kamera/kayıt düzeltmesinde **1/1 geçti (49,4 sn test)**. 1080×1920 Radeon RX550/D3D11; 13,61 sn altılı örnek ve 18,50 sn 106 instance örneği. Aşağıdaki değerler yalnızca bu kısa koşudur. |

Son görsel düzeltmelerden sonra iki yeni inceleme testi ayrıca **dev 2/2 (1,0 dk)** ve **production 2/2 (59,8 sn)** tekrarlandı; lint/typecheck/61 test/build de yeniden geçti. Eski 14 regresyonun fonksiyonel kodu bu kamera/HUD düzeltmesinde değiştirilmedi. GitHub'ın bütün son-commit kontrolleri PR üzerinde izlenir.

### Son gerçek görüntü, video ve ölçümler

[Önden](evidence/phase-2-revision/humanoid-front.png) · [Yandan](evidence/phase-2-revision/humanoid-side.png) · [106 teknik instance](evidence/phase-2-revision/humanoid-106.png) · [Sesli döngü videosu](evidence/phase-2-revision/humanoid-cycle-av.webm) · [Ham profil](evidence/phase-2-revision/humanoid-profile.json) · [Özet](evidence/phase-2-revision/summary.json).

**Ortam:** Windows 11, Ryzen 5 5500, Radeon RX550/Direct3D11, Chromium; gerçek render ve yeniden açılan video **1080×1920**. Kayıt VP8/Opus, 8.567.668 byte; ses yeniden decode edildi: **15,96 sn / 48 kHz / RMS 0,02575**. Video gerçek zamanlıdır; zamanı hızlandırma veya insan performansı görüntüsü ekleme yoktur. Son runtime `3720c04`; yedi runtime kaynağının SHA-256'sı ham profildedir. Kareler ve videonun farklı zamanları görsel olarak incelendi; yandan örtülme düzeltmesinden önceki kareler son kanıtların yerine kullanılmadı.

| Örneklenen kayan pencere ölçümü | 6 karakter / 13,61 sn | 106 teknik karakter / 18,50 sn |
|---|---:|---:|
| FPS min / medyan / max | 103,6 / **144,0** / 144,0 | 37,4 / **40,3** / 41,5 |
| Kare p95, örnekler içindeki en yüksek | 7,1 ms | 27,9 ms |
| JS heap min–max | 56,4–73,2 MiB | 79,7–119,7 MiB |
| Render üçgen / draw call yaklaşık | 131 bin / 123 | 2,27 milyon / 1101 |
| Ses saati farkı p95, en yüksek örnek | 5,12 ms | 5,30 ms |
| Decoded onset-grid p95, en yüksek örnek | 6,83 ms | 8,51 ms |
| Çözüm sonrası ayak bileği ankraj artığı, max | <0,001 mm | <0,001 mm |
| Çözüm sonrası avuç işaretçisi aralığı, max | <0,001 mm | <0,001 mm |

**106 karakterde 60 FPS hedefi sağlanmadı.** Geometri/doku/klip paylaşımı ve gölge/DPR azaltma mevcut; material/draw-call azaltma, LOD ve kalabalık okunaklılığı için daha fazla iş gerekir. 106 instance gerçek 100 izleyici kapasitesi veya kalabalığın görsel kabulü değildir. Altılı örnek sesli kayıt sırasında alındı; 106 örneğinde encoder durmuştu. FPS medyanları örtüşen kayan pencere örneklerinin özetidir, tüm karelerin bağımsız dağılımı değildir. Heap yalnız JS'dir; VRAM veya leak testi değildir. Diğer kullanıcı pencerelerinin GPU yükü kontrol edilmedi.

Çok küçük ayak/avuç değerleri **zorlanan IK hedeflerinin çözüm sonrası sayısal artığıdır**; bağımsız insan hareketi ground truth'u, gerçek taban sürtünmesi, parmak kavraması veya doğru Halay figürü kanıtı değildir. Ses değerleri de hoparlör/OBS/kamera uçtan uca gecikmesini ölçmez.

İlk Node testinde data-URI buffer yüklemesi tarayıcıya ait ProgressEvent istedi; test yardımcısı gömülü GLB buffer ile düzeltildi. Bind-pose quaternion'larının float32 normu nedeniyle açı karşılaştırması yanıltıcıydı; geri yüklenen bileşenler tam eşitlikle doğrulanıyor. İlk lint/typecheck sorunları düzeltildi. Test hataları gizlenmedi veya otomatik retry eklenmedi. Uygulama içi Browser bağlantısı ortamın `missing sandboxPolicy` hatası nedeniyle açılamadı; bağımsız gerçek Chromium/Playwright kullanıldı.

İlk GPU koşusu, select kontrolünü yanlış label yöntemiyle aradığı için 180 sn'de başarısız oldu; gerçek erişilebilir sayfa yapısındaki combobox kullanılarak düzeltildi. Sonraki sayısal olarak başarılı koşunun yandan görüntüsü ev duvarıyla örtülüyordu: görsel inceleme bunu reddetti. İnceleme kamerasında karakterlere bakış çizgisini kesen bina grupları runtime'da gizlenir; ekran görüntüsü rötuşlanmaz. İlk video yalnız WebGL canvas'ını alıp DOM uyarısını atlıyordu; gerçek render + canlı kabul/beat metni bileşimiyle düzeltildi. Çıkışın boyutu artık video dosyası yeniden açılarak doğrulanır. Bu sorunlar nedeniyle yeni inceleme testleri ve GPU kaydı tekrarlandı; önceki görüntüler son kanıt olarak kullanılmadı.

### Kabul sınırları

- **Açık:** iki gerçek/izinli Halay figürü, insan performansına göre doğru ayak sırası ve ağırlık aktarımı; uzman değerlendirmesi ve kullanıcı görsel onayı.
- **Açık:** yöresel kıyafet/yüz çeşitliliği, profesyonel son ortam/müzisyen animasyonu, kalabalık okunaklılığı ve tüm karakterler için mesh düzeyinde temas/çarpışma kabulü.
- **Kısmen doğrulanan altyapı:** GLB/glTF motion import ve retarget test edildi. FBXLoader adaptörü bağlıdır; lisanslı gerçek bir FBX mocap dosyasıyla uçtan uca kabul yapılmadı. Blender'da bake edilmiş in-place deform rig ve ayrı root trajectory beklenir; her DCC rig'inden otomatik root motion çıkarımı sunulmaz.
- **Ölçüm sınırı:** ayak metriği ayak bileği ankrajıdır; ayakkabı tabanı/başparmak/zemin basıncı değildir. Avuç metriği iki tanımlı işaretçidir; gerçek parmak kavraması, skin penetration veya insan biyomekaniği onayı değildir. Çok küçük IK artık değeri gerçek Halay doğruluğunu kanıtlamaz.
- **Açık:** yayın izni belgeli gerçek Halay kaydıyla müzikal kabul. Kanıttaki ses özgün perküsyon kalibrasyon WAV'ıdır; insan dansı veya gerçek halk müziği kaydı değildir.
- **Çalıştırılmadı:** bu revizyon için 10/20 dakikalık tam süre, 5 saat soak veya canlı TikTok testi. Önceki GLB'nin Radeon ölçümleri yeni modellerin sonucu olarak kullanılmaz.

**Sonraki somut iş:** [artist/mocap teslim şartnamesindeki](HALAY_ASSET_BRIEF.md) iki performans figürünü hak kanıtlarıyla temin etmek, aynı altılı zincirde içe aktarmak, önden/yandan sesli döngüyü yeniden kaydetmek ve kullanıcı/uzman değerlendirmesine sunmak. Bu kapı kapanmadan diğer danslara/Faz 3'e geçilmez.

## Yerel inceleme

Depo kökünde `npm ci`, `npm run dev`:

- Yeni sahne: http://127.0.0.1:5173/review.html
- Müzik: http://127.0.0.1:5174/#music
- Mock kontroller: http://127.0.0.1:5174/#test

Müziğe Halay metadata'sı verin, yeni sahnede ses motorunu açın, panelden oynatın. `Önden` / `Yandan` düğmeleri ve `9:16 kayıt kadrajı` görsel inceleme içindir; Escape kontrol görünümüne döner. `16 sn sesli kayıt` sadece bu yerel sahne/sesi indirir. Videoda kabul uyarısı korunur.
