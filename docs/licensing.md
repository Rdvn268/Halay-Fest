# Varlık ve lisans envanteri — Faz 0

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
