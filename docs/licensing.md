# Varlık ve lisans envanteri — Faz 0–2

## Faz 2 ekleri

| Varlık | Köken ve lisans kanıtı | Sınır |
|---|---|---|
| festival-dancer.glb | `scripts/create-character.ts` ile özgün mesh, skin weights, 17 kemik ve 12 keyframe klibi; [asset LICENSE](../apps/broadcaster/public/characters/LICENSE.txt), [SHA-256 manifesti](../apps/broadcaster/public/characters/festival-dancer.manifest.json); yalnız bu yeni asset CC0-1.0 | İndirilmiş model/mocap yok. Profesyonel yöresel hareket doğrulaması yapılmadı. Altı varyasyon aynı kostümün renkleridir. |
| Yeni zemin/çatı/sıva dokuları ve festival detayları | `packages/halay-game/src/environment.ts` içindeki özgün Canvas/geometri; dış texture yok | Eski köy kaynağının hak durumu aşağıda korunur. |
| WAV/MP3/OGG test kayıtları | Özgün kalibrasyon sinyali; `test/helpers/audio.ts`, `scripts/create-test-audio.py`, [fixture açıklaması](../test/fixtures/audio/README.md); CC0-1.0 | Üretim müzik paketi veya gerçek halk müziği kaydı değildir. |
| music-metadata 12.5.0 | Kurulu paketin MIT metni: [yerel kopya](../assets/licenses/music-metadata-MIT.txt), [birincil kaynak](https://github.com/Borewit/music-metadata) | Node tarafında konteyner/süre çözümlemesi; yüklenen kaydın yayın iznini doğrulamaz. |
| Kullanıcının yüklediği müzik | Dosya ve metadata yerel kalır; uygulama yayın hakkı devralmaz | Bu çalışmaya izin belgeli gerçek Halay/Horon icrası teslim edilmedi. Canlı müzik hakları ve gerçek icrada işitsel/koreografik kabul açık. |

Yeni varlık lisansı tüm depoya veya legacy'ye lisans atamaz. Soundfile/numpy/matplotlib yalnız test fixture kodlamak için geçici geliştirme araçları olarak kullanıldı; uygulama veya CI bağımlılığına eklenmedi. Ses decoder'ı tarayıcıya aittir; codec/platform desteği değişebilir. Lisans kanıtı bulunmayan arama sonuçlarından müzik/model indirilmedi.

| Varlık / kaynak | İnceleme sonucu | Hak/kanıt durumu |
|---|---|---|
| Three.js 0.180.0, jsDelivr | HTML'deki gerçek import; npm kurulumu değildir | [r180 MIT kaynağı](https://raw.githubusercontent.com/mrdoob/three.js/r180/LICENSE), yerel kopya `assets/licenses/three-r180-MIT.txt` |
| DM Sans, Google Fonts CSS | Harici font; ikili dosya projede yok | [OFL kaynağı](https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt), `assets/licenses/DM-Sans-OFL.txt` |
| Outfit, Google Fonts CSS | Harici font; ikili dosya projede yok | [OFL kaynağı](https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt), `assets/licenses/Outfit-OFL.txt` |
| Meydan/karakter/geometri/etiketler | HTML içinde prosedürel; dış model/tekstür/profil resmi bulunmadı | Kaynak kullanıcı tarafından teslim edildi; ayrı sahiplik/lisans beyanı yok |
| Halay/horon sentez dizileri | Web Audio osilatör/perküsyon; kayıtlı şarkı/örnek dosya bulunmadı | README özgün diyor; eser/kayıt sahibi, ticari yayın/platform/coğrafya hakları henüz bağımsız teyit edilmedi |
| Emoji | Metin karakterleri, yerel OS/font tarafından çizilir | Görünüm ve platform koşulları değişebilir; ayrı grafik dosyası eklenmedi |
| Yeni koruma ZIP'i | Yalnızca teslim edilen iki kaynağın kopyası | Yeni hak yaratmaz; tarihsel ZIP olarak sunulmaz |

Kaynakta uzaktan yüklenen modül/font dışında HTTP çağrısıyla TikTok/hediye entegrasyonu bulunmadı. Varlık taraması tek başına telif uygunluğu garantisi değildir. Lisans dosyaları 14 Kasım 2026'da yukarıdaki birincil kaynaklardan kopyalandı; font `main` referansları sonradan değişebilir, yerel metinler bu teslimin kanıtıdır.

Yeni oyun müziği/modeli eklenmeden önce eser ve kayıt sahibi, kaynak, lisans sürümü, ticari kullanım, streaming/platform/coğrafya kapsamı ve gerekli atıf kayda geçirilmelidir. Faz 0 teknik kabulü canlı yayın hak onayı değildir.

Projenin tamamına MIT veya başka lisans ataması yapılmadı; kullanıcı teslim ettiği kaynaklar için ayrıca lisans seçebilir. Araç lisansları [bağımlılık kaydındadır](risks-and-dependencies.md). `npm audit` CDN'den yüklenen Three.js/fontları taramaz.

## Faz 1 ekleri

Yeni uygulama Three.js 0.180.0'ı npm'den paketler. Google Fonts veya yeni ses/model/görsel varlığı eklenmedi; sistem fontu kullanılır. v0.2 geometri, nota ve hareket kaynakları kendi proje kodunun taşınmasıdır; ayrı ticari yayın hakkı onayı halen yoktur.

React/react-dom/scheduler, Zod ve Three.js MIT lisansları kurulan sürümlerin LICENSE dosyalarından `apps/*/public/third-party-notices.txt` içine kopyalandı. Vite bu dosyayı iki uygulamanın build'ine dahil eder. Araç lisansları bağımlılık kaydındadır. Kod taşıma, sahiplik/yayın hakkı onayı yerine geçmez.
