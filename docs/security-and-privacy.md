# Güvenlik ve veri kapsamı — Faz 0

Önizleme yalnızca `127.0.0.1` adresine bağlanır, GET/HEAD ile HTML ve README sunar. Repo kökü, `.env`, kaynak klasörleri veya dosya listelemesi servis edilmez. HTTP testleri dosya kapsamını ve yazma isteği reddini doğrular. LAN erişimi, uzaktan panel, kimlik doğrulama veya internetten uygulama yayını sunulmaz.

Prototip localStorage'a oyun ayarlarını kaydeder. Testler sentetik kullanıcı adları kullanır. Gerçek kullanıcı olayı, şifre, çerez veya TikTok oturumu alınmaz. Tarayıcı Three.js ve fontlar için üçüncü taraf CDN'lere normal istek gönderir; çevrimdışı paketleme henüz yoktur.

Denetim aracı yalnızca legacy/asset ağacını okur, dosyalara yazmaz. Harici referansları indirmez; raporda URL query/fragment/credentials alanları çıkarılır. Kaynak dosyalar, manifest ve arşiv yine yayın öncesinde hassas veri açısından incelenmelidir.

Mevcut oyunda ad canvas'a, log/banner ise textContent/metin düğümleriyle yazılır. Bu kod incelemesi kapsamlı XSS/Unicode/moderasyon güvenlik testi değildir. İlerideki Node/WS için input validation, origin allowlist, erişim kontrolü, log maskeleme, saklama/silme ve backup/restore testleri yol haritasındaki fazlarda uygulanacaktır.
