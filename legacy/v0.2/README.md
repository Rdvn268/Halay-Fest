# HALAY FEST v0.2

Tarayıcıdan çalışabilen 3D TikTok LIVE temalı halay simülatörü ve kontrol paneli.

## Çalıştırma
1. `index.html` dosyasını Chrome veya Edge'de açın. Three.js CDN'den indirildiği için **internet gereklidir**.
2. `katıl`, `Takip et`, `+ 10 izleyici` ve hediye butonlarıyla etkileşimleri test edin.
3. Yayın için LIVE Studio'da tarayıcı penceresi / ekran yakalama kullanın. `Sahneyi büyüt` butonuyla oyun sahnesini tam ekran yapın.

Yerel sunucu tercih edilirse klasör içinde `python -m http.server 8000` komutunu çalıştırıp http://localhost:8000 adresini açın.

## Yeni: Müzik ve dans senkronizasyonu
- **Halay:** Özgün, sentezlenmiş 2/4 davul/zurna benzeri ezgi ve geniş kol hareketleriyle yan adımlar.
- **Horon:** Özgün, sentezlenmiş 7/8 (2+2+3) ezgi; hızlı ayak ve omuz hareketleri.
- Sağ panelden **Müziği başlat** butonuna basılması gerekir (tarayıcıların otomatik ses oynatma kısıtlaması).
- **Otomatik** mod 4 dakikada bir halay ve horon arasında geçiş yapar; oyun 20 dakikalık şenlik döngüsünü korur.
- Ses seviyesi ayarlanabilir, müzik durdurulabilir, dans elle değiştirilebilir.
- Müziği özel ses dosyası olarak kullanmıyoruz: sesler Web Audio ile tarayıcıda anlık üretilir, üçüncü taraf bir şarkı içermez.

## Dahil olan özellikler
- Three.js üzerinde stilize köy meydanı, 3D NPC/oyuncu karakterleri ve kesintisiz dans hareketi
- Varsayılan **20 dk döngü**, **6 NPC**, **100 oyuncu kapasitesi**, **takip + katıl** katılım ayarları
- Otomatik döngü, otomatik kamera açıları, rastlantısal etkinlikler
- Oyuncu ekleme, simüle edilmiş hediyeler, etkinlik günlüğü, sahne büyütme, duraklatma
- Ayarların localStorage ile saklanması

## Kritik sınırlar
Bu bir **yerel, tek tarayıcıda çalışan prototiptir**. TikTok LIVE yorum, takip, hediye API bağlantısı henüz yoktur. `Takip et` butonu sadece olay simülasyonu yapar. Gerçek kullanıcı kimliği doğrulaması, kalıcı oyuncu verisi, sunucu, bağlantı kurtarma, kapsamlı 5 saatlik yük testleri ve profesyonel enstrüman kayıtları henüz yoktur.

Tarayıcı veya bilgisayar uykuya geçerse simülasyon durabilir. TikTok yayınlarında içerik moderasyonu ayrıca gerekir.
