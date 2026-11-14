# Halay Fest — sinematik sanat standardı

15 Kasım 2026 · **Üretim ve sanatsal kabul açık.** Bu belge hedefi tanımlar; mevcut sahnenin bu hedefe ulaştığını bildirmez. ROADMAP ve kullanıcının güncel kapsamı esastır.

## İlk teslim

Altı farklı yetişkin insan, açık Halay zinciri, iki uzman tarafından doğrulanmış gerçek figür, başçeken ve mendil, izinli gerçek müzik, 1080 × 1920 / 45 saniye. Erkek ve kadın performansları ayrı kaydedilip aynı iskelet sözleşmesine uyarlanır. Cinsiyetten otomatik adım/enerji/amplitüd türetilmez; yöre, icracı ve kıyafete göre karar verilir. Son kullanıcı talebiyle Kolbastı, pop ve oyun havası **araştırma/figür şartnamesine** eklendi; bu türler ilk Halay sahnesine veya runtime seçicisine eklenmez.

## İnsanlar ve kıyafet

- Altı ayrı yüz/gövde görünümü, doğal baş–omuz–kalça oranları; renk değişimi çeşitlilik sayılmaz. Üç erkek ve üç kadın görünümü ilk casting önerisidir; kullanıcı kabulü bekler.
- Parmaklı eller, ayak/ayakkabı tabanı, doğal yüz ve saç. Yakın planda göz/diş, eklem çökmesi, bilek kırılması, kıyafet altından ten çıkması kontrol edilir.
- Nötr poz, metre ölçeği, +Y yukarı/+Z ileri runtime koordinatı; Blender Z-up aktarımı açık dönüşümle yapılır. DCC kontrol rig'i ayrı, deform rig'i GLB'de. Twist, toe ve finger kemikleri için rig profili gerekir; mevcut 16 eklem eşlemesi yeterli ilan edilmez.
- Çağdaş Anadolu düğünü veya belirli yöre kostümü seçimi belgelenir. Fantastik köylü kıyafeti Anadolu kostümü sayılmaz. Kesim, kumaş, nakış ve ayakkabı yöre referansıyla hazırlanır; erkek/kadın kıyafeti gövdeyle birlikte fit/deform testinden geçer.
- Albedo/normal/roughness materyalleri, doğru renk uzayı; cilalı plastik ten ve aynı malzeme değerindeki saç/kumaş kullanılmaz. 2K hero / 1K uzak doku ve karakter başına 30–60 bin üçgen yalnız başlangıç bütçesi önerisidir; gerçek donanım ölçümü belirler.

## Dans ve temas

İlk aday: Sivas Düz Halay'ın yerinde ayak ve yürüyüş bölümleri. Bu bir **araştırma seçimi**, onaylı animasyon değildir. Kaynakta sayılan zamanlar doğrudan 4/4 beat'e çevrilmez. İcracı/eğitmen, müzik notası ve video üzerinde ağırlık değişimini işaretler; sonra tempo/ölçü ve her ayağın stance/swing aralıkları kesinleştirilir. Kaynakların tarihsel tasnifi bütün güncel icralar veya bütün kadın/erkekler için kural sayılmaz.

Her figür için önden/yandan ayakları görünür eşzamanlı performans, icracı izni, koreograf onayı, .blend kaynak, deform klibi, temas/root eğrisi ve gerçek ses beat-grid'i gerekir. Başçekenin serbest eli/mendili ve içteki elinin komşuyla tutuşu ayrı track'lerde author edilir. Komşu avuç hedefi tek başına parmak kavrama kanıtı değildir. Ayakkabı tabanındaki heel/toe işaretçileriyle stance boyunca dünya kayması ve penetrasyon ölçülür; bağımsız referansa karşı kontrol edilir.

Mevcut `studies.ts` ve eski sinüs klipleri bu sahnenin figürü olamaz. Foot-lock, IK veya retarget kötü kaynak performansını doğru Halay'a dönüştürmez. İki figür arasında contact-aware blend ve ölçü sınırı geçişleri, giriş/çıkış pozlarıyla artist tarafından kontrol edilir.

## Meydan ve kadraj

Anadolu taş/sıva/ahşap mimarisi için tek yöre referansı seçilir; rastgele bölgesel motif kolajı yapılmaz. Gerçek ölçülü döşeme, düğün süsleri, kablo/sandalye/masa gibi kontrollü detaylar ve performans veren müzisyenler hedeflenir. Mevcut basit evler ve davul dekoru nihai çevre değildir.

Sıcak akşam ana ışığı, gökyüzü dolgusu, pratik ampuller; gölgede yüz ve kumaş okunmalı. Başlangıçta tek gölgeli yönlü ışık, bake edilmiş çevre/ışık probe yaklaşımı; ışık sayısı ölçüme göre artar. Aşırı bloom/alan derinliği ile ayak ve eller gizlenmez. HDRI/scan seçimi ayrıca lisans kaydına girer.

45 saniyelik kamera anahtar planı: 0 sn önden tam grup, 9 sn yandan tam ayaklar, 18 sn başçeken/mendil, 27 sn çapraz geniş, 36 sn başlangıç kadrajına dönüş ve 45 sn döngü. Anahtarlar arasında yumuşak geçiş, son 9 saniyede ön kadrajda bekleme. Kamera yalnızdır; figür değişimini kamera saniyesi yönetmez. Tam ölçü/figür döngüsü ve ses dikişi seçilen gerçek kayıtla hazırlanır. 45 saniye her BPM'de tam ölçü değildir; keyfi tempo zorlaması yapılmaz. Kamera ilk/son konumu ve hızı eşleşse bile ses/beden dikişi kabul edilmiş olmaz.

9:16 merkezde altı beden ve ayaklar; üst/alt platform güvenli alanları gerçek yayın yerleşimiyle incelenir. Öneri: üst 180 px, alt 300 px kontrol alanı; yüz/temasları kapatan HUD yok. Mor/beyaz panel referansları yönetim arayüzüne aittir; sinematik dünyaya çizgi film estetiği dayatmaz.

## Teknik sözleşme ve kabul

React müzik yöneticisi, Node gateway, SQLite/disk streaming, mock olaylar ve AudioContext beat-clock korunur. Panelin kapanması sesi kapatmaz. Yeni kamera planlayıcısı saf fonksiyondur, ses/media konumunu girdi alır; kendi `Date.now()` dans saati yoktur. Araştırma figürleri runtime klibi değildir ve mevcut import izinlerini genişletmez.

Sanatsal hedef için henüz renderer kurulmadı: `/cinematic.html` sadece çalışan hazırlık panosudur. Varlıklar sağlanınca mevcut importer/retarget/contact altyapısı yeni rig profilleriyle genişletilir; sessiz eski model fallback'i yapılmaz. Önce altı karakter doğrulanır. 100 karakter ve diğer oyun uygulaması bu kapıdan sonra ayrıca değerlendirilir.

Kabul kaydı her kaynak dosyasının SHA-256'sı, izin kanıtı ve inceleyen kişiyi içerir. Sonraki gerçek render'da ön/yan PNG, 45 saniye sesli video, baş/son dikiş, ayak tabanı kayması, el mesh teması, müzik-onset/animasyon vuruş farkı, ham kare süreleri/FPS ve donanım kaydedilir. Önerilen inceleme eşikleri: stance taban kayması p95 ≤2 cm, avuç mesafesi p95 ≤2 cm, sync p95 ≤30 ms. Bunlar henüz ölçülmüş sonuç veya kabul edilmiş biyomekanik standart değildir. Nihai karar kullanıcı görsel onayı ve yöresel uzman değerlendirmesidir. 60 FPS/5 saat garantisi verilmez.
