# Erkek ve kadın dans araştırması / figür üretim dosyası

15 Kasım 2026 · Kullanıcının yeni talebi: Halay, pop müzik, Kolbastı ve oyun havasını araştırıp uygun figürler hazırlamak. **Sekiz figür/üretim taslağı oluşturuldu; sekiz 3D animasyon oluşturulmadı.** Kodlanmış tarifler `packages/halay-game/src/dance-briefs.ts` içindedir. Her biri erkek/kadın çekim görevine ayrılır. Bütün kayıtlar `research-draft`, `playable:false`; runtime motion manifest'i veya diğer dansların kilidini açmaz.

## Kaynak değerlendirmesi

| Alan | İncelenen birincil kaynak / sonuç | Üretime aktarım |
|---|---|---|
| Halay | [KTB Ağırlama/Düz Halay](https://ekitap.ktb.gov.tr/TR-78840/agirlama-veya-duz-halay.html), figürler ve yürüyüş bölümü: yerinde ayak hareketi ile ilerleme ayrı anlatılır. | İki Halay aday tarifi; kaynak zamanlarını beat-grid'e otomatik çevirmek yasak. Ayak sırası/ölçü icracı ve nota ile eşlenecek. |
| Kadın/erkek Halay | [Sivas İl Kültür Müdürlüğü](https://sivas.ktb.gov.tr/TR-76036/halk-oyunlari.html) farklı ve ortak icra repertuvarlarını kaydeder. | Tarihsel tasnif evrensel cinsiyet kuralı sayılmaz. Aynı figür için iki gerçek take, ayrı giysi ve temas incelemesi. |
| Kolbastı | [Mehmet Can Pelikoğlu, Trabzon Yöresi Halk Müziği ve Kolbastı](https://dergipark.org.tr/en/pub/ataunigsfd/article/33519), [makale PDF](https://dergipark.org.tr/tr/download/article-file/28995): ağ/olta, kürek gibi taklidi motifleri ve zamanla eklenen modern hareketleri tartışır. [Trabzon KTB](https://trabzon.ktb.gov.tr/EN-126985/horon-ve-calgilarimiz.html) karşılıklı icrayı kaydeder. | Ağ atma/çekme ve kürek motifleri için iki çekim brief'i. Kadın varyantının somut performansı elde edilmedi; erkek take ölçeklenerek kadın dansı üretilmez. Horon veya Halay klibi hızlandırılmaz. |
| Oyun havası | [Nevşehir Kültür Portalı](https://kulturportali.gov.tr/turkiye/nevsehir/kulturatlasi/halk-oyunlari): yerel repertuvar, temassız karşılıklı kadın oyunları, el ele topluluklar ve kaşık oyunu; kıyafet tarifleri farklıdır. | Tek evrensel oyun havası adımı yok. Kaşık ve karşılıklı düzen için araştırma görevleri; erkek/kadın icralar, ezgi ve usul henüz seçilmedi. Kadın kaynağından erkek ayak dizisi uydurulmaz. |
| Pop | [BBC Dance Workshop 2013](https://downloads.bbc.co.uk/schoolradio/pdfs/danceworkshop_autumn_2013.pdf), Street Dance bölümü, yan adım/dokunma ve bireysel kol yorumunu eğitim bağlamında ele alır. | Pop bir müzik kategorisi; tek standart dans değil. Temel hareket fikriyle proje için iki basit özgün 8 sayım taslağı; kaynak müziği, fotoğrafları veya koreografi videosu kopyalanmadı. |

Yukarıdaki web/PDF kaynakları okunabilir öğretim/araştırma kaynağıdır. İçeriklerinin, performer görüntülerinin veya müziklerinin ticari animasyon/video dağıtım izni doğrulanmış değildir. Alıntı video, müzik veya kitap/PDF dosyası depoya eklenmedi. Kullanıcının önceki YouTube bağlantısı da izin belgesi sayılmadı. Bu araştırma uzman değerlendirmesi veya lisans görüşü yerine geçmez.

## Nasıl figür üretilecek?

1. Önce tek yöre/ezgi ve iki Halay figürü eğitmenle seçilir. Erkek ve kadın icracıdan tam ayaklar görünen önden/yandan senkron video ve performansı animasyona dönüştürme/yayın/dağıtım kapsamlı yazılı izin alınır. Kaynak klip ve inceleyen kişi kayda girer.
2. Her take için destek ayağı, taban teması, boş ayağın yönü, gövde ağırlığı, el bağlantısı, mendil komutu ve sayım icracıyla işaretlenir. Kaynakta olmayan sayım otomatik doldurulmaz. Giysi hareketi cinsiyet etiketinden türetilmez.
3. Mocap cleanup veya Blender keyframe ile tam deform rig'e bake edilir. .blend, GLB/FBX, açık rig map, metre root eğrisi ve stance aralıkları teslim edilir. Parmak/toe/twist içeren hedef rig için mevcut adapter geliştirilir.
4. Gerçek müzik grid'i ve geçiş ölçüsü onaylanır; IK/foot-lock yalnız ince düzeltme yapar. Yeni klipler `studies.ts` üzerinden türetilmez.
5. Altılı sahnede ön/yan görüntü, gerçek sesli 45 saniye ve bağımsız taban/el ölçümleri alınır. Kullanıcı ve yöresel eğitmen kabulü açıkken diğer danslar runtime'a eklenmez.

## Açık işler

Gerçekçi altı karakter, kıyafetler, insan take'leri, izinler, Blender kaynakları, iki gerçek klip ve izinli müzik hâlâ eksik. Bu turda yalnız metinsel/typed figür taslakları, sanat standardı, çekim planı ve hazırlık önizlemesi üretilebilir. Denge/ağırlık/yerellik videodan ve gerçek animasyondan doğrulanmadan “doğru iki gerçek Halay figürü” koşulu karşılanmaz.
