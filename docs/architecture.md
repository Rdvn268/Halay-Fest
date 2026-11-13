# Mimari hazırlık — Faz 0

Çalışan sistem tek HTML + tarayıcı localStorage + CDN Three.js + Web Audio'dur. Node önizleme sunucusu yalnızca korunmuş dosyaları localhost üzerinde sunar; oyun backend'i değildir. TypeScript build'i yalnızca denetim ve sunucu araçlarını derler.

`apps/`, `services/`, `packages/` klasörleri yalnızca amaçlarını anlatan README'ler içerir. npm workspaces ve paket sınırları Faz 1'de gerçek kodla birlikte kurulacaktır. Boş paketleri çalışır modüller gibi göstermiyoruz.

| Hedef sınır | Sorumluluk | Uygulama fazı |
|---|---|---|
| broadcaster | Three.js görüntüleme; panel kapanmasına dayanıklılık | 1–2 |
| control-panel | Vite/React yönetim görünümü | 1, 6 |
| live-gateway | Node API, WebSocket, kaynak adaptörü | 1; gerçek TikTok 5 |
| contracts | Sürümlü DTO ve doğrulama şemaları | 1 |
| game-core | Saf durum, döngü, oyuncu/kuyruk | 1, 3 |
| event-engine | Ingest, dedupe, streak, kurallar | 4 |
| halay-game | Meydan, dans, beat clock, kamera | 2–3 |
| ui | Ortak panel bileşenleri | 1, 6 |
| desktop / game-sdk | Windows dağıtımı / çok oyun desteği | 7 / 10 |

Geçiş stratejisi: `legacy/v0.2/` değişmez referans olarak kalır. Yeni kod ayrı hedeflerde kurulur; mevcut animasyon/sentez/döngü davranışları regresyon kanıtlarıyla karşılaştırılır. Sahne, yönetim ve bağlantı ileride ayrı süreç/sayfa olur; mock yolu korunur. Olay/ayarların sunucuda doğrulanması ve sınırlı kuyruk, gerçek TikTok'tan önce uygulanır. SQLite migration ve tek komutlu modüler başlatma bu fazın teslimi değildir.

Yol haritası varsayılanları: 20 dakika, 6 NPC, 100 gerçek oyuncu, `both`, otomatik tur/kamera/etkinlik açık, hedef 1080×1920. Bunlar mevcut kod ve belgede korunur; ortak TS şeması henüz eklenmedi.
