# v0.2 koruma kaydı

`index.html` ve `README.md`, `codex/phase-0-prototype-import` dalındaki `fc050e019d333a2cf7698875bfba2edc79e2a537` commit'inin `halay-fest/` klasöründen **baytları değiştirilmeden** taşındı.

Asıl oyun dosyalarını bu fazda düzenlemeyin. Hash'ler ve kaynak yolları: [legacy-manifest.json](../../docs/legacy-manifest.json). CI bu manifesti kontrol eder. Oyun kodunun tür dönüşümü veya modüllere ayrılması Faz 1 ve sonrasındadır.

`halay-fest-v0.2-preserved.zip`, Faz 0 sırasında bu iki dosyadan oluşturulmuş yeni koruma arşividir. Yol haritasında bahsedilen tarihsel `halay-fest-v0.2.zip` teslim edilmedi; yeni arşiv onun yerine geçmişten gelmiş gibi sunulmaz. ZIP girişleri özgün kaynaklarla bayt düzeyinde karşılaştırıldı.

`npm run dev` bu klasörün HTML'sini yalnızca `127.0.0.1:4173` üzerinde sunar. HTML ve README dışındaki repo dosyaları servis edilmez. Three.js/fontlar internetten yüklenir. Bu sürüm yalnızca yerel simülasyondur; TikTok bağlantısı yoktur.

Referans görüntüleri, gerçek test sonuçları ve açık riskler: [Faz 0 raporu](../../docs/PHASE_0_REPORT.md).
