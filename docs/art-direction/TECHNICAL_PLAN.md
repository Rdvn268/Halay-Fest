# Sinematik üretim için teknik geçiş

15 Kasım 2026 · Hazırlık araçları çalışır; yeni gerçekçi 3D renderer/varlık seti henüz üretilmedi.

## Korunan sınırlar

`services/live-gateway` API/WebSocket ve SQLite müzik metadata'sı, diskteki kullanıcı dosyaları, React paneli, FileMusicPlayer streaming çıkışı, AudioContext beat-clock ve mock oyuncu/hediye akışı aynen korunur. Yeni hazırlık sayfası bunlardan hiçbirine komut göndermez; ses başlatmaz, başka sekmenin sesini kesmez. Legacy, ROADMAP ve önceki kabul raporları değiştirilmez.

Yeni kodlar:

- `cinematic-plan.ts`: sonlu/pozitif girdi kontrolü, verilen medya konumundan 45 saniye döngülü kamera konumu/hedefi, anahtarlar arasında sıfır uç hız/ivme ile interpolasyon. Duraklama/seek, çağıranın aynı/başka mediaSeconds vermesidir. Şu anda WebGL kamerasına veya müzik motoruna bağlanmamıştır.
- `loopPreflight`: gerçek grid ve iki figürün beat sayıları sağlandığında 45 saniyenin tam ölçü/sekans uyumu. 120 BPM'de 90 beat, 4/4 için tam ölçü değil. 128 BPM'de 96 beat aritmetik olarak uyabilir; bu BPM bir öneri veya gerçek müziğin tespiti değildir. Ses ve hareket dikişi her zaman ayrıca doğrulama ister.
- `dance-briefs.ts`: Halay için iki kaynak temelli aday tarif, Kolbastı için iki motif, oyun havası için iki araştırma görevi, pop için iki özgün basit sayım taslağı. Erkek/kadın take talimatı, kaynak ve `playable:false`; AnimationClip veya import manifest'i değildir. Mevcut diğer dans kütüphaneleri açılmaz.
- `cinematic.html`: sabit hazırlık durumu, 9:16 şeması, elle gezilen kamera planı, ölçü ön kontrolü ve araştırma filtresi. Kayıt düğmesi/3D render/müzik oynatma yoktur. Bu sayfa genel bir dosya/lisans doğrulama motoru değildir.

## Gerçek varlık geldiğinde sırayla yapılacak işler

1. **Kabul paketi:** ASSET_REGISTER'daki her hedef için gerçek dosya ve izin belgesi. Kaynak ve türev SHA-256; lisansın commercial/runtime/source/video/music kapsamları elle incelenir. Dosya bildirimindeki `true` izin bayrağı veya site URL'si yeterli değildir.
2. **DCC:** Altı farklı modelin metre/rest/mesh/material/skin kontrolü, `.blend` kaynakları; deform kemiklerinin export'u. Halay klipleri insan take'lerinden doğrulanır. Kıyafet ve anatomiyi procedural generator ile doldurma yok.
3. **Importer:** Mevcut bounded GLB/glTF/FBX loader korunur. Her rig için parmak/toe/twist profili ve deformasyon testi eklenir. Mevcut doğrudan iki-segment hiyerarşi varsayımı twist rig'lerinde otomatik çalışmış sayılmaz. FBX adaptörü lisanslı gerçek teslimle henüz sınanmadı; .blend runtime formatı değildir, Blender export doğrulaması gerekir.
4. **Koreografi:** Bir kez retarget/bake edilmiş ortak klipler, bağımsız skeleton instance'ları. Gerçek beat-grid, onaylı stance aralıkları ve ayrı grup root trajectory. Tam ölçüde contact-aware blend; geçişte ayak/kol erişim hatası izlenir. Ayakkabı tabanı heel/toe ölçümü mevcut ankle proxy'den ayrılır; el marker artığı gerçek kavrama ölçümü yerine geçmez.
5. **Renderer:** Yeni varlıkları ayrı sinematik entry'de kullan; başarısız yüklemede eski iki modeli tekrarlayan fallback yok. Planlayıcıya gerçek medya konumu bağlanır; müziğin mevcut saati korunur. Bu tasarım altı kişiyle sınırlıdır; 100 kişiye optimizasyon işi başlatılmaz.
6. **Gerçek kabul:** Ön/yan ve sinematik PNG, 45 saniye sesli WebM, yeniden decode edilen süre/çözünürlük/audio, baş/son ses ve hareket dikişi. Ham kare zamanları, donanım, altılı sahne FPS/p95, heap, müzik onset ve ayak tabanı/el mesh hatası kaydedilir. Ölçümlerin yöntem ve sınırları raporlanır. Kullanıcı ve yöresel uzman onayı olmadan üretim kabulü verilmez.

Yeni npm bağımlılığı veya varlık paketi eklenmedi. Hazırlık sayfasının testi, gerçek GLB/FBX varlık doğrulaması, yeni sahne FPS'i veya gerçek halay video kabulü değildir.
