# Olay ve veri sözleşmeleri — Faz 1

Kaynak: `packages/contracts/src/index.ts`. Kanonik LiveEvent ROADMAP §5.1 alanlarını taşır: eventId, source, roomId, receivedAt, type, opsiyonel sourceTimestamp/userId/displayName ve payload. Protokol sürümü 1. Genel sözleşmede mock/replay/tiktok_unofficial tanımlıdır; uygulanan tek adaptör **MockSourceAdapter**'dır.

| İstek/mesaj | Davranış |
|---|---|
| GET /api/health | Yerel servis; source=mock, tiktokStatus=unsupported |
| GET /api/state | Oyuncu/ayar/kontrol ve son 20 olay snapshot'ı |
| POST /api/mock | Strict input: chat/follow/gift/like, userId, displayName, opsiyonel eventId; chat için message, gift için izinli gift türü |
| POST /api/settings | Tam ayarlar; mevcut oyuncudan küçük kapasite reddedilir; kayıt hatası başarı sayılmaz |
| POST /api/control | pause/resume/new_round/clear_players; yerel demo |
| WS /ws | kind=snapshot veya kind=event; istemciden mutasyon kabul edilmez |

Mock kaynak kullanıcıdan kabul edilmez; sunucu source=mock, roomId=local-demo, receivedAt ve eksikse eventId üretir. Sahte TikTok bağlantı başarısı üretilmez. DisplayName React/metin/canvas ile çizilir; userId oyuncu anahtarıdır. Aynı ID'nin yeni adı bu iskelette aktif karakter adını güncellemez; profil politikası sonraki fazdadır.

`katıl` Türkçe küçük harf/trim ile işlenir; ücretsiz yorum alternatifi her modda korunur. Follow yalnızca mock'tur ve comment modunda katılım yapmaz. Gift türleri rose/heart/drum/confetti/crown/fireworks tekli korunmuş efektlerdir. Like günlüğe ulaşır; gelişmiş coşku/rule eşlemesi henüz yok.

İnbox penceresinde aynı source/roomId/eventId tekrar işlenmez; aynı userId ikinci karakter oluşturmaz. Bu temel demo davranışı tam Faz 4 dedupe/streak/kuyruk/replay/kural kabulü değildir. Kapasite dolunca olay kayda girer ama oyuncu eklenmez; FIFO henüz yoktur.

İstemci gelen WS mesajını doğrular; ilk geçerli mesajdan önce bağlı göstermez. Kapanınca en fazla 5 sn backoff ile tekrar dener, yeni snapshot'tan oyuncuları uzlaştırır. Kopukluk sırasında kaçırılan geçici hediye efektleri tekrar oynatılmaz. Kayıt ile render teslimi aynı garanti değildir; tam recovery sonraki fazlardadır.
