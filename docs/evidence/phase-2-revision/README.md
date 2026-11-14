# Humanoid teknik inceleme kanıtları

15 Kasım 2026, Europe/Istanbul. **Profesyonel/yöresel Halay kabulü açık.**

- `humanoid-front.png`, `humanoid-side.png`: gerçek 1080×1920 Chromium sahne görüntüleri. Yandan görüşü kesen evler renderer tarafından gizlenir; PNG'ler sonradan rötuşlanmadı.
- `humanoid-106.png`: 106 teknik görsel kopya; gerçek TikTok katılımı veya tüm kalabalığın görsel kabulü değildir.
- `humanoid-cycle-av.webm`: yaklaşık 16 sn gerçek zamanlı VP8 video / Opus ses. Gerçek render, canlı teknik-kabul uyarısı ve vuruş bilgisi kayıt canvas'ında birleştirildi. Kodlanan dosya yeniden açılıp 1080×1920 olduğu, sesin 15,96 sn ve sessiz olmadığı doğrulandı. Video SHA-256: `d15180fec8de7216f0c2b39a623f62bd627e59f4d36aba3174161b0da8039cc4`.
- `humanoid-profile.json`: actual renderer/CPU/browser bilgisi, kayıt kontrolü, runtime kaynak hash'leri, 26 altılı ve 30 kalabalık örneği. Zaman UTC kaydedilir; yerel rapor Europe/Istanbul kullanır.
- `summary.json`: raw örneklerin min/medyan/max özeti. Bağımsız tüm karelerin istatistiği değildir.

Ses, `test/helpers/audio.ts` tarafından oluşturulan özgün 120 BPM perküsyon kalibrasyon kaydıdır. Gerçek halk müziği kaydı veya kullanıcı YouTube videosu kullanılmadı. Hareketler iki özgün temas mühendisliği çalışmasıdır; mocap/onaylı iki gerçek Halay figürü yerine sayılmaz. Model ve kıyafet kaynak/lisansları ana [revizyon raporundadır](../../PHASE_2_VISUAL_REVIEW.md).

Tekrar üretme (repo kökü, Node 24.13.1+):

```powershell
npm ci
npm run verify
npm run test:e2e
$env:TEST_PRODUCTION='1'
npm run test:e2e
# Gerçek GPU / yaklaşık 50 sn; software renderer kullanırsa başarısız olur:
$env:RUN_HUMANOID_PROFILE='1'
npx playwright test --project=humanoid-hardware
```

Profil testi `test-results/` altına yeni dosyalar yazar; bu tarihli kanıtları kendiliğinden değiştirmez. Testler ayrı portlar ve `data/e2e.sqlite.music` kullanır; kullanıcının normal müzik kütüphanesi hedef değildir. 10/20 dakika, 5 saat dayanıklılık veya canlı yayın testi yapılmadı. Son 106-instance kısa medyanı 40,3 FPS: 60 FPS hedefi sağlanmadı. Ayak ve avuç metrikleri modelin zorlanan ankraj işaretçileridir; mesh/insan/folklor kabulü değildir.
