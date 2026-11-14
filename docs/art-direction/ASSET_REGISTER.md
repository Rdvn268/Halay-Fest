# Varlık kaydı

15 Kasım 2026 · Yeni sinematik üretim seti **yok**. Lisans uygunluğu, kaynak varlığı ve sanatsal kabul ayrı kapılardır. Bu tabloda aday olmak satın alma, indirme, onay veya kullanım anlamına gelmez.

| Mevcut kaynak | Hak/kanıt | Yeni sahnedeki karar |
|---|---|---|
| `festival-dancer.glb`, `scripts/create-character.ts` | Özgün prosedürel mesh/17 kemik, repo lisans kaydı | Kullanıcı reddetti; eski regresyon referansı. İnsan performansından üretilmedi. |
| `characters/humanoid/male.glb`, `female.glb`, iki saç ve iki outfit | Quaternius Standard paketlerinin CC0 beyanları `assets/licenses/quaternius-*-CC0.txt`; dosya SHA'ları public `manifest.json` / `outfits-manifest.json` | İki görünüm/generic peasant kıyafet. Altı ayrı gerçekçi kişi/yöresel giysi değil; üretime alınmaz. |
| `humanoid/studies.ts` iki temas çalışması | Özgün CC0, `halay-contact-studies-CC0.txt` | İnsan performansı/mocap değil; gerçek Halay figürü olarak kullanılamaz. |
| `environment.ts`, `humanoid/courtyard.ts` | Özgün kod/üretilmiş materyal | Teknik sahne. Yöresel mimari/profesyonel çevre kabulü yok. |
| `test/fixtures/audio/calibration.*` | Özgün test kalibrasyon sesi | Gerçek müzik yerine kullanılmaz. |
| Yerel kullanıcı müzik kütüphanesi | Kullanıcıya özel, yayın/redistribution kanıtı yok | Korunur; Git'e/video kanıtına izinsiz alınmaz. |
| [Devrim Çalış referansı](https://www.youtube.com/shorts/EQDNYvKI43Q) | Kullanıcı bağlantısı; lisans/performans release yok | Görsel referans; indirilen/dağıtılan animasyon veya müzik değil. |

Quaternius arşiv bütünlüğü: base `fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40`; outfits `c3468b18871cc8c8f05ab14df7712baf22cb9f389cbd870babf130e595187f70`. Önceki manifest ve lisans kayıtları değiştirilmedi. SHA hak sahipliğini veya sanatsal kaliteyi kanıtlamaz.

## Temin/üretim listesi

| Kimlik | Gereken teslim | Durum / yöntem |
|---|---|---|
| CHAR-01…06 | Altı ayrı gerçekçi yetişkin gövde/yüz/saç + rigged kıyafet/ayakkabı GLB, .blend ve texture kaynakları | Eksik. Artist üretimi veya lisansı ayrı doğrulanmış paket; kadın/erkek fitting ve deform testi. |
| HALAY-01/02 | Yerinde ayak / yürüyüş adayları; iki gerçek icra, .blend, bake GLB/FBX, root/stance verisi | Eksik. Eğitmen ve iki icracı ile çekim, mocap cleanup veya elle keyframe; yöre doğrulaması. |
| REF-M / REF-F | Erkek ve kadın önden/yandan senkron insan performansı, zaman kodu | Eksik. Animasyona uyarlama, ticari yayın ve yeniden dağıtım kapsamı yazılı izinle belirlenir. |
| MUSIC-01 | Gerçek icra edilmiş kayıt/master, besteci/aranjör/performer izin zinciri, beat-grid, kesintisiz 45 sn düzenleme | Eksik. Folklorik ezginin anonim olması kayıt/master kullanım hakkı vermez. |
| ENV-01 | Seçilen yörenin meydanı, materyaller, dekor ve müzisyenler | Eksik. Model/texture/HDRI lisansı ayrı kayıt. |
| PROP-01 | Mendil mesh/material ve başçekenin authored hareketi | Eksik. Artist üretimi, elde kavrama ve kumaş bake testi. |

## İncelenen adaylar — seçilmedi

- [Blender resmi demo dosyaları](https://www.blender.org/download/demo-files/): Human Base Meshes CC0 paketi modelleme başlangıcı olabilir. Hazır altı giyimli, rigged gerçekçi karakter seti değildir. Blender Studio'nun farklı eğitim dosyalarının lisansları bu paketin lisansıyla karıştırılmaz.
- [Poly Haven lisansı](https://polyhaven.com/license): varlıkları CC0 olarak sunar; çevre materyali/HDRI aday kaynağıdır. Bu görevde belirli varlık indirilmedi/eklenmedi; web/API koşulları ayrı değerlendirilir.
- Genel dans kütüphanesi, YouTube öğreticisi veya Second Life içi satış ilanı, indirilebilir/ticari yeniden dağıtılabilir Halay mocap izni yerine sayılmaz. Ücretli içerik alınmadı.

Her yeni dosya için: kaynak URL, sürüm/tarih, yazar, orijinal lisans belgesi, ticari kullanım, runtime dağıtımı, kaynak .blend dağıtımı, müzik yayını/kayıt videosu izinleri ve kısıtları; dosya SHA-256, izin inceleyeni ve sanat inceleyeni kaydedilecek. Kaynak dağıtımı yasak pakette .blend'i Git'e ekleme koşulu karşılanmaz; hak sahibinden ek izin gerekir. Yalnız `commercialUse:true` yazan manifest doğrulanmış izin değildir.

Yeni `.blend`, `.fbx` ve izinli gerçek müzik bulunmadı. Gerçek üretim GLB/FBX import testi, yeni altılı FPS ölçümü ve sesli 45 saniye video bu varlıklar gelmeden yapılmış sayılamaz.
