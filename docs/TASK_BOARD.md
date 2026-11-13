# Görev panosu — Faz 0

| ID | İş | Durum / kanıt |
|---|---|---|
| P0-01 | ROADMAP tamamını ve mevcut kaynakları incele | Tamamlandı; `current-system.md` |
| P0-02 | Sağlanan prototip dalını aktar, özgün baytları koru | Tamamlandı; `legacy-manifest.json`, hash testleri |
| P0-03 | legacy arşivi ve referans görüntüleri | Tamamlandı; yeni ZIP + `evidence/` PNG'leri |
| P0-04 | Git/AGENTS/geliştirme ortamı/klasör sınırları | Tamamlandı; Faz 1 paketleri uygulanmadı |
| P0-05 | Lint/typecheck/test/build ve CI | Tamamlandı; yerel 13 + 4 test, GitHub Windows/Linux/Chromium 3/3 başarılı |
| P0-06 | Mevcut/eksik özellik ayrımı | Tamamlandı; `current-system.md` |
| P0-07 | Varlık/lisans/bağımlılık/risk kaydı | Tarama tamamlandı; yayın hakkı açık risk |
| P0-08 | GitHub dalı/PR ve legacy etiketi | Tamamlandı; PR #1, `chore/phase-0-audit`, `legacy-v0.2`; bağlantılar faz raporunda |

## Sonraki fazlar — başlanmadı

Faz 1: modüler TS monorepo, React panel, ayrı Three.js sahnesi, Node API/WS, ortak şema, SQLite migration ve mock aktarım. Faz 2–10 yol haritasındaki sıralarıyla bekler. Bu teslimden sonra otomatik olarak Faz 1'e geçilmeyecek.

Teknik borçlar R01–R12 olarak `risks-and-dependencies.md` içinde izlenir. Tarihsel ZIP bulunamadı; teslim edilen kaynaklar değişmeden korunmuş ve yeni arşiv açık provenance ile oluşturulmuştur.
