# HALAY FEST çalışma kuralları

- Önce `ROADMAP.md` dosyasının tamamını oku; ana gereksinim belgesidir. Kullanıcının güncel kapsamı önceliklidir.
- Mevcut görev **Faz 2**; Faz 1 kabul edildi. Dosya tabanlı müzik, beat-clock, rigged GLB ve görsel/performance doğrulamasını uygula; Faz 3'e geçme.
- Belgede bahsedilen dosyaları mevcut sayma. Eksik kaynağı ve doğrulanamayan davranışı raporla; sahte prototip veya ekran görüntüsü üretme.
- Orijinal v0.2 kaynaklarını değişiklik yapmadan `legacy/v0.2/` altında koru. Kaynak geldiğinde SHA-256 envanteri, açılış testi ve referans görüntüleri ekle; doğrulamadan `legacy-v0.2` etiketi oluşturma.
- Her faz için ayrı dal ve PR kullan; küçük commit'ler oluştur. Açık kabul kriteri varsa PR taslak olarak kalmalıdır.
- Her PR için `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` çalıştır. Faz 0 araçlarının testlerini oyun kabul testleri olarak sunma.
- `npm run check:legacy` eksik prototipte başarısız olmalıdır. Bu komut kaynak varlığını kontrol eder; oyun çalışırlığını veya fazın tamamlandığını onaylamaz.
- Gerçek TikTok, canlı hediye testi, ücretli servis veya herkese açık uygulama kurulumu bu görevin kapsamı dışındadır. Geliştirmede yalnızca açıkça etiketlenen mock/replay kullan.
- Şifre, çerez, token veya kişisel olay kaydını Git'e/loglara yazma. Yerel servislerin varsayılan adresi `127.0.0.1` olmalıdır.
- Yeni varlıkları lisans kanıtı olmadan kullanma. Üçüncü taraf bağımlılıkların sürüm/lisans/risk kaydını güncelle.
- Sonuç raporunda komutları, gerçek sonuçları, açık kabul kriterlerini ve sonraki küçük işi belirt. `ROADMAP.md` içindeki hedefleri uygulandı diye yeniden yazma.
