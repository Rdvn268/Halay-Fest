# Mevcut sistem analizi — 14 Kasım 2026

## Denetim kapsamı

`main` başlangıç commit'i `f9b5097` yalnızca `ROADMAP.md` içeriyordu. Kullanıcının sağladığı `codex/phase-0-prototype-import` dalı `fc050e0` ile iki dosya eklendi. Bu commit mevcut dala fast-forward ile alındı. Kaynak HTML/README `legacy/v0.2/` altına taşındı; hiçbir oyun satırı değiştirilmedi. Başlangıçta package manifesti, test, CI veya uygulama lisansı yoktu.

## Kaynakta bulunan ve kısa tarayıcı testinde doğrulananlar

| İşlev | Kanıt ve sınır |
|---|---|
| Three.js 3D meydan, dansçılar | Gerçek CDN modülüyle Chromium açıldı; WebGL canvas ve referans PNG'ler incelendi |
| 6 NPC, 20 dk, kapasite 100, `both`, otomatik anahtarlar | Varsayılan kontroller ve HUD test edildi; NPC etiketleri `Şenlik Ekibi` |
| Yorum/takip simülasyonu | Aynı adla iki yorum + takip tek oyuncu oluşturdu; gerçek takip doğrulanmadı |
| Toplu ekleme/sıfırlama | 1 oyuncudan 11'e çıktı, sıfırlama 0'a indirdi |
| Altı hediye düğmesi | Gül, kalp, davul, konfeti, taç, havai fişek düğmeleri işlendi; olay sayacı 1→7 |
| Halay 2/4 ve Horon 7/8 | Mod seçimi ve dans değiştir düğmesi çalıştı; kaynakta ayrı hareket ve nota dizileri var |
| Web Audio sentezi | Gerçek AudioContext kullanıcı tıklamasıyla `running`, durdurmayla `suspended` oldu; işitsel kalite değerlendirilmedi |
| Duraklat/devam | Duraklatınca saat en az 2,1 saniye sabit; devam edince ilerledi |
| Yeni döngü düğmesi | Döngü #1→#2; sayfa yeniden yüklenmedi |
| localStorage ayarları | Kapasite 50 seçildi, reload sonrası kaldı; varsayılan düğmesi 100'e döndürdü |

## Kaynakta mevcut, bu fazda tam kabulü yapılmayanlar

- `performance.now()` ve `requestAnimationFrame` tabanlı döngü; `dt` üst sınırı 0,06 sn. 20 dakikalık otomatik sınır ve dört dakikalık otomatik dans geçişi kaynakta mevcut; gerçek süreli tam tur bu fazda çalıştırılmadı.
- 17 saniyede kamera seçimi, 35 saniyede rastlantısal etkinlik; görsel akış var fakat seçim adaleti ve uzun süre doğruluğu ölçülmedi.
- Ses seviyesi kontrolü ve tam ekran API düğmesi var; ses yüksekliği/beat kayması ve LIVE Studio tam ekran yakalama kabulü yapılmadı.
- Kapasite kontrolü kaynakta var; 100 oyuncu yük/FPS ve 120 kişi kuyruk kabulü yapılmadı.

## Eksik ve ertelenenler

Gerçek TikTok, kararlı kullanıcı ID'si, olay normalizasyonu/dedupe/streak, FIFO kuyruk, moderasyon, ayrı sahne/panel, Node API/WS, SQLite/migration, restart state restore, kimlik doğrulamalı LAN erişimi, rig animasyon varlıkları, 9:16 yayın güvenli alanı, telemetri/watchdog, 5 saat soak ve pilot yayın henüz yok.

Kaynak incelemesinde görülen riskler: oyuncu anahtarı kullanıcı adıdır; kapasite düşürülünce mevcut oyuncular kalır; NPC/oyuncu kaldırma yollarında tüm Three.js geometry/material/texture kaynakları dispose edilmez; müzik oyun duraklatmasından bağımsız sürebilir; ses scheduler'ı ve render saatinin uzun süre uyumu ölçülmemiştir. Bunlar Faz 0'da korunmuş mevcut davranışlardır; giderilmiş sayılmaz.

## Varlık taraması

İki özgün dosyada gömülü üçüncü taraf ses/model/görsel dosyası bulunmadı. Meydan ve karakterler Three.js geometrileri; ad etiketleri canvas; müzik osilatörlerle üretilir. Emoji görünümü OS/fonta bağlıdır. Harici Three.js 0.180.0 ve Google Fonts DM Sans/Outfit kullanılır. Özgünlük/ticari yayın hakkı için otomatik hukuki onay çıkarılamaz; [lisans kaydı](licensing.md) kalan doğrulamaları belirtir.
