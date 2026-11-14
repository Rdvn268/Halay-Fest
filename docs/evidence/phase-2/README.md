# Faz 2 kanıtları

Bu klasördeki sahne/panel PNG'leri gerçek Chromium ekran görüntüleridir; görsel üretim aracıyla oluşturulmadı veya sonradan rötuşlanmadı. Kimlikler ve ses kayıtları test içindir; gerçek TikTok yayını/izleyicisi veya izinli folklor icrası değildir.

| Dosya | Anlamı |
|---|---|
| hardware-preview-6.png | Son runtime ile gerçek Radeon/D3D11, 1080×1920; ilk ısınma sonrası Halay |
| hardware-6-1080x1920.png | Aynı koşuda en az 600 gerçek saniyeden sonra Halay |
| hardware-horon-1080x1920.png | Aynı dosyada metadata ile Horon'a ölçü sınırında geçiş |
| hardware-106-1080x1920.png | 100 farklı mock oyuncu + 6 NPC; son 60 sn donanım profili sonunda |
| music-manager.png | Son production E2E: üç gerçek WAV/MP3/OGG dosyası, liste sırası, metadata ve ses/seek kontrolleri |
| music-storage-error.png | E2E'nin açıkça enjekte ettiği disk dolu yanıtı; başarılı kayıt mesajı yerine hata görünür |
| hardware-performance.json | Kanonik son donanım koşusunun ham örnekleri; renderer/browser/build index/asset manifest/worklet hash dahil |
| measurement-summary.json | Yukarıdaki donanım verisinden hesaplanan özet; altı NPC'nin ilk 30 sn örnekleri özet istatistiğinden çıkarılır |
| hardware-performance.png | Aynı ham JSON'dan matplotlib ile çizilen FPS/frame/JS heap/clock-onset grafiği; ekran görüntüsü değildir |
| software-sync-and-performance.json | Önceki SwiftShader tanı koşusu: en az 600 sn sync + 60 sn 106 rig. Son ayak/dekor/stereo düzeltmelerinden **öncedir**; final donanım performansı yerine kullanılmaz. Kendi build index'i kayıtlıdır |

Kaynak testler: `test/e2e/phase2.spec.ts`, `phase2-long.spec.ts`, `phase2-hardware.spec.ts`. Süreler Node performance.now ile gerçek zamandır; browser saati hızlandırılmaz. Standart CI, iki uzun/donanım testini bilinçli atlar; bunlar ayrı yerel opt-in koşuludur. Aynı anda yalnız bir yayın sahnesi çalıştırıldı.

Kısa unit/integration ve dev/production E2E sonuçları üst rapordadır. JS heap, process RSS veya GPU belleği değildir. Clock/onset-grid farkı akustik/OBS uçtan uca gecikmesi değildir. Hiçbir dosya beş saat dayanıklılık veya gerçek 20 dakikalık tur kanıtı sayılmaz. Donanımdaki bir koşu genel FPS garantisi oluşturmaz.

Grafiği tekrar üretmek için isteğe bağlı Python + matplotlib 3.11.2 ile depo kökünde `python scripts/plot-phase2.py` çalıştırın. Python/matplotlib, uygulama veya CI bağımlılığı değildir. Ham JSON değiştirilmeden korunur.
