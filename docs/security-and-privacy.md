# Güvenlik ve veri — Faz 1

Node/Vite yalnızca 127.0.0.1'de dinler. API/WS tam origin allowlist ve gateway Host kontrolü kullanır. Mutasyonlar JSON + strict Zod + 16 KiB sınırından geçer; servis genelinde dakikada 120 demo mutasyon sınırı vardır. WS salt okunur, maxPayload 16 KiB ve yavaş tüketici buffer sınırı vardır. Origin'siz yerel CLI istekleri kabul edilir; bu yerel kullanıcı kimlik doğrulaması değildir.

SQLite/.env Git dışındadır. Yalnızca mock kimlikler kullanılır; en fazla 1000 kayıt ve açılışta 24 saat saklama. WS görünümü son 20 olaydır. Raw body/SQLite iç hatası/şifre/çerez loglanmaz. E2E data/e2e.sqlite; entegrasyon testleri bellek/geçici dosya kullanır.

Ad/yorumlar React/metin/canvas ile sunulur. Statik broadcaster şablonuna kullanıcı HTML'si enjekte edilmez. Bu kapsamlı Unicode/moderasyon/XSS güvenlik kabulü değildir.

Gerçek TikTok hesabı bağlanmadı, şifre/çerez istenmedi, gerçek hediye testi veya herkese açık kurulum yapılmadı. Vite preview yerel build doğrulamasıdır. Kimlik doğrulamalı LAN, CSRF/TLS/uzaktan erişim, backup/restore/silme aracı ve tam saklama politikası sonraki fazlarda uygulanmalıdır.
