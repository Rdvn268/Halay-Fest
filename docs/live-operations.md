# Yerel çalışma — Faz 1

1. npm ci, ardından npm run dev çalıştır.
2. Sahne 127.0.0.1:5173, panel 127.0.0.1:5174. Ayrı sekmelerde aç; yerel servis ve DEMO durumlarını gör.
3. Sabit demo userId ve görünen adla katıl gönder. Takip ve hediyeler yalnızca mock'tur.
4. Müziği sahnede bir kez başlat. Panelden Halay/Horon ve ses seçip kaydet. Pause/resume ve yeni tur komutları sahneye ulaşır.
5. Paneli kapat; sahne devam eder. Panel tekrar açılınca snapshot gelir. WS kopunca sahne uyarı gösterir ve tekrar dener.
6. Ctrl+C servisleri kapatır. Ayarlar SQLite'tan gelir; oyuncu/tur restart restore henüz yoktur.

Build: npm run build, npm start; sahne 4174, panel 4175. Eski referans: npm run dev:legacy → 4173 (internet/CDN gerekir).

Bu rehber canlı yayın hazırlık kabulü değildir. LIVE Studio penceresi, müzik hakları, moderasyon, gerçek TikTok, FPS ve soak/pilot sonraki fazlarda doğrulanacaktır. Bu görevde canlı hediye testi yapılmadı.
