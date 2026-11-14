# Yayıncı stüdyosu — görsel yenileme

14 Kasım 2026. Faz 2 dalındaki mevcut müzik, koreografi ve mock altyapısı korunarak kullanıcının altı ekran görüntüsünden esinlenen React paneli uygulandı. Bu çalışma Faz 2'nin açık profesyonel varlık/müzik kabulünü kapatmaz; Faz 3'e geçilmedi.

## Tasarım ve çalışan akışlar

| Önce | Şimdi |
|---|---|
| Tek sayfada oyun, müzik ve mock araçları | Genel bakış, Bağlantı, Oyun, Müzik, Test Paneli, Yayın ekranı ve Nasıl kullanılır bölümleri |
| Koyu, yoğun kontrol görünümü | Beyaz/lavanta yüzeyler, mor başlık, kesikli kenarlar, yuvarlak kartlar ve seçili sol menü |
| Sahne bağlantısının kontrol akışından ayrılması zor | Başlıkta sahneyi açma, ayrıca normal/9:16 yayın bağlantıları |
| Bölümler için doğrudan adres yok | `#overview`, `#music`, `#game`, `#test` dahil kalıcı bölüm adresleri |

Referanslardaki renk ve düzen dili yorumlandı; RotCraft markası, ekran görüntüleri veya grafik dosyaları uygulamaya kopyalanmadı. Yeni görseller yerel CSS, metin ve sistem emoji karakterleridir; üçüncü taraf grafik/font indirmesi eklenmedi. Örneklerdeki gerçek TikTok bağlantısı, yeni hediye kuralları ve tetikleyiciler uygulanmış gibi sunulmadı. Bağlantı göstergesi yalnızca yerel WebSocket durumudur; test olayları mock olarak etiketlenir.

`App.tsx` mevcut işlemleri ve durum yönetimini korur; `StudioShell.tsx` gezinmeyi ve bölüm çerçevesini sağlar. Müzik bileşeni bölüm geçişlerinde unmount edilmez: kaydedilmemiş parça ve oyun ayarları korunur. Sesin sahibi bağımsız yayın sahnesidir. Sahnenin dış çerçevesi panelle uyumlu renklere taşındı; 3D motor, GLB, dans klipleri ve ses işleme kodu bu yenilemede değiştirilmedi.

Klavyeyle odak, görünür seçili bölüm, etiketli kontroller ve mobilde 44 px kontrol yüksekliği kullanılır. Boş başarı bildirim bölgesi ekran okuyucu için korunur. Bu kontroller tam WCAG uygunluk sertifikası değildir.

## Doğrulama ve kanıt

- `npm run verify`: lint, strict typecheck, **52/52 unit/entegrasyon** ve tüm paket/API/UI build'leri geçti. Önceki 49 teste port doğrulaması/ayrımı için üç test eklendi.
- Geliştirme Chromium: **14/14 geçti**, 2,5 dakika; 2 opt-in uzun/donanım testi atlandı, retries=0.
- Üretim Chromium: **14/14 geçti**, 2,3 dakika; aynı 2 opt-in test atlandı, retries=0.
- Üç yeni tarayıcı testi bölüm adresleri, gerçek bağlantı yetenekleri, kaydedilmemiş taslakların korunması, metadata kaydı/reload, 390 px görünümde yatay taşma olmaması ve odak davranışını sınar.
- Önceki legacy, mock katılım/hediye, WS yeniden bağlantı, gerçek WAV/MP3/OGG decoding, ritim analizi, otomatik sonraki parça ve panel kapanınca ses/render devamı testleri korundu.

İlk kısa dev koşusunda 12/14 geçti. Boş bildirim alanının `display:none` ile erişilebilirlik ağacından kaybolması düzeltildi. İkinci hata, açık kullanıcı önizlemesi ile test sahnesinin aynı servise farklı istemci telemetrisi göndermesiydi. Testler hem ayrı DB/dosya klasörüne hem ayrı port aralığına taşındı; tekrar koşuda 14/14 geçti. Otomatik retry eklenmedi.

Playwright `data/e2e.sqlite` ve ona ait `.music` klasörünü kullanır; `HALAY_PORT_OFFSET=10000` ile dev sahne/panel **15173/15174**, üretim **14174/14175**, API/WS **18787** olur. Legacy referansı **4173**'te kalır. Normal önizleme **5173/5174/8787** değişmedi. Testler sırasında normal önizleme açık kaldı ve kullanıcının iki kayıtlı müzik dosyası korunarak kütüphane sayısı kontrol edildi; adları veya dosyaları kanıta/Git'e alınmadı.

Üretim Playwright tarayıcısından alınmış, görsel olarak incelenmiş, rötuşlanmamış ekran görüntüleri:

- [Masaüstü genel bakış](evidence/phase-2/ui-refresh/overview.png)
- [Sentetik prova kaydıyla Müzik Yöneticisi](evidence/phase-2/ui-refresh/music.png)
- [390 px mobil müzik görünümü](evidence/phase-2/ui-refresh/mobile-music.png)

Kanıttaki müzik özgün 16 saniyelik test WAV'ıdır; gerçek halk müziği veya yayın lisansı kabulü değildir. Önceki [Faz 2 donanım/senkronizasyon ölçümleri](PHASE_2_REPORT.md) tarihsel kanıttır: bu yalnızca UI yenilemesi için 10 dakikalık GPU profili, 20 dakikalık döngü veya 5 saat dayanıklılık testi yeniden çalıştırılmadı. Profesyonel kıyafet/mocap ve folklor doğruluğu, yayın izni belgeli gerçek kayıtla işitsel kabul ve uzun süre testi açık kalır. Sonraki iş bu açık kabul konularını tamamlamaktır.

## Yerel önizleme

Depo kökünde `npm ci` ve `npm run dev`:

- Panel: http://127.0.0.1:5174/#overview
- Müzik: http://127.0.0.1:5174/#music
- Sahne: http://127.0.0.1:5173

Ses için sahnedeki ses motoru düğmesine bir kez basın; paneli kapatırken sahne ve Node servisini açık bırakın. [Taslak PR #3](https://github.com/Rdvn268/Halay-Fest/pull/3).
