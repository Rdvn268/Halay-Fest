# HALAY FEST — Ürün, Mimari ve Codex Uygulama Yol Haritası

> **Sürüm:** 1.0 · **Tarih:** 9 Kasım 2026 · **Durum:** Uygulamaya hazır teknik plan  
> **Proje sahibi hedefi:** Windows bilgisayarda çalışan, TikTok LIVE yorum/takip/hediye etkileşimlerini 3D halay-horon oyununa dönüştüren, 20 dakikalık döngüleri otomatik tekrarlayan, 5+ saatlik yayına dayanıklı, ileride farklı oyunları destekleyebilen özgün platform.  
> **Ana geliştirme aracı:** **Codex**. **ChatGPT Work:** rakip analizi, yaratıcı içerik, UX ve raporlama gibi yardımcı işler.

## 0. Codex'e verilecek kesin talimatlar

Bu belge proje gereksinimi ve iş emri niteliğindedir. Codex her aşamada önce mevcut kodu inceleyecek, sonra küçük, test edilebilir değişiklikler yapacak; hiçbir özelliği çalışmış gibi göstermeyecektir.

1. Önce `README.md`, mevcut `index.html`, bağımlılıklar ve testleri incele. Mevcut uygulama başlangıç prototipidir; gerçek TikTok entegrasyonu **yoktur**. Kaybetmeden yedekle.
2. Fazları sırayla uygula. Her faz için ayrı Git dalı/PR, test sonuçları, ekran görüntüsü, tamamlanan işler ve kalan risklerle rapor oluştur.
3. Uydurma API, desteklenmeyen TikTok yetkisi, sahte takip algılama veya sahte başarı durumu oluşturma. Özellik yoksa 'desteklenmiyor' yaz ve simülasyon yolunu koru.
4. TikTok şifresi veya oturum çerezi isteme; bağlantı adaptörü sadece yetkili/halka açık canlı yayın olaylarını mümkün olduğu ölçüde kullansın. Üçüncü taraf kitaplıkların lisanslarını, platform şartlarını ve bakım durumunu kontrol et.
5. Canlı olayların tekrar işlenmesini önle; veri güvenliğini ve bağlantı arızalarını birinci sınıf gereksinim say.
6. Görsel tasarım yayıncılık düzeyinde olsun: okunaklı isimler, 9:16 sahne, akıcı dans, gerçek hareket senkronu. Yalnızca çalışan butonları sun.
7. Başka platformların kodunu, grafiklerini veya müziklerini kopyalama; kendi özgün varlıklarımızı veya uygun lisanslı varlıkları kullan.
8. Çalışmayan test, uyarı veya eksik kabul kriteri varsa raporda açıkça belirt; hatayı gizleme.
9. Kullanıcının onayı olmadan ücretli servis, canlı hediye testi veya buluta herkese açık kurulum yapma.
10. Önemli operasyonlar (canlıya alma, harici servis hesabı bağlama, veri silme, ücretli işlem) için açık onay iste. Geliştirme/test sırasında varsayılan olarak sahte etkinlikler kullan.

## 1. Ürün tanımı ve kapsam

### 1.1 Tek cümlelik hedef

Yayıncı, bilgisayarında oyunu ve TikTok LIVE Studio'yu açar; `@` olmadan TikTok kullanıcı adını girer; **Bağlan** der. İzleyiciler ücretsiz yorumla veya alınabiliyorsa takip olayıyla halaya katılır; hediyeler kurallara göre karakterleri ve sahneyi etkiler. Yayıncı müdahalesi olmaksızın oyun içi döngü devam eder; yayın moderasyonu ve güvenliği için insan gözetimi/uzaktan kontrol devam eder.

### 1.2 Değiştirilmeyecek varsayılanlar

| Ayar | Varsayılan | Açıklama |
|---|---:|---|
| Ana döngü | 20 dakika | Yeniden başlama, yeni şenlik turu |
| NPC | 6 | Gerçek kişi gibi gösterilmeyen sanal karakter |
| Gerçek oyuncu üst sınırı | 100 | Sahne ve kuyruk politikası ayrı |
| Katılım | `both` | Takip olayı alınırsa ekle; `katıl` her zaman çalışır |
| Otomatik döngü | `true` | İzleyici olmasa da NPC'lerle devam |
| Kamera geçişleri | `true` | Manuel kilitleme seçeneğiyle |
| Rastlantısal olaylar | `true` | Tekrarlanabilir, adil, güvenli olay havuzu |
| Yayın sahnesi | 1080×1920 (9:16) | Performansa göre 720×1280 / 30 FPS düşüş modu |
| Ana hedef | 5+ saat | Kesintisiz stres testi; sınırsız çalışmayı garanti etmez |

### 1.3 Kapsam içinde

- Windows odaklı yerel başlatma; tarayıcı oyun sahnesi + ayrı yönetim paneli.
- 3D köy/düğün meydanı, halay ve horon, özgün veya lisanslı müzik; müzik-dans eşzamanlama.
- Seyirci katılımı, kullanıcının karakteri, kuyruk, ad/etiket, profil resmi için kontrollü kullanım.
- Yorum, takip (kullanılabildiğinde), beğeni, hediye olayları; bağlanma/yeniden bağlanma durumu.
- Hediyeden aksiyona kural editörü; test simülatörü, kayıt/tekrar oynatma.
- 20 dakikalık, sahne yeniden yüklemeden dönen program; alt etkinlikler; kamera rejisörü.
- Yerel kayıt, telemetri, watchdog, moderasyon, güvenli kapanma ve yayın hazırlık denetimi.
- Gelecekte farklı oyun motorlarını takılabilir modüller halinde çalıştırma mimarisi.

### 1.4 İlk sürümde özellikle kapsam dışında

- Başkalarının TikTok oturumuna giriş yapma, TikTok platform denetimlerini atlatma.
- İzleyiciyi hediye göndermeye mecbur kılma; gerçek para ödülleri, şans oyunu, bahis.
- Canlı yayın izleyici sayısını, takip olayını veya hediye verisini uydurma.
- Çok kiracılı SaaS ödeme sistemi, mobil native uygulama, kapsamlı kullanıcı pazaryeri.
- Telif hakkı belirsiz ticari şarkıları projeye gömme.

### 1.5 Başarı ölçütleri

- Tek bilgisayarda basit başlangıç prosedürü; ilk bağlantı veya simülasyon ≤ birkaç adım.
- Gerçek zamanlı olayın normal koşullarda oyuna aktarılma gecikmesi ölçülür ve p95 hedefi **≤2 saniye** olarak izlenir; garanti değildir.
- 100 oyuncuda asgari **30 kararlı FPS**, destekleyen makinede hedef **60 FPS**; FPS ve kare süresi ölçülür.
- 5 saat otomatik testte bellek büyümesi kontrollü, oyun donma/çökme yok, döngüler eksiksiz.
- Gül streak'i dahil hediye sayımı tekrarsız; aynı kullanıcı tekrar `katıl` yazınca ikinci karakter açılmaz.
- Yayın koptuğunda sahnede bağlantı durumu açıkça görünür; reconnect gerçek duruma dayanır.
- İlk sürümde 0 izleyici ile NPC şenliği devam eder; gerçek katılım varmış gibi gösterilmez.

## 2. Mevcut dosyalar — doğrulanmış başlangıç durumu

Bu plan hazırlanırken mevcut yerel dosyalar incelenmiştir:

- `halay-fest/index.html`: tek HTML'de Three.js temalı 3D sahne, stilize karakterler, yerel yönetim kontrolleri.
- `halay-fest/README.md`: v0.2 açıklaması; 20 dk döngü, 6 NPC, 100 oyuncu, halay/horon ritimleri, simüle hediye/katılım.
- `halay-fest-v0.2.zip`: önceki prototipin arşivi.

**Doğrulanmamış ve eksik:** gerçek TikTok olay bağlantısı; kararlı 5 saat stres testi; prod düzeyinde müzik/dans varlıkları; gerçek kullanıcı kimliği ve olay idempotency; yönetim paneli ile oyun ayrımı; bağlantı dayanıklılığı.

**Codex başlangıç işi:** Bu dosyaları repo'ya `legacy/v0.2/` altında arşivle; çalışan mevcut sürümü `legacy` etiketiyle koru. Kod yeniden yapılandırılmadan önce ekran görüntüsü ve temel açılış kontrolü al. Yeni uygulamayı kademeli kur; eski kaynakların üzerine kontrolsüz yazma.

## 3. Araç seçimi — Codex ve Work

| İş | Birincil araç | Neden |
|---|---|---|
| Repo hazırlığı, mimari, TypeScript kodu | **Codex** | Kaynak dosya değişiklikleri ve test |
| Hata ayıklama, refactor, PR, CI | **Codex** | Terminal, diffs, Git/GitHub |
| Oyun sahnesi + yönetim paneli | **Codex** | Yinelemeli çalışan uygulama |
| Rakip ekranlarının UX analizi | Work (opsiyonel) | Tarayıcı üzerinden gözlem/rapor |
| Varlık/müzik lisans araştırması | Work + insan incelemesi | Ticari kullanım hakları |
| Canlı yayın kabul testleri | Codex + insan | Gerçek TikTok yayını kullanıcı kontrolünde |

**Önerilen kurulum:** GitHub'da özel `halay-fest` deposu; Windows'ta Codex desktop/CLI ile yerel repo (gerçek LIVE testleri burada), bağımsız kod işleri için Codex Cloud ortamı. Cloud ortamına TikTok şifresi, çerez, gerçek hediye verisi veya canlı yayına özgü hassas değer koyma. Cloud işi varsayılan olarak mock/replay ile doğrula.

### 3.1 Codex'i ilk kez başlatma

1. Özel GitHub reposu oluştur (`halay-fest`).
2. v0.2 dosyalarını `legacy/v0.2/` altında ekle; `main` dalına başlangıç etiketi koy (`legacy-v0.2`).
3. Windows'a Git, desteklenen LTS Node.js ve uygun paket yöneticisini kur; `node --version`, `npm --version` doğrula.
4. Codex'te klasörü/repo'yu aç; belgeyi köke `ROADMAP.md` olarak yerleştir.
5. İlk Codex görevi olarak **Faz 0 ve Faz 1** ver; ilk mesajda sadece bu fazları geliştirmesini belirt.
6. Codex her PR'de `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` çalıştırsın.
7. Canlı bağlantıyı sadece Windows'ta gerçek yayınla test et; simülasyonu ve logları kullanarak onayla.

## 4. Mimari — yerel modüler monolit + ayrı görüntüleme

```text
                      TikTok LIVE (yayıncı adı)
                               |
                   [LIVE Connector Adapter]
                     |  bağlantı / heartbeat
                     v
                  [Event Ingest]
                    normalize + dedupe
                     |        |
                 [Event Log] [Retry/Queue]
                     \        /
                      v      v
                    [Rules Engine] <---- [Yönetim Paneli]
                         |
                    [Game State]
                       /   \
                      v     v
              [Realtime Gateway] ---> [OBS/LIVE Studio Sahnesi]
                      |                       |
                    WS/WebSocket       Three.js oyun renderer
                      |
                 [Control Panel]

        [SQLite] ayarlar / profiller / skorlu olaylar / oturumlar
        [Observability] durum / FPS / gecikme / hata / watchdog
```

### 4.1 Teknoloji kararı

- **TypeScript + Node.js (LTS):** backend, bağlantı ve kurallar.
- **Vite + React + TypeScript:** yayıncı yönetim paneli.
- **Three.js:** 3D meydan ve animasyon.
- **WebSocket (`ws` veya karşılığı):** gerçek zamanlı olay yayını.
- **SQLite + migration aracı:** başlangıçta yerel ayarlar, olay günlüğü ve oturum kayıtları.
- **Zod veya eşdeğeri:** inbound olay ve ayar şemaları.
- **Vitest / Playwright:** birim, entegrasyon, uçtan uca test.
- **Electron veya Tauri (sonraki faz):** kolay Windows kurulum paketi; ilk sürümde gereksiz zorunluluk yaratma.
- **Rapier:** halay koreografisi için zorunlu değil; ileride araba/arena oyunlarında fizik için opsiyonel.
- **TikTok-Live-Connector:** yalnızca `LiveSourceAdapter` arkasında, değiştirilebilir **resmî olmayan** sağlayıcı. Kitaplık kendisini üretim garantili API olarak tanımlamıyor. Alternatif yönetilen servis maliyet ve sözleşme denetimi sonrası değerlendirilebilir.

### 4.2 Monorepo dizin hedefi

```text
halay-fest/
  ROADMAP.md
  AGENTS.md
  README.md
  .env.example
  apps/
    broadcaster/          # 3D yayın sahnesi; gerçek yayın penceresi
    control-panel/        # yönetim paneli ve uzaktan kontrol
    desktop/              # ileride tek tıkla Windows paketi
  services/
    live-gateway/         # TikTok adaptörü, event ingest, websocket
  packages/
    contracts/            # DTO, zod şemaları, sürümleme
    event-engine/         # normalize, dedupe, rules, cooldown
    game-core/            # oyun durumu, oyuncu, döngü, kuyruk
    halay-game/           # danslar, meydan, kamera ve etkinlikler
    game-sdk/             # gelecekte diğer oyunlar için API
    ui/                   # ortak arayüz bileşenleri
  assets/
    licenses/             # ses/model/tekstür lisans kanıtları
  test/
    fixtures/             # anonimleştirilmiş olaylar
    e2e/
    soak/
  docs/
    architecture.md
    event-contracts.md
    live-operations.md
    security-and-privacy.md
    licensing.md
  legacy/v0.2/
  .github/workflows/ci.yml
```

**Mimari ilkesi:** Oyun görüntüsü, TikTok bağlantı servisi ve yönetim paneli ayrı süreç/sayfalardır. TikTok bağlantısı kesilirse 3D oyun donmaz; NPC ve otomatik döngü devam eder. Panel kapansa da yayın sahnesi çalışır. Yönetim panelinin aynı makinede olması başlangıçta tercih edilir.

## 5. Olay sözleşmeleri ve veri modeli

### 5.1 Kanonik olay tipleri

```ts
type LiveEventType =
  | 'chat' | 'follow' | 'like' | 'gift' | 'share' | 'viewer_join'
  | 'connection_state' | 'synthetic_test';

type LiveEvent = {
  eventId: string;              // kaynak mesaj kimliği veya güvenli türetilmiş anahtar
  source: 'tiktok_unofficial' | 'mock' | 'replay';
  roomId: string;
  sourceTimestamp?: number;
  receivedAt: number;
  type: LiveEventType;
  userId?: string;              // kaynak kararlı ID varsa; display name değil
  displayName?: string;
  payload: Record<string, unknown>;
};
```

### 5.2 Olay işleme ilkeleri

- Gelen olay JSON şema doğrulamasından geçer, farklı API alan adları tek modele normalize edilir.
- Çoklu `katıl` yorumları aynı kullanıcı için tek aktif karakter üretir. Yorum normalizasyonu Türkçe karakterleri korur.
- `follow` olayı *best-effort*. Gelmeyebilir veya daha önce takip etmiş kişi için tekrar oluşmayabilir. Her zaman `katıl` alternatifi açık.
- Hediye streak'lerinde `repeatCount` kümülatiftir; ara mesajları tam miktar olarak tekrar ekleme. Mümkünse tamamlanma (`repeatEnd`), tür, kullanıcı, `groupId`/mesaj ID ile tekilleştir; eksik bitiş için timeout + son bilinen miktar ve mutabakat politikası oluştur.
- `giftId` tek başına benzersiz olay ID'si değildir. Kimlik ve miktar belirsizse para değerini veya ödül sayısını kesin göstermeyip güvenli işleme al.
- Event işleyici `at-least-once` girişe karşı idempotent olur. Aynı `eventId` tekrarlandığında ikinci kez oyun aksiyonu tetiklenmez.
- Olaylar sınırlı kuyruk üzerinden işlenir. Aşırı yükte düşük öncelikli beğeni animasyonlarını birleştir; hediye kaydını sessizce silme.
- Hediye fiyatı, coin ve net gelir iddiası üretme: metadata ödeme/gelir teyidi değildir.
- Replay/test olayları `source=mock|replay` olarak işaretlenir; gerçek yayında sahte etkinlik gibi sunulmaz.

### 5.3 Temel tablolar

`stream_sessions`, `users` (minimum alan), `participants`, `event_inbox`, `processed_events`, `gift_mappings`, `game_settings`, `event_outcomes`, `rounds`, `leaderboards`, `asset_licenses`, `system_logs`.

Minimumlar: şema migration, indeksler, son kullanma/saklama politikası, restart'ta toparlama, çoklu kullanıcı adı değişikliğinde kararlı ID eşleme, açıkça belirlenmiş veri silme aracı. Kullanıcı fotoğrafı veya kişisel veriyi gereksiz kalıcı saklama.

## 6. Oyun tasarımı — Halay Fest v1

### 6.1 Sahne

- Özgün düşük/orta poligon Anadolu/Karadeniz meydanı: sahne, çay masaları, festival ışıkları, düğün tabelası, NPC müzisyenler.
- Ana halay halkası + taşma durumunda ikinci/üçüncü halka; kapasiteler 100 toplam oyuncuya göre hesaplanır.
- Karakterler 3D rig kullanır; duruş, bacak, kol, omuz hareketleri senkronize. El ele zincir sahne koordinatlarını bozmadan çalışır.
- Kullanıcı adları okunabilir, çakışma önleyici etiket düzeni; 9:16 güvenli yayın alanı ve TikTok arayüzü payı.
- 6 NPC **NPC** olarak etiketlenir. Seyirci yokken doğal ama sahte kullanıcı olmayan festival yürür.

### 6.2 Dans ve müzik

- İki ana mod: **Halay 2/4** ve **Horon 7/8**; ritim ölçüsü, tempo, cue noktaları ve dans state-machine'i farklı.
- İlk sürümde açık lisanslı/orijinal enstrümantal döngüler; ayrı ses katmanları ve metronom tabanlı beat clock. Gerçek Türkçe şarkı kaydı ancak gerekli haklar doğrulanınca eklenir.
- Karakter animasyonlarında time-based koreografi; render FPS değişse bile ses beat'inden kopmayan faz hesaplama.
- Geçişte bar sınırı (measure boundary), crossfade, tempo adaptasyonu; ani ses patlaması yok.
- Tarayıcı otomatik ses başlatma kısıtı: oyunu başlatırken bir kez kullanıcı etkileşimi. Sonraki döngülerde otomatik sürer.
- En az 3 halay + 3 horon animasyon varyasyonu; aynı hareketi tek düze tekrarlama.
- Müzik telif dosyası: eser sahibi, kayıt sahibi, kaynak, ticari kullanım izni, canlı yayın/streaming, coğrafya ve platform hakları yazılı tutulur.

### 6.3 20 dakikalık sonsuz tur

| Dakika | Alt etkinlik | Otomatik davranış |
|---|---|---|
| 00–04 | Açılış halayı | NPC'ler, yeni katılım, isim gösterme |
| 04–08 | Horon zamanı | Uygun müzik/animasyon ve kamera geçişi |
| 08–12 | İki ekip eğlencesi | Ücretsiz yorumla takım veya rastlantısal takım |
| 12–16 | Düğün özel anları | Konfeti, davulcu, konuk girişi, yağmur gibi efektler |
| 16–20 | Final ve sıralama | Adil skor, kazanan kutlaması, sonraki tur başlatma |

**Tur geçişi:** Sayfa yenileme yok. Animasyon ve müzik gecikmelerini `Date.now()` ile sürekli toplamaktan kaçın; monotonic clock ve sabit tick bazlı gerçek zamanlı state kullan. Gecikme nedeniyle atlanan zamanı kontrollü işleyip patlayan catch-up döngüsünü sınırla. Katılımcı kalıcılık/puan sıfırlama politikası açık ve ayarlanabilir olsun.

### 6.4 Katılım, yoğunluk ve adalet

- Giriş: `katıl` yorumuyla ücretsiz; takip alındığında otomatik eklenti yalnızca güvenilir olay varsa.
- Bir kullanıcı = bir aktif karakter. Tekrar olayda konum/puan korunur.
- 100 kapasite dolarsa FIFO bekleme kuyruğu, sıranın görünür olması ve süre dolunca otomatik rotasyon.
- Önceki kullanıcı yeniden geldiğinde uygun geri giriş; tek kullanıcının spam ile tüm sırayı kaplaması engellenir.
- Kullanıcı adı temizleme, uzunluk sınırlama, Unicode/font testi, engelleme listesi ve özel karakter güvenliği.
- Hediye göndermeyenler de katılıp görünür şekilde dans eder; hediyeler kozmetik veya zaman sınırlı etki sağlar.

### 6.5 Kural motoru ve hediye eşleme

Kontrol panelindeki her kural: tetikleyici, filtre (ID ve isim), hedef kullanıcı/takım, eylem, miktar, süre, cooldown, koşul, öncelik, aktiflik, test modu.

Örnekler (oyun tasarımı; mevcut TikTok veya Rotvay'ın hazır kuralı iddiası değil):

- `chat == 'katıl'` → `JOIN_USER`, ücretsiz.
- `follow` (alınırsa) → `JOIN_USER`, idempotent.
- `gift == Rose` → gönderen karaktere 8 sn özel dans + görsel gül.
- `gift == Finger Heart` → 10 sn ışıklı aura; miktar konfigüre edilebilir.
- `gift == custom` → davulcu çağır, konfetiyi aç veya kamera odakla.
- `like` → toplu coşku sayacına sınırlı katkı.

Önizleme ve geri alma: Kural güncellemesi canlı yayında anında ama atomik şekilde uygulanır; her sürüm tarihçelenir. Hediyeye para değeri atayıp haksız/yanıltıcı mekanikler yaratma.

### 6.6 Kamera ve ses rejisi

- Kamera 10–25 sn aralıklarla planlı seçim: genel plan, yakın dans, müzisyenler, kalabalık plan, etkinlik yakın planı.
- Serbest kamera dışında 'yayın güvenli' açılar; isimler ve HUD dışarı taşmasın.
- Hediyenin önemli efektine 2–4 sn odaklama ve ardından ana plan; ani kamerada mide bulantısı yaratacak hareketlerden kaçın.
- Ses karışımı: müzik, efekt, TTS ayrı kanallar; normalize/loudness, master volume, mute, ducking.
- Telif/oynatım uyarısı; ses kaynağı bozulursa sessiz güvenli fallback, yanlış lisanslı içerik kullanma.

## 7. Yönetim paneli — fonksiyonlar ve ekranlar

### 7.1 Sayfalar

1. **Yayın Kontrolü:** kullanıcı adı, Bağlan/Kes, gerçek bağlantı durumu, oda ID, son olay zamanı, reconnect, kaynak, sürüm, oturum başlat/durdur.
2. **Oyun:** NPC 6, kapasite 100, 20 dk döngü, otomatik kamera/etkinlik, duraklat/devam, oyuncu kuyruğu.
3. **Hediyeler & Kurallar:** tablo, filtre, sürükle-bırak gerekmeksizin basit kural formu, test ve log.
4. **Müzik & Dans:** halay/horon, çalma listesi, tempo, ses seviyeleri, koreografi önizleme.
5. **Katılımcılar:** aktif, bekleyen, kullanıcı ara, çıkar/mute/engelle, moderasyon denetim kaydı.
6. **Yayın Sahnesi:** 9:16 tam ekran aç, pencere yakalama ve kaynak adresi, güvenli alan overlay.
7. **Tanılama:** FPS, kare süresi, bellek, olay gecikmesi, WS durumu, son hata, çalışma süresi, test geçmişi.
8. **Ayarlar:** depolama, veri saklama, güvenlik, uzaktan panel izni, tema ve erişilebilirlik.

### 7.2 Panel davranışı

- `Bağlan` butonu bağlantı kuruldu sinyali gelmeden 'Bağlandı' göstermez.
- Bağlantı durumları: `disconnected`, `connecting`, `connected`, `reconnecting`, `failed`, `no_live_room`.
- Panelde hem gerçek LIVE hem `Demo` modu net ayırt edilir; demo olaylar sahne logunda işaretlenir.
- Değişiklikler otomatik kaydedilir veya açık `Kaydet` işlemiyle saklanır; kaydetme başarısızlığı gösterilir.
- Android için web tabanlı kontrol mümkün: ilk sürüm yalnızca LAN ve güvenli kimlik doğrulama, internetten erişim sonradan ve kontrollü.
- Kritik butonlar: yayın sahnesi acil durdur, yeni katılımı durdur, hediye efektlerini kapat, tüm sesleri sustur, güvenli sahneye geç.

## 8. Güvenlik, lisans ve platform uygunluğu

- TikTok'la doğrudan entegrasyon sunan **resmî bir LIVE event API'si** herkese açık biçimde garanti edilmiyor; kullanılan kütüphane reverse-engineering tabanlı. Hata, engellenme, rate limit ve koşul değişikliklerini öngör.
- TikTok yayın yetkisi, uygun konu/kategori, müzik hakkı ve LIVE kuralları yayın öncesi kontrol listesinde yer almalı.
- **Otomatik oyun ≠ insan müdahalesi gerekmeyen, platformca her zaman kabul edilen canlı yayın.** Yayın boyunca moderasyon, iletişim ve gerektiğinde durdurma sorumluluğu insanda.
- Kullanıcı adları, profil resimleri, hediye ilişkileri kişisel veri niteliği taşıyabilir: veri minimizasyonu, silme, erişim kontrolü, güvenli saklama, uygun KVKK değerlendirmesi.
- Panel yalnızca `127.0.0.1` üzerinde varsayılan olarak servis edilir; LAN açık olacaksa parola/token, CORS allowlist, CSRF/origin kontrolü, rate limiting ve TLS/özel tünel kararı gerekir.
- Node servisinin ağ açıklarında güvenlik duvarı; webhook/WS mesajlarını doğrula, server-side kontrollü eylem eşle.
- Oyuncu mesajı HTML olarak işlenmez; XSS, URL manipülasyonu ve yerel dosya erişimini engelle.
- Olay logları süre sınırlı, özel bilgiler maskeli, kimlik doğrulama bilgisi loga dökülmez.
- Üçüncü taraf varlıklar için ticari yayın lisansı ve atıfları dosyada topla; başka oyunun görselini birebir kopyalama.
- Yedek/geri yükleme ve yerel veri silme adımları test edilmeli.

## 9. Geliştirme fazları ve kabul kapıları

> Süreler taahhüt değildir; her faz tamamlanmadan sonraki faz 'bitti' sayılmaz. Her fazda bağımsız çalışan çıktı, test ve kabul kriteri bulunur.

### FAZ 0 — Repo ve mevcut prototipin denetimi (P0)

**İşler:** v0.2'yi yerel olarak aç; işlevleri say; `legacy/v0.2` arşivini al; Git, CI ve `AGENTS.md` oluştur; risk/bağımlılık listesini çıkar; telif varlıklarını tarayıp listele.

**Teslim:** repo; mevcut sistem analizi; referans ekran görüntüleri; görev panosu; ilk `npm` komutları.

**Kabul:** v0.2 bozulmadan açılır; değişiklikler Git'te izlenir; mevcut/eksik özellikler ayrı listelenmiştir.

### FAZ 1 — Modüler iskelet ve yerel başlatma (P0)

**İşler:** monorepo; React kontrol paneli; Three.js yayın sahnesi; Node API/WebSocket; ortak contract; SQLite migration; tek komutla dev açılış; üretim build.

**Teslim:** `npm run dev`, `npm run build`, `npm run test` çalışan iskelet; yayın sahnesi ve panel ayrı URL.

**Kabul:** panel kapanınca sahne kapanmaz; mock event panelden yayın sahnesine ulaşır; typecheck ve build yeşil.

### FAZ 2 — Dans motoru ve görsel kalite (P0)

**İşler:** meydan sahnesi; 6 NPC; rig/animasyon; halay/horon; metronom/beat clock; lisanslı ses yükleme; performans göstergesi; 9:16 HUD; mobil önizleme.

**Teslim:** kaliteli, müzikle senkron dans eden 3D sahne.

**Kabul:** 10 dk simülasyonda dans-müzik kayması gözle ölçülebilir düzeyde olmaz; ses/hareket durdur-devam tutarlı; CPU/GPU yükü raporlanır.

### FAZ 3 — Oyun durumu ve sonsuz döngü (P0)

**İşler:** tur state-machine'i, 20 dk ve alt fazları; 100 gerçek karakter; 6 NPC; kuyruk; rota/pozisyon; otomatik kamera ve rastlantısal olay; restart state restore; sahne yenilemesiz geçiş.

**Teslim:** ağ olmadan kendi kendine akan oyun.

**Kabul:** hızlandırılmış 15 döngü testinde state kaybı yok; gerçek 5 saatlik test sonraki dayanıklılık fazında; 0 izleyici modu çalışıyor.

### FAZ 4 — Yerel event motoru ve simülatör (P0)

**İşler:** normalize/dedupe; yorum/follow/gift/like mock; replay; kural motoru; log; cooldown ve rate-limit; test paneli; config export/import.

**Teslim:** `katıl`, takip, Gül ve özel hediye testleri ile 3D karakter etkileşimi.

**Kabul:** 100 oyuncu limit aşılmaz; aynı hediye olayı ikinci kez etki etmez; 1.000 sentetik olayda donma yok; durum geri yüklenir.

### FAZ 5 — Gerçek TikTok LIVE adaptörü (P0 / riskli bağımlılık)

**Ön koşul:** platform kullanım koşulları ve bağlantı sağlayıcısı uygunluğu değerlendirilir; yayıncı kendi hesabıyla gerçek LIVE açar.

**İşler:** kullanıcı adı giriş; canlı oda keşfi; `tiktok-live-connector` adaptörü; bağlantı durumları; yorum/takip/hediye/like; re-connect, jitter/backoff; streak doğruluğu; olay ID; loglar; sağlayıcı unavailable fallback.

**Teslim:** gerçek yayında çalışan `katıl` + Gül testi, destekleniyorsa takip testi; yayın kapalıyken doğru durum.

**Kabul:** yayın kapalıysa `connected` yazmaz; `katıl` ile 1 kullanıcı eklenir; tekrar yorum ikinci karakter yapmaz; Gül/seri sayımı doğru; bağlantı kopmasında NPC dansı sürer.

**Özel not:** Otomatik takip katılımı kesin özellik olarak vaat edilmez; TikTok olayı ulaşmazsa yorumla katılım görünür ve kalıcı alternatif olarak çalışır.

### FAZ 6 — Yayıncı kontrol paneli ve hediye kuralları (P1)

**İşler:** tüm panel sayfaları; kural editörü, önizleme; ses ve kamera; sahne geçişleri; bağlantı tanı ekranı; acil durdur; basit roller (yerel admin), değişiklik günlüğü.

**Teslim:** kod düzenlemeden hediye -> karakter/etkinlik eşleme.

**Kabul:** yeni Gül kuralı panelden ayarlanıp mock ile doğrulanır; yanlış/silinmiş kural güvenli fallback yapar; değişiklikler yeniden açılışta korunur.

### FAZ 7 — Yayın entegrasyonu, kurulum paketi ve Android paneli (P1)

**İşler:** temiz 9:16 penceresi; LIVE Studio'da pencere veya link kaynak; yerel Windows başlatıcı; otomatik süreç denetimi; başlat/durdur; LAN erişimi için güvenlik; Android kontrol/izleme arayüzü.

**Teslim:** yayına hazırlık sihirbazı ve test adımları.

**Kabul:** yayıncı rehberle 10 dk içinde kurulum akışını tamamlayabilir (test hedefi); Android panelinden durum görüntülenir; harici erişim açık bırakılmaz.

### FAZ 8 — 5 saatlik dayanıklılık, performans, güvenlik (P0 çıkış kapısı)

**İşler:** 5 saat gerçek zamanlı soak; saatlerce aynı dans; 100 karakter; burst 1000+ olay; reconnect/failover; uyku modu, Windows güncelleme, ağ kesintisi senaryoları; profiling, leak analizi.

**Teslim:** tarihli `SOAK_REPORT.md`, fps grafikleri, bellek ölçümü, hata listesi.

**Kabul:** 5 saat boyunca ana oyun döngüsü çalışır; 15 tam döngü tamamlanır; kritik kilitlenme yok; bağlantı kopukluğu kullanıcıya doğru gösterilir; memory leak yok veya giderilir; kabul edilen FPS eşiği donanımda sağlanır.

**Uyarı:** Donanım ve TikTok kısıtlarından dolayı 60 FPS veya 5 saat kesintisiz canlı yayın garantisi verilmez; ölçülerek raporlanır.

### FAZ 9 — Kontrollü canlı pilot (P0 çıkış kapısı)

**İşler:** 15 dk/1 saat/3 saat/5 saat kademeli yayın; moderatör/uzaktan kontrol; yorumla katılım testi; gerçek hediye isteğe bağlı ve kullanıcı onayıyla; görsel okunabilirlik ve ses kalitesi; izleyici geri bildirimi.

**Teslim:** `PILOT_REPORT.md`, sorun/çözüm listesi, oyun sürümü.

**Kabul:** kritik hata yok; yayıncı bir sonraki yayına hazırlık kontrolünü bağımsız yapabilir.

### FAZ 10 — Sürdürülebilir ürün ve yeni oyunlar (P2)

**İşler:** `GamePlugin` API, Horse Race/Bumper Arena için mock modül; asset pipeline; sürüm güncelleyici; yerel yedekleme; opsiyonel çoklu yayıncı/abonelik için fizibilite.

**Teslim:** halay oyununun kodunu kopyalamadan ikinci oyunu ekleyebilen SDK prototipi.

**Kabul:** yeni oyun eklendiğinde TikTok bağlantı adaptörü, event-engine ve panelin ortak bölümleri değişmeden kullanılır.

## 10. Test matrisi (zorunlu)

| Test | İşlem | Beklenen sonuç |
|---|---|---|
| Yorum | Aynı kullanıcı 3 kez `katıl` | Tek karakter |
| Takip | Takip olayı hiç gelmedi | Yorum katılımı sürer, sahte takip yok |
| Kapasite | 120 kullanıcı | 100 aktif + 20 bekleme (NPC politikası ayrı) |
| Hediye tekrar | Aynı ID 3 kez | Tek efekt |
| Streak | Gül 1→2→3 final | 3 adet; 1+2+3 değil |
| Araya giren mesaj | Streak eksik final | Açık güvenli timeout/reconciliation |
| Bağlantı | Yayın kapalıyken bağlan | `no_live_room` ve açıklama |
| Reconnect | Ağ 30 sn kesilsin | Oyun akmaya devam, bağlanma denemesi |
| 20 dk sınırı | Döngü bitişi | Yenisini başlat, sayfa reload yok |
| 5 saat | 15 tur | Donma yok, bellek kararlı |
| FPS | 6 NPC, sonra 100 oyuncu | Kare süreleri kaydedilir |
| Ses | Müzik ve dans geçişi | Faz/koreografi tutarlı |
| XSS | İsim içinde HTML/emoji | Güvenli düz metin |
| Panel | İzinsiz LAN erişimi | Yetkisiz erişim reddedilir |
| Yayın ekranı | 9:16 mobil önizleme | HUD/isim okunur; TikTok UI'yla çakışmaz |
| Moderasyon | Engellenmiş kullanıcı | Katılım ve ad görünürlüğü kontrol edilir |
| Kurtarma | Uygulama yeniden başlar | Ayarlar ve izin verilen state geri gelir |
| Olay yoğunluğu | 1000 olay/10 sn mock | Queue sınırları, öncelik ve ölçümler doğru |

**Test altyapısı:** birim + integration + Playwright UI + uzun süreli soak; sahte olay kayıtları ve mümkünse anonimize edilmiş izinli canlı örnekler; CI'da gerçek TikTok'a bağlanma zorunlu tutulmaz.

## 11. Operasyon: canlı yayın öncesi/sırasında/sonrasında

### Yayın öncesi kontrol

- [ ] Windows güncellemeleri, güç yönetimi ve uyku modu kontrol edildi.
- [ ] Ethernet/internet kararlı, yedek bağlantı ve ağ hatası uyarısı mevcut.
- [ ] Müzik ve tüm varlıkların yayın hakkı doğrulandı.
- [ ] TikTok LIVE Studio izinleri, kategori ve moderasyon düzeni hazır.
- [ ] Oyun sahnesi doğru 9:16; 30/60 FPS hedefe göre ölçüldü.
- [ ] İsimler, mesajlar, NPC etiketleri ve güvenli alan kontrol edildi.
- [ ] `katıl` simülasyon testi ve hediye mock testi geçti.
- [ ] TikTok gerçek bağlantı durumu ve son olay zamanı doğrulandı.
- [ ] Gözetim, moderatör veya erişilebilir uzaktan kontrol mevcut.

### Yayın sırasında

- [ ] Bağlantı, FPS, bellek ve saatlik döngü durumunu izle.
- [ ] İçerik/yorum moderasyonu yap; gerekli durumlarda otomatik katılımı kapat.
- [ ] Ciddi hata halinde güvenli sahneye geç; yayın yazılımını kontrollü durdur.
- [ ] İzleyicilere katılımın ücretsiz olduğu, hediyelerin isteğe bağlı olduğu açıkça gösterilir.

### Yayın sonrası

- [ ] Oturum özeti, çökme raporu, FPS/memory p95, yorum ve hediye olayları (minimum veri) üret.
- [ ] Gereksiz kişisel verileri saklama süresi sonunda temizle.
- [ ] Kritik hata için Git issue ve test vakası aç; sonraki yayından önce düzelt.

## 12. Risk kaydı ve karşı önlemler

| Risk | Etki | Önlem |
|---|---|---|
| Resmî olmayan TikTok API değişikliği | Bağlantı kopar | Adaptör izolasyonu, uyarı, mock, alternatif sağlayıcı |
| Takip olayı gelmez | Katılım aksar | Ücretsiz `katıl` yedeği |
| Hediye streak çift sayımı | Yanlış etki/skor | Dedupe ve combo-state testleri |
| 100 oyuncuda GPU yükü | FPS düşer | LOD, instancing, animasyon uzaklık optimizasyonu, 30 FPS fallback |
| Müzik telifi | Yayın sessize alma / hak ihlali | Özgün/lisanslı kayıt ve kayıtlı izin |
| 5 saatte bellek sızıntısı | Oyun çöker | Pooling, dispose, soak testi, watchdog |
| Windows uyku/güncelleme | Yayın durur | Güç ayarları ve monitörleme |
| Saldırgan yorum/isim | Yayın ihlali | Moderasyon filtresi, metin temizleme, acil susturma |
| Sahte çevrimiçi durumu | Yayıncı yanılır | Gerçek heartbeat ve bağlantı state-machine |
| Platform moderasyonu | Yayın kısıtı | Canlı içerik ve moderatör gözetimi; kuralların takibi |
| Uzaktan panel sızıntısı | Yetkisiz kontrol | Localhost varsayılan, kimlik doğrulama, TLS/tünel |
| Ücretli büyüme için acele mimari | Karmaşıklık | Önce tek yayıncı ve bir kaliteli oyunla doğrula |

## 13. Öncelik sırası ve yaklaşık iş yükü

Önce işin en riskli bölümünü (**gerçek TikTok bağlantı fizibilitesi**) küçük bir teknik spike ile erken test etmek iyi olur; fakat tüm sistemi henüz canlı kaynağa bağımlı yapma.

| Paket | Fazlar | Kabaca efor (iş günü eşdeğeri) |
|---|---|---:|
| Çalışan yapı ve görsel oyun | 0–3 | 12–25 |
| Mock etkileşim ve gerçek bağlantı | 4–5 | 6–14 |
| Kontrol paneli ve yayın kurulumu | 6–7 | 8–18 |
| Dayanıklılık + kontrollü pilot | 8–9 | 7–15 |
| Çok oyunlu genişleme (opsiyonel) | 10 | 8–20 |

Tahminler geliştirici emeği ölçeğindedir; Codex desteğiyle değişebilir, süre garantisi değildir. 5 saatlik soak testi gerçek 5 saatlik çalışma süresi ister. **Ödeme maliyeti başlangıçta sıfıra yakın tutulabilir**, ancak alan adı, ücretli ses/model varlıkları veya yönetilen TikTok servisi sonra ek maliyet yaratabilir.

## 14. Geliştirme kararı için kapılar

**Gate A — Teknik iskelet:** Sahne + panel + mock websocket çalışır, CI yeşil.  
**Gate B — Eğlenceli oyun:** Halay/horon görseli ve ses senkronu kabul edildi.  
**Gate C — Etkileşim güvenilir:** Simülasyonda idempotency/kapasite/queue testleri geçti.  
**Gate D — Gerçek TikTok:** En az yorum ve Gül olayları gerçek yayında doğrulandı; takip sınırlaması açıkça belgelendi.  
**Gate E — Yayına hazır:** 5 saat stress/soak raporu, kritik hata sıfır, moderasyon ve kapatma kontrolü hazır.  
**Gate F — Ürün genişleme:** Pilot izleyici geri bildirimleri ve sistem ölçümleri tatmin edici; diğer oyuna geç.

Gate tamamlanmadan sonraki fazları üretime almış gibi raporlama.

## 15. Codex için ilk görev metni (kopyala/yapıştır)

```text
Bu GitHub deposu HALAY FEST projesidir. Kök dizindeki ROADMAP.md belgesini ve
legacy/v0.2/ dosyalarını oku. Sen teknik lider + kıdemli TypeScript / Three.js
mühendisisin. Şimdilik SADECE FAZ 0 ve FAZ 1'i uygula.

İstenenler:
1) Mevcut v0.2 prototipini koru, keşif raporu çıkar.
2) TypeScript monorepo yapısı (broadcaster/control-panel/live-gateway/contracts/game-core)
   ile iki ayrı çalışan pencere ve mock WebSocket bağlantısı kur.
3) 20 dk döngü, 6 NPC, 100 oyuncu, both katılım, otomatik kamera/etkinlik
   ayarlarını ortak tipe ve panel varsayılanlarına yerleştir.
4) Gerçek TikTok bağlantısını bu aşamada VARMIŞ GİBİ GÖSTERME; adapter interface
   ve mock kaynak hazırla. Gerçek bağlantıyı Faz 5'te ele alacağız.
5) Test, lint, typecheck, build ve temel Playwright smoke testi ekle.
6) README, mimari dokümanı, .env.example, AGENTS.md ve ilerleme raporu üret.
7) Kodları küçük commit'lere böl. Ne çalıştı, hangi test geçti, ne eksik açıkla.
8) Yerel çalıştırma ve LIVE Studio için sonraki adımları göster; ücretli servis açma.

Çıktı: çalışan repo + test raporu + PR/diff + sonraki faz için yapılacaklar.
```

## 16. Her faz sonunda Codex rapor şablonu

```md
# Faz X Sonuç Raporu
- Amaç:
- Değiştirilen dosyalar:
- Yapılan somut işler:
- Çalıştırma komutları:
- Testler (komut, sonuç, tarih):
- Görsel/performans kanıtı:
- Başarı kriterleri (geçti/kaldı):
- Açık risk ve kısıtlar:
- Hangi özellik gerçek, hangisi demo:
- Yeni bağımlılıklar ve lisanslar:
- Sonraki küçük görev:
```

## 17. Kaynaklar ve doğrulama referansları

- OpenAI ChatGPT Work ve Codex ayrımı: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- Codex Cloud ortamları: https://learn.chatgpt.com/docs/environments/cloud-environments
- TikTok LIVE Connector kaynak kodu ve sınırlamaları: https://github.com/zerodytrash/TikTok-Live-Connector
- Hediye streak ve sayım kuralları: https://ttlc.docs.isaackogan.com/guides/gifts/
- Three.js belgeleri: https://threejs.org/docs/
- Rapier motoru (ileride fizik oyunları için): https://rapier.rs/docs/user_guides/javascript/getting_started_js/
- TikTok LIVE hizmet koşulları ve yayın kuralları: canlıya geçmeden önce resmî güncel TikTok yardım/kurallarından tekrar doğrulanmalıdır.

---

**Ana karar:** Önce kendi bilgisayarında tek yayıncı için güvenilir, canlı bağlantılı, güzel görünen ve 5 saatlik testi geçen bir **Halay Fest** üret; ancak bundan sonra diğer oyunlar ve ticari abonelik sistemi üzerine git.