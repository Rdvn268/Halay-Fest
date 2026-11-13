# Görev panosu — Faz 2

Faz 1 kullanıcı tarafından kabul edildi. Faz 2 dalı `feat/phase-2-music-and-choreography`, henüz birleştirilmemiş `feat/phase-1-modular-runtime` üzerine kuruldu; PR tabanı Faz 1'dir. Main'e otomatik merge yapılmaz.

| ID | İş | Doğrulama / durum |
|---|---|---|
| P2-01 | Stream upload, format/süre/kota, disk + SQLite listeler | Unit/integration: kalıcılık, Range, hata, rollback, eşzamanlılık |
| P2-02 | React Müzik Yöneticisi ve sahnede dosya çalma | Gerçek WAV/MP3/OGG decoding, sıra/metadata, hata ve panel close E2E |
| P2-03 | AudioContext beat-clock, onset analizi, manuel grid | Clock/meter/BPM unit; gerçek süreli uzun test ve ham JSON |
| P2-04 | Rigged GLB, farklı Halay/Horon klipleri, IK | Gerçek asset parse/kemik hareketi; tarayıcı görüntüleri |
| P2-05 | 9:16 kamera, 100 mock + 6 NPC profili | FPS/frame/heap kaydı; hedef donanım 60 FPS kabulü açık |
| P2-06 | Profesyonel yöresel görsel/işitsel kabul | Özgün stilize başlangıç varlıkları mevcut; izinli gerçek kayıt, folklor incelemesi ve yayın donanımı doğrulaması açık |
| P2-07 | PR, rapor, CI | Açık kabul konusu varken taslak PR; güncel sonuç PHASE_2_REPORT |

**Faz 3 başlamadı.** Önce Faz 2'nin açık görsel/işitsel ve donanım kabul konuları kapatılmalıdır. Beş saatlik gerçek soak, ROADMAP Faz 8 çıkış kapısıdır; bu çalışmada tamamlanmış gösterilmez.

## Faz 1 tarihsel kayıt

Faz 0 kabul edildi; kaynaklar/ZIP/etiket ve önceki rapor korunur. PR #1 main'e merge edilmediğinden Faz 1 dalı feat/phase-1-modular-runtime, chore/phase-0-audit üzerine kuruludur.

| ID | İş | Kanıt |
|---|---|---|
| P1-01 | npm workspace + strict TS | Paket manifestleri, typecheck/build |
| P1-02 | v0.2 geometri/dans/müzik taşıma | halay-game ve özgün hareket/nota karşılaştırma testleri |
| P1-03 | Bağımsız sahne + React panel | Ayrı URL, panel kapanma E2E |
| P1-04 | Node API/WS + mock adaptörü | Gerçek soket, şema/origin testleri |
| P1-05 | Oyuncu/olay/ayar modelleri | contracts ve game-core testleri |
| P1-06 | SQLite migration/ayar/olay kaydı | Migration/reopen/bounded log testleri |
| P1-07 | Dev ve build önizlemesi | dev/build/start, dev/prod E2E |
| P1-08 | GitHub PR/CI/rapor | PHASE_1_REPORT.md ve PR kontrolleri; açık kriter varsa taslak |

Kabul kapısı: panel kapanınca sahne devam eder; mock olay panelden sahneye gerçek WS ile ulaşır; typecheck/build/testler geçer. Güncel sonuç Faz 1 raporu ve PR kontrollerindedir.

Faz 1 sonundaki sırada Faz 2 rig/beat/senkron kalitesi bekliyordu; bu dalda yukarıdaki işlerle ele alındı. Faz 3 ortak tur saati/FIFO/restart restore; Faz 4 tam streak/queue/rule/replay; Faz 5 gerçek TikTok ve Faz 6–10 sıralarıyla bekler. Sonraki faz otomatik başlatılmaz.
