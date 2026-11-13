# Olay sözleşmeleri — plan

Faz 0 olay servisi veya sözleşme paketi uygulamaz. Ana sözleşme `ROADMAP.md` §5.1'dir. Gelecek `contracts` paketi bunu kaynak bazlı doğrulamalı, sürümlü bir şema olarak taşıyacaktır.

Mevcut HTML'deki düğmeler doğrudan yerel fonksiyonları çağırır; `eventId`, kararlı `userId`, kaynak işareti taşıyan kanonik olay veya at-least-once idempotency yoktur. Testlerin simüle butonları işlemesi gerçek TikTok teslimi/dedupe/streak kabulü değildir.

Faz 4 öncesi test matrisi: aynı kullanıcı/olay tekrarları, kümülatif hediye streak'i, eksik final, kuyruk sınırı, Türkçe `katıl`, geçersiz payload ve açık mock/replay kaynak etiketi.
