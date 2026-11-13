# Görev panosu — Faz 1

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

Sonraki fazlar başlanmadı: Faz 2 rig/beat/senkron kalitesi; Faz 3 ortak tur saati/FIFO/restart restore; Faz 4 tam streak/queue/rule/replay; Faz 5 gerçek TikTok; Faz 6–10 sıralarıyla bekler. Sonraki faz otomatik başlatılmaz.
