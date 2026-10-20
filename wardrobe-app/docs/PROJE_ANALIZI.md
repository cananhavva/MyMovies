# Proje Analizi – AI Gardırop Asistanı

> Hazırlayan: Agent 4 – Proje Analizi · Tarih: 20.10.2026 · Durum: Taslak v1
> Platform: iOS + Android · Teknoloji: Expo (React Native) + TypeScript, ince backend proxy üzerinden Claude API (vision)

Not: Fiyat, API kuralı ve rakip bilgileri hızlı değişir. "Doğrulanmalı" diye işaretlenen maddeler geliştirme başlamadan önce resmi kaynaklardan yeniden kontrol edilmelidir.

---

## 1. Özet ve Değer Önerisi

**Ürün tek cümlede:** Kullanıcının gardırobunu fotoğraf ve ürün linkinden dijitalleştiren, her parçayı mevsim, hava ve ortama göre etiketleyip kumaş kalitesini puanlayan, ardından takip ettiği influencer'ların kombinlerini kendi dolabındaki parçalarla yeniden kuran ve eksik parçaları gösteren bir yapay zeka stil asistanı.

**Değer önerisi:**

| Kullanıcının sorunu | Uygulamanın çözümü |
|---|---|
| "Dolabım dolu ama giyecek bir şeyim yok" | Dijital gardırop ve hava durumuyla ortama göre kombin önerisi |
| Influencer'ın kombinini beğeniyor ama nasıl uygulayacağını bilmiyor | **Influencer → gardırop eşleştirme:** "Bu görünümü dolabındaki şu 3 parçayla yapabilirsin" |
| Gereksiz veya kalitesiz alışveriş | **Kumaş kalitesi analizi:** doğal ve sentetik elyaf oranı, dayanıklılık ve fiyat/kalite yorumu |
| Ne alması gerektiğini bilmiyor | **Eksik parça analizi:** "Takip ettiğin 4 influencer'ın kombinlerinin %38'inde siyah trençkot var, sende yok" ve kapsül gardırop planı |

**Farklılaştırıcı üçlü:** (1) influencer kombinini gardıroba eşleştirme, (2) ürün linkinden materyal ve kalite analizi, (3) veriye dayalı eksik parça ve kapsül planı. Rakiplerin hiçbiri bu üçünü bir arada sunmuyor (bkz. Bölüm 2).

### Hedef Kitle ve Personalar

| Persona | Profil | Temel motivasyon | Kritik özellik |
|---|---|---|---|
| **Elif, 27, "İlham avcısı"** | İstanbul, beyaz yaka, günde 1 saatten fazla Instagram/Pinterest, 5–10 moda influencer'ı takip ediyor | Beğendiği görünümleri pahalıya kaçmadan uygulamak | Influencer eşleştirme, eksik parça |
| **Deniz, 34, "Bilinçli tüketici"** | Sürdürülebilirlik odaklı, polyesterden kaçınıyor, az ama iyi alıyor | Kaliteli ve uzun ömürlü parçalar, kapsül gardırop | Materyal analizi, kapsül planı |
| **Mert, 30, "Pratik profesyonel"** | Ofis ve hafta sonu doğa yürüyüşü, karar yorgunluğu yaşıyor | Sabah 2 dakikada uygun kombin | Hava ve ortam bazlı öneri |
| **Zeynep, 22, "Öğrenci / bütçe"** | Fast-fashion ağırlıklı, TikTok kullanıcısı | Trendleri az parayla yakalamak | Dolaptan yeniden kurma, ucuz alternatif |

**Birincil pazar:** Türkiye (TR dil desteği, Trendyol, Hepsiburada ve Zara TR linkleri). **İkincil pazar:** AB ve ABD (İngilizce; LTK ekosistemi ağırlıklı olarak ABD'de). Çekirdek kitle 18–40 yaş, ağırlıklı olarak kadın, sosyal medyada aktif kullanıcılardır.

---

## 2. Pazar ve Rakip Analizi

**Pazar bağlamı:** Dijital gardırop ve AI stil uygulamaları 2024–2026 döneminde hızla çoğaldı. Arka plan kaldırma ve otomatik etiketleme artık standart hale geldi. Kullanıcıların en büyük şikâyeti **onboarding yorgunluğu**, yani yüzlerce parçayı tek tek fotoğraflamak. Bu yüzden link ile ekleme ve toplu fotoğraf yükleme kritik önemde. Para kazanma tarafında sektör genelinde affiliate ve abonelik karması kullanılıyor.

| Uygulama | Ne yapıyor | Gelir modeli | Zayıf yön / boşluk |
|---|---|---|---|
| **Whering** (UK) | Ücretsiz dijital gardırop, arka plan kaldırma, kombin oluşturma, "dupes" ve alışveriş, istatistikler | Ücretsiz, affiliate ve marka iş birlikleri | Influencer kombinini dolaba eşleştirme ve materyal kalitesi analizi yok |
| **Indyx** (ABD) | Gardırop dijitalleştirme, insan stilistler ("Archivist") dolabı sizin yerinize yükler, ikinci el satış | Freemium ve ücretli insan hizmeti | Ölçeklenmesi pahalı, ABD odaklı |
| **Acloset** (Kore) | AI otomatik etiketleme (kategori, renk, mevsim), hava durumuna göre öneri, ikinci el pazar yeri | Freemium ve abonelik | Influencer ve kalite analizi yok |
| **Stylebook** (iOS) | Klasik manuel dolap ve kombin takvimi, istatistikler | Tek seferlik ücret | Android yok, AI yok, eski arayüz |
| **Cladwell** | Kapsül gardırop odaklı, günlük kombin önerisi | Abonelik | Görsel dijitalleştirme zayıf, sosyal ilham yok |
| **Pureple** | Kombin planlayıcı, takvim, seyahat paketi | Freemium | Basit AI, ilham kaynağı entegrasyonu yok |
| **Alta** | AI stilist, avatar üzerinde deneme, kişisel asistan sohbeti; yatırım almış yeni oyuncu | Freemium ve affiliate | En yakın rakip; influencer eşleştirme kısmen benzeyebilir, takip edilmeli |
| Diğerleri | Smart Closet, Save Your Wardrobe, Combyne, OpenWardrobe, Fits; ayrıca ChatGPT/Gemini ile "kendin yap" stil sohbeti | — | Genel AI asistanları dolap hafızası tutmuyor |

**Konumlandırma:** "Dijital dolap" alanı kalabalık ve tek başına farklılaşma sağlamıyor. Farklılaşma şu üç iş akışında:
1. **İlhamdan aksiyona:** influencer içeriği → parça tespiti → dolaptaki karşılığı → eksik varsa satın alma linki.
2. **Kalite bilinci:** ürün linkindeki kompozisyon ("%100 pamuk" veya "%65 polyester") → kalite skoru ve "aynı görünüme daha kaliteli alternatif" önerisi.
3. **Eksik parça ve kapsül planlama:** tekil öneriler yerine birikmiş ilham verisinden istatistiksel çıkarım.

**Rekabet riski:** Whering ve Alta bu özellikleri birkaç ay içinde kopyalayabilir. Savunulabilirlik veride (kullanıcının dolabı ve ilham geçmişi), TR pazarına uyumda (yerel e-ticaret siteleri ve TR kumaş terminolojisi) ve kullanıcı deneyiminin hızında yatıyor.

---

## 3. Gereksinimler

### 3.1 Fonksiyonel Gereksinimler

| ID | Gereksinim | Öncelik |
|---|---|---|
| F-01 | Hesap oluşturma (Apple ile giriş, Google ile giriş, e-posta) ve **uygulama içinden hesap silme** | MVP |
| F-02 | Kamera veya galeriden parça fotoğrafı ekleme, toplu yükleme, arka plan kaldırma | MVP |
| F-03 | Ürün linkinden parça ekleme: başlık, görsel, fiyat, marka, **materyal kompozisyonu** çıkarımı | MVP |
| F-04 | AI otomatik etiketleme: kategori, renk, desen, mevsim, hava uygunluğu (sıcaklık aralığı, yağmur), ortam (ofis, gece, yürüyüş, spor, düğün…), stil | MVP |
| F-05 | Tüm AI etiketlerinin **manuel düzenlenebilmesi**; kullanıcı düzeltmesi kaydedilir (geri bildirim verisi) | MVP |
| F-06 | Materyal kalite skoru (doğal/yarı sentetik/sentetik oranı, açıklama ve uyarı) | MVP |
| F-07 | Hava durumu ve ortama göre günlük kombin önerisi | MVP |
| F-08 | İlham ekleme: ekran görüntüsü veya paylaşım menüsünden gönderi; v2'de profil linki | MVP (görsel), v2 (profil) |
| F-09 | İlham görselindeki parçaların tespiti ve **dolaptaki en yakın eşleşmeler** (benzerlik skoruyla) | MVP |
| F-10 | Parçanın nereden olduğunu bulma: görsel ürün araması ve affiliate kataloglarında eşleştirme | v2 |
| F-11 | Eksik parça analizi: birden fazla ilham görselinde tekrar eden ve dolapta olmayan parçalar | v2 |
| F-12 | Kapsül gardırop planlayıcı: hedef parça sayısı, kombin çarpanı, satın alma listesi | v2 |
| F-13 | Kombin takvimi ve giyim geçmişi (kullanım başına maliyet) | v2 |
| F-14 | Influencer profil takibi (yeni gönderilerde bildirim) | v3 (API kısıtlarına bağlı) |
| F-15 | Satın alma linkleri ve affiliate açıklaması (etiket ve bilgilendirme) | v2 |
| F-16 | Verileri dışa aktarma (KVKK/GDPR taşınabilirlik hakkı) | v2 |

### 3.2 Fonksiyonel Olmayan Gereksinimler

| Alan | Gereksinim |
|---|---|
| **Performans** | Tek parça analizi p95 süresi 8 saniyenin altında, arayüz iyimser güncelleme ve iskelet ekranla akmalı. Toplu yükleme arka planda kuyrukla işlenmeli. |
| **Maliyet kontrolü** | Görseller istemcide yeniden boyutlanmalı (uzun kenar en fazla 1024 px, JPEG/WebP). Kullanıcı başına günlük AI kotası ve önbellek kullanılmalı (aynı ürün linki tek kez analiz edilir). |
| **Güvenlik** | API anahtarı **asla istemcide tutulmaz**, tüm AI çağrıları backend proxy üzerinden gider. Kimlik doğrulama JWT ile yapılır, istek oranı sınırlanır, girdiler doğrulanır. SSRF'e karşı link çekme bir izin listesi ve özel ağ engelleme ile korunur. |
| **Gizlilik** | Veri minimizasyonu uygulanır, yüz içeren ilham görselleri için saklama süresi sınırlı olur. Saklanan veri şifrelenir, kullanıcı tüm verisini silebilir. |
| **Erişilebilirlik** | VoiceOver ve TalkBack etiketleri, dinamik yazı boyutu, renk körlüğüne uygun renk adları (renk yalnızca görsel değil metin olarak da gösterilir). |
| **Yerelleştirme** | TR ve EN, metrik/imperial ölçü birimleri, TR kumaş terimleri (ör. "viskon", "elastan"). |
| **Çevrimdışı** | Dolap ve kombinler çevrimdışı görüntülenebilir, AI işlemleri çevrimiçi kuyruğa alınır. |
| **Gözlemlenebilirlik** | Hata izleme (ör. Sentry), AI çağrı başına token ve maliyet loglanır, etiket düzeltme oranı ölçülür. |
| **Bakım** | Expo EAS Build ve OTA güncelleme kullanılır, AI çıktıları JSON şemasıyla yapılandırılır (structured outputs). |
| **Ölçeklenebilirlik** | Sunucusuz ya da yönetilen backend tercih edilir, görseller nesne depolama ve CDN üzerinden sunulur. |

---

## 4. Teknik Fizibilite ve Riskler

### 4.1 Genel Fizibilite Değerlendirmesi

| Bileşen | Fizibilite | Not |
|---|---|---|
| Fotoğraftan parça etiketleme (vision) | **Yüksek** | Claude vision kategori, renk, mevsim ve ortam etiketlemede güçlü. Kullanıcı düzeltmesi zaten tasarımda var. |
| Arka plan kaldırma | Yüksek | Cihaz üzerinde (iOS Vision "subject lifting" veya ML Kit) ya da sunucuda açık kaynak modelle (ör. rembg) yapılabilir. |
| Ürün linkinden materyal okuma | **Orta** | Sitelerin çoğu bot engelliyor (aşağıya bakın). JSON-LD/schema.org verisi bazen yeterli oluyor, bazen kompozisyon yalnızca görselde veya JS ile yükleniyor. |
| İlham görselinden dolap eşleştirme | **Orta-Yüksek** | Önce AI parçaları yapılandırılmış özniteliklere çevirir, sonra öznitelik ve görsel embedding benzerliği hesaplanır. "Birebir aynı" değil "benzer" eşleşme vaat edilmeli. |
| Influencer parçasının **kaynağını bulma** | **Düşük-Orta** | Görsel ürün aramasının resmi ve ucuz bir API'si az. LTK/ShopMy linkleri varsa çok daha kolay. |
| Influencer **profilini otomatik çekme** | **Düşük (hukuki ve teknik)** | Bkz. 4.2. MVP'de kapsam dışı tutulmalı. |
| Eksik parça analizi | Yüksek | İlham parçaları ve dolap etiketleri hazırsa basit istatistik ve LLM özetiyle yapılabilir. |

### 4.2 Sosyal Medya Erişimi: En Büyük Risk

| Platform | Resmi erişim | Kısıtlar | Öneri |
|---|---|---|---|
| **Instagram** | Instagram Graph API (Business/Creator hesaplar). "Basic Display API" Aralık 2024'te kapatıldı. **Business Discovery** uç noktası, uygulamanın bağlı bir Business hesabı üzerinden *başka bir Business/Creator hesabının* herkese açık gönderilerini kullanıcı adıyla okuyabilir. | Meta App Review gerekir. Kişisel hesaplar okunamaz. Kullanım oranı sınırlıdır (BUC, yaklaşık 200 çağrı/saat/kullanıcı mertebesinde, **doğrulanmalı**). Verinin depolanması ve görüntülenmesi Platform Terms'e tabidir. oEmbed çıktısı yıllar içinde daraltıldı (thumbnail kaldırıldı, **doğrulanmalı**). | Influencer'ların çoğu Creator hesabı olduğu için Business Discovery **gri değil, resmi** bir yol. Ancak App Review'da kullanım amacı net anlatılmalı. MVP'de **kullanıcının kendi ekran görüntüsü veya paylaşım menüsüyle** başlanmalı. |
| **TikTok** | Login Kit ve Display API yalnızca **oturum açan kullanıcının kendi** videolarını verir. Research API sadece akademik ve kâr amacı gütmeyen kurumlara açık. Embed/oEmbed tekil video için kullanılabilir. | Üçüncü kişi profillerini resmi yoldan listelemek mümkün değil. | Paylaşım menüsü veya video linki → oEmbed ile kapak görseli → kullanıcı onaylı kare yakalama. |
| **Pinterest** | API v5: kullanıcının **kendi** pano ve pin'leri OAuth ile okunabilir. Uygulama onayı gerekir (trial → standard erişim). | Başkasının panosunu toplu okumak sınırlı. | "Pinterest panonu bağla" iyi bir ilham kaynağıdır ve ToS'a uygundur. **MVP+ için en temiz entegrasyon budur.** |
| **LTK (LIKEtoKNOW.it)** | Herkese açık bir geliştirici API'si yok (creator ve marka programları kapalı). | Scraping ToS ihlali riski taşır. | Kullanıcı LTK ürün linkini paylaşırsa link → ürün sayfası akışı izlenir. LTK/ShopMy ile ileride iş ortaklığı değerlendirilebilir. |

**Scraping hukuki notu:** ABD'de *hiQ v. LinkedIn* ve *Meta v. Bright Data* (2024) davaları oturum açmadan herkese açık veriyi kazımanın ToS ihlali sayılmayabileceğini gösterse de durum (a) ülkeye göre değişir, (b) hesap ile oturum açarak kazıma kesin ToS ihlalidir, (c) Meta ve TikTok teknik olarak agresif engelleme yapar (IP ban, giriş duvarı, oran sınırı), (d) **App Store ve Google Play, üçüncü taraf ToS ihlali içeren uygulamaları reddedebilir** (Apple 5.2.2 / 5.2.3). Ayrıca kazınan görsellerde influencer'ın **kişisel verisi ve telif hakkı** bulunur. **Karar önerisi:** Profil kazıma yapılmamalı. Bunun yerine (1) kullanıcının paylaştığı tekil gönderi ve ekran görüntüleri, (2) Instagram Business Discovery (resmi yol), (3) Pinterest OAuth kullanılmalı.

### 4.3 E-ticaret Linkleri

- Zara, H&M, Trendyol ve benzeri büyük siteler Cloudflare/Akamai bot korumaları, JS ile render, coğrafi yönlendirme ve oran sınırı kullanıyor. Basit sunucu `fetch` çağrıları sık sık 403 hatası veya boş HTML döndürecek.
- **Öncelik sırası:** (1) Sayfadaki `application/ld+json` Product şeması ve OpenGraph etiketleri, (2) affiliate ağlarının ürün feed'leri (Trendyol/Hepsiburada partner programları, Amazon Associates, Awin, Rakuten, CJ). Feed'ler kompozisyon alanını çoğu zaman içerir ve **yasal bir veri kaynağıdır**. (3) Ticari scraping API'leri (maliyetli, ToS açısından gri). (4) **Yedek akış:** "Ürün sayfasının ve etiket fotoğrafının ekran görüntüsünü yükle", ardından AI kompozisyonu görselden okur. Bu yedek akış **çamaşır etiketi fotoğrafı** için de çalışır ve güçlü bir özelliktir.
- Telif: Ürün görselleri markalara aittir. Önizleme amaçlı ve kaynak linkiyle göstermek yaygın bir uygulamadır, ancak toplu yeniden yayınlamaktan kaçınılmalı.

### 4.4 Görsel Ürün Arama ("Bu parça nereden?")

- Google Lens'in resmi bir API'si yok, Bing Visual Search ise Bing Search API'leriyle birlikte 2025'te emekliye ayrıldı (**doğrulanmalı**). Üçüncü taraf "Lens wrapper" servisleri ToS açısından risklidir.
- Alternatifler: moda odaklı görsel arama API'leri (ör. Lykdat, Syte; ücretli B2B), **kendi embedding indeksimiz** (affiliate feed'lerinden ürün görselleri ile CLIP benzeri embedding ve vektör veritabanı). Ölçeklenebilir ve affiliate gelirine doğrudan bağlı olduğu için v2'nin önerilen mimarisi budur.
- Dürüst ürün dili kullanılmalı: "Tam bu ürün" yerine "benzer ürünler" denmeli. Influencer kendi LTK/ShopMy/affiliate linkini paylaştıysa önce o kullanılmalı.

### 4.5 AI Doğruluğu

| Görev | Beklenen doğruluk | Risk ve önlem |
|---|---|---|
| Kategori, renk | Yüksek | Ton farkları (lacivert/siyah) için kullanıcı düzeltmesi sağlanmalı. |
| Mevsim, ortam | Orta-Yüksek (öznel) | Çoklu etiket ve güven skoru kullanılmalı, düzeltmeler kişiselleştirme olarak kaydedilmeli. |
| Fotoğraftan **materyal tahmini** | **Düşük-Orta** | Görselden kumaş cinsi güvenilir şekilde anlaşılamaz. Yalnızca etiket veya ürün sayfası verisi "kesin", görsel tahmini "tahmini" diye gösterilmeli. |
| Kalite yargısı | Orta | "Doğal elyaf = kaliteli" basitleştirmesi her zaman doğru değildir (ör. teknik outdoor kumaşlarında polyester avantajlıdır). Kural tabanlı skor ve AI açıklaması birlikte kullanılmalı, ortama göre bağlam verilmeli (yürüyüşte sentetik kumaş iyi olabilir). |
| İlham → dolap eşleşmesi | Orta | Kalabalık arka planlar, kısmi görünen parçalar ve filtreler sorun çıkarır. İlk 3 aday ve kullanıcı onayı gösterilmeli. |

- **Değerlendirme seti:** Yayından önce 300–500 etiketli parça ve 100 ilham görselinden oluşan bir test seti hazırlanmalı. Prompt ve model değişiklikleri bu sette ölçülmeli.
- AI çıktısı JSON şemasıyla zorunlu kılınmalı (structured outputs). Model reddi veya hata durumu ele alınmalı (`stop_reason` kontrolü).

### 4.6 Gizlilik: KVKK ve GDPR

- **İşlenen veriler:** hesap bilgisi, gardırop fotoğrafları (ayna selfie'si, yüz, ev içi ortam), konum (hava durumu için, şehir düzeyi yeterli), stil tercihleri, influencer görselleri (**üçüncü kişinin** kişisel verisi).
- **KVKK:** aydınlatma metni, açık rıza (özellikle yurt dışına aktarım için), VERBİS kaydı (eşik ve muafiyet kontrol edilmeli). Claude API ve bulut hizmetleri yurt dışında olduğundan **yurt dışına veri aktarımı** konusunda 2024 değişikliği sonrası standart sözleşme ve Kurul'a bildirim yükümlülüğü değerlendirilmeli (**hukukçu görüşü alınmalı**).
- **GDPR (AB kullanıcıları):** hukuki dayanak (sözleşme veya rıza), DPA (Anthropic ve hosting sağlayıcılarıyla), silme ve taşınabilirlik hakları, gerekirse AB temsilcisi. Yüz görüntüleri biyometrik tanımaya kullanılmadığı sürece özel nitelikli veri sayılmaz. **Yüz tanıma yapılmamalı.**
- **Önlemler:** Yükleme öncesi isteğe bağlı yüz bulanıklaştırma ve kırpma, ilham görselleri için saklama süresi sınırı (ör. analiz sonrası yalnızca türetilmiş özniteliklerin saklanması), EXIF/GPS metadata'sının silinmesi, 13 yaş altı (GDPR'da ülkeye göre 16) kullanıcıların engellenmesi.
- Anthropic API verileri varsayılan olarak model eğitiminde kullanılmaz. Saklama süreleri ve DPA koşulları güncel ticari şartlardan **doğrulanmalı**.

### 4.7 App Store ve Google Play Kuralları

| Kural | Etki | Aksiyon |
|---|---|---|
| **Apple 5.1.1(v): Hesap silme** | Hesap oluşturulabiliyorsa uygulama içinden silme zorunlu | F-01'de var, verilerin gerçekten silindiğinden emin olunmalı |
| **Apple 5.1.1 / 5.1.2: Veri toplama ve paylaşım** | Gizlilik politikası linki, App Privacy "nutrition label", amaç dışı kullanım yasağı | AI sağlayıcısına veri gönderimi etikette ve politikada belirtilmeli |
| **Apple 5.1.2(i): Üçüncü taraf AI'ya veri gönderimi** (2025 güncellemesi) | Kişisel verilerin üçüncü taraf AI'ya gönderilmesi **açıkça belirtilmeli ve izin alınmalı** | İlk analizden önce onay ekranı: "Fotoğrafların analiz için Anthropic'e gönderilir" |
| **Apple 4.8: Sign in with Apple** | Üçüncü taraf sosyal giriş varsa eşdeğer gizlilik odaklı bir seçenek sunulmalı | Apple ile giriş eklenmeli |
| **Apple 5.2: Fikri mülkiyet** | Influencer ve marka içeriğini izinsiz kullanmak ret sebebi olabilir | Kaynak gösterilmeli, profil kazıma yapılmamalı |
| **Apple 1.2 / Google UGC politikası** | Kullanıcı tarafından üretilen içerik varsa bildirme ve engelleme mekanizması gerekir | MVP'de sosyal paylaşım olmadığı için düşük risk, v3'te sosyal özellikler gelirse gerekli |
| **Google Play: Data Safety ve hesap silme** | Data Safety formu, uygulama içi ve **web üzerinden** hesap silme linki zorunlu | Web'de silme sayfası hazırlanmalı |
| **Google Play: AI-generated content politikası** | Üretken AI içeriği için kullanıcıya bildirme ve geri bildirim imkânı | "Bu öneriyi bildir" butonu eklenmeli |
| **Apple 3.1.1: Uygulama içi satın alma** | Dijital abonelikler IAP ile satılmalı (ABD'de harici link istisnaları var) | RevenueCat ile IAP kullanılmalı |
| **Affiliate linkleri** | Fiziksel ürün satışı IAP'ye tabi değil, affiliate serbest | Açıklama zorunlu (aşağıda) |

### 4.8 Affiliate Açıklaması

- **TR:** Ticaret Bakanlığı Reklam Kurulu'nun "Sosyal Medya Etkileyicileri Tarafından Yapılan Ticari Reklam ve Haksız Ticari Uygulamalar Hakkında Kılavuz"u (2021) ve 6502 sayılı Kanun kapsamında gizli reklam yasağı geçerli. Öneri kartlarında "Reklam / Affiliate bağlantısı" etiketi gösterilmeli.
- **ABD:** FTC Endorsement Guides gereği açık ve görünür bildirim yapılmalı. Amazon Associates kuralları ayrıca kendi bildirim metnini zorunlu tutuyor.
- **AB:** Haksız Ticari Uygulamalar Direktifi ve DSA şeffaflık kuralları geçerli.
- **Güven ilkesi:** Kalite skoru affiliate komisyonundan **bağımsız** olmalı ve bu kullanıcıya açıkça söylenmeli. Aksi halde "kalite analizi" özelliğinin güvenilirliği yok olur.

### 4.9 Risk Matrisi

| # | Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|---|
| R1 | Instagram/TikTok erişiminin kısıtlanması veya App Review reddi | Yüksek | Yüksek | Ekran görüntüsü/paylaşım menüsü öncelikli akış, resmi API'ler opsiyonel |
| R2 | E-ticaret sitelerinin bot engeli | Yüksek | Orta | JSON-LD, affiliate feed'leri, ekran görüntüsü ve etiket fotoğrafı yedeği |
| R3 | AI maliyetinin gelirden hızlı büyümesi | Orta | Yüksek | Görsel küçültme, ucuz model ile triage, önbellek, kota, batch işleme |
| R4 | Yanlış etiket ve eşleşmelerin güveni düşürmesi | Orta | Orta | Güven skoru, kolay düzeltme, değerlendirme seti |
| R5 | KVKK/GDPR uyumsuzluğu | Orta | Yüksek | Hukuki inceleme, DPA, veri minimizasyonu |
| R6 | Rakiplerin özelliği kopyalaması | Orta | Orta | TR odaklanma, hızlı yineleme, veri birikimi |
| R7 | Onboarding yorgunluğu (düşük aktivasyon) | Yüksek | Yüksek | Toplu yükleme, sipariş e-postasından/linkten içe aktarma, "ilk 10 parça" hedefi |
| R8 | Telif ve influencer şikâyeti | Düşük-Orta | Orta | Kaynak gösterme, kaldırma talebi süreci, kişisel kullanım çerçevesi |

---

## 5. Maliyet Tahmini

### 5.1 AI API Maliyeti (Claude, Ekim 2026 liste fiyatları)

| Model | Girdi $/1M token | Çıktı $/1M token | Kullanım önerisi |
|---|---|---|---|
| Claude Haiku 5.5 | 0,10 | 0,50 | Toplu parça etiketleme, link metninden kompozisyon çıkarımı |
| Claude Sonnet 5.5 | 2,00 | 10,00 | İlham görseli ayrıştırma, eşleştirme gerekçesi, eksik parça raporu |
| Claude Opus 5.5 | 4,00 | 20,00 | Zor durumlar ve değerlendirme setinde referans/hakem |

**Varsayımlar:** Görsel uzun kenarı yaklaşık 1024 px olduğunda görsel başına yaklaşık 1.000–1.600 girdi tokenı (token ≈ genişlik × yükseklik / 750). Sistem promptu ve şema yaklaşık 1.000 token (prompt caching ile büyük kısmı ucuzlar). Çıktı JSON'u yaklaşık 400–600 token. Thinking tokenları ek maliyet getirir, basit etiketlemede düşük effort kullanılmalı.

| İşlem | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
|---|---|---|---|
| 1 parça analizi (1 görsel, yaklaşık 2,6K girdi ve 0,5K çıktı) | **~0,0005 $** | ~0,01 $ | ~0,02 $ |
| 100 parçalık dolap onboarding | ~0,05 $ | ~1 $ | ~2 $ |
| 1 ilham görseli ayrıştırma ve dolapla eşleştirme (aday listesi metin olarak verilir, yaklaşık 6K girdi ve 1K çıktı) | ~0,001 $ | ~0,02 $ | ~0,045 $ |
| Eksik parça raporu (30 ilham, öznitelikler metin olarak, yaklaşık 15K girdi ve 2K çıktı) | ~0,0025 $ | ~0,05 $ | ~0,10 $ |

- **Batch API** acil olmayan toplu işlerde (ör. gece onboarding kuyruğu) yaklaşık %50 indirim sağlar. **Prompt caching** sabit sistem promptunu ucuzlatır.
- **Kullanıcı başı aylık AI maliyeti tahmini:** onboarding sonrası aktif bir kullanıcı ayda yaklaşık 20 yeni parça ve 30 ilham analizi yapar. Karma model kullanımıyla bu **0,10–0,80 $/ay** eder. Ücretsiz katmanda kota şarttır.
- Fiyatlar değişebilir, maliyet her çağrıda `usage` alanından loglanmalı.

### 5.2 Altyapı ve Diğer Giderler (aylık, yaklaşık)

| Kalem | MVP (≤1K MAU) | Büyüme (~50K MAU) |
|---|---|---|
| Backend (Supabase / Firebase / Cloud Run gibi yönetilen servisler) | 0–25 $ | 100–400 $ |
| Görsel depolama ve CDN (kullanıcı başı ~100 görsel × ~200 KB ≈ 20 MB) | <5 $ | 50–150 $ |
| Vektör arama (pgvector ile Postgres içinde) | 0 $ | dahil / 50 $ |
| Arka plan kaldırma (cihaz üzerinde: 0 $; sunucuda: GPU veya API) | 0–20 $ | 0–300 $ |
| Hava durumu API'si (Open-Meteo ücretsiz / OpenWeather) | 0 $ | 0–40 $ |
| Hata izleme ve analitik (Sentry, PostHog ücretsiz katmanlar) | 0 $ | 0–100 $ |
| Abonelik altyapısı (RevenueCat, ~2,5K $ aylık gelire kadar ücretsiz) | 0 $ | gelirin ~%1'i |
| Expo EAS (Free / Production planı) | 0–19 $ | 99 $+ |
| **AI API** | 10–50 $ | 2.000–10.000 $ (kota ve model karmasına bağlı) |

**Tek seferlik ve yıllık sabit giderler:**
- Apple Developer Program: **99 $/yıl**
- Google Play Console: **25 $ tek seferlik**
- Alan adı, gizlilik politikası ve KVKK danışmanlığı: 500–2.000 $ (tek seferlik, hukuki inceleme)
- Mağaza komisyonu: abonelik gelirinin %15'i (Small Business Program / ilk yıldan sonra), aksi halde %30

---

## 6. Gelir Modeli Seçenekleri

| Model | Nasıl | Artı | Eksi |
|---|---|---|---|
| **Freemium + abonelik (önerilen ana model)** | Ücretsiz: 50 parça, ayda 10 ilham analizi. Premium: sınırsız parça, influencer eşleştirme, eksik parça ve kapsül planlama, gelişmiş istatistik. TR'de aylık ~99–149 TL, yıllık indirimli; global'de 4,99–7,99 $/ay. | Öngörülebilir gelir, AI maliyetini karşılar | Ödeme duvarı aktivasyonu düşürebilir, TR'de ödeme isteği düşük |
| **Affiliate komisyonu** | Eksik parça ve "benzerini al" önerileri. Moda komisyonları genellikle %3–10 (ağa ve markaya göre). | Kullanıcıya ücretsiz, niyet anı yüksek | Güven çatışması, düşük dönüşüm, ağ onayları gerekli |
| **Tek seferlik paketler** | "Kapsül gardırop raporu" veya "sezon planı" satın alma (IAP) | Abonelik istemeyenler için alternatif | Düzensiz gelir |
| **Marka iş birliği (v3)** | Etiketli "sponsorlu alternatif" önerileri, anonim ve toplu trend içgörüsü raporları | Yüksek marj | Gizlilik ve güven riski, açık rıza gerekir |
| **İkinci el / yeniden satış entegrasyonu (v3)** | Az giyilen parçaları Dolap, Vinted gibi platformlarda listeleme | Sürdürülebilirlik hikâyesi | Entegrasyon maliyeti |

**Öneri:** Freemium abonelik ana gelir, affiliate ikincil gelir olmalı. Kalite skoru affiliate'ten bağımsız tutulmalı. Abonelik için 7 günlük deneme ve yıllık plan kullanılmalı, RevenueCat ile A/B test yapılmalı.

**Kaba birim ekonomisi (12. ay hedefi):** 50K MAU, %4 ödeme dönüşümü = 2.000 abone × ~4 $ net ≈ 8.000 $/ay. Buna affiliate ile ~1.000–2.000 $/ay eklenir. AI ve altyapı maliyeti 2,5–10K $/ay. **Başabaş noktası, ücretsiz kotanın sıkı tutulmasına ve ucuz modelle triage'a bağlıdır.**

---

## 7. SWOT, Yol Haritası ve KPI'lar

### 7.1 SWOT

| **Güçlü Yönler** | **Zayıf Yönler** |
|---|---|
| Benzersiz üçlü: influencer eşleştirme, materyal kalitesi, eksik parça analizi | Sosyal platform verisine resmi erişim sınırlı |
| Güçlü vision LLM ile hızlı geliştirme, model eğitmeye gerek yok | Onboarding emeği (parça girme) yüksek |
| Expo ile tek kod tabanından iOS ve Android | AI çağrısı başına değişken maliyet |
| TR pazarına yerel uyum (site, dil, kumaş terimleri) | Küçük ekip, marka bilinirliği yok |
| **Fırsatlar** | **Tehditler** |
| Sürdürülebilir moda ve "az ama öz" trendi | Whering, Alta gibi oyuncuların özelliği kopyalaması |
| TR'de yerel bir AI gardırop lideri yok | Meta/TikTok API politika değişiklikleri |
| Affiliate ağlarının (Trendyol, Hepsiburada, Amazon TR) büyümesi | Genel AI asistanlarının (ChatGPT, Gemini) hafızalı stil özellikleri sunması |
| Influencer'larla iş birliği ("kombinimi dolabında kur" kampanyaları) | KVKK/GDPR ve mağaza kurallarının sıkılaşması |

### 7.2 Yol Haritası

**MVP (0–3 ay): "Dolabını tanı, ilhamını uygula"**
- Hesap (Apple/Google girişi) ve hesap silme, onay ekranı (AI veri paylaşımı)
- Fotoğraftan ekleme (toplu), cihaz üzerinde arka plan kaldırma
- Ürün linkinden ekleme: JSON-LD/OG verisi, ekran görüntüsü yedeği, etiket fotoğrafından kompozisyon okuma
- AI etiketleme (Haiku) ve manuel düzenleme
- Materyal kalite skoru v1 (kural tabanlı ve AI açıklaması)
- Hava ve ortama göre günlük kombin önerisi
- İlham: ekran görüntüsü veya paylaşım menüsüyle görsel gönderme, dolaptan ilk 3 eşleşme (Sonnet)
- TR ve EN dil desteği, analitik, maliyet loglama, değerlendirme seti
- **Başarı kapısı:** 300 beta kullanıcısı, D7 tutma ≥ %25, kullanıcı başına ortalama ≥ 25 parça

**v2 (3–6 ay): "Eksik parçayı bul, akıllı alışveriş yap"**
- Eksik parça analizi ve kapsül gardırop planlayıcı
- "Bu parça nereden / benzeri" araması: affiliate feed'leri, embedding indeksi
- Affiliate linkleri ve açıklama etiketleri
- Pinterest OAuth (panolardan ilham), Instagram Business Discovery (App Review'dan geçerse)
- Premium abonelik (RevenueCat), kotalar
- Kombin takvimi, giyim geçmişi, kullanım başına maliyet
- Veri dışa aktarma

**v3 (6–12 ay): "Kişisel stil motoru ve topluluk"**
- Influencer takibi ve yeni görünüm bildirimi (resmi API'lerle sınırlı)
- Kişiselleştirme: düzeltmelerden öğrenen tercih modeli
- Seyahat ve bavul planlayıcı, ikinci el satış entegrasyonu
- Sosyal özellikler (kombin paylaşma; UGC moderasyonu gerekli)
- Influencer/marka iş birlikleri, B2B trend içgörüleri (anonim, rıza ile)
- Sanal deneme (avatar) değerlendirmesi

### 7.3 Başarı Metrikleri (KPI)

| Kategori | KPI | MVP hedefi | 12. ay hedefi |
|---|---|---|---|
| **Aktivasyon** | Kayıttan sonra ilk 24 saatte ≥10 parça ekleyenlerin oranı | %40 | %55 |
| | İlk ilham eşleşmesini görenlerin oranı (ilk hafta) | %30 | %50 |
| **Etkileşim** | WAU/MAU | %35 | %45 |
| | Kullanıcı başına ortalama gardırop parçası | 25 | 60 |
| **Tutma** | D1 / D7 / D30 | %40 / %25 / %12 | %45 / %30 / %18 |
| **AI kalitesi** | Etiket düzeltme oranı (düzeltilen alan / toplam alan) | <%20 | <%10 |
| | Eşleşme kabul oranı (önerilen 3 adaydan biri seçildi) | %50 | %70 |
| | Link analizinde kompozisyon bulma oranı | %50 | %75 |
| **Gelir** | Ücretsizden ücretliye dönüşüm | — | %3–5 |
| | Affiliate tıklama oranı (eksik parça önerilerinde) | — | %8 |
| **Maliyet** | Aylık aktif kullanıcı başına AI maliyeti | <0,30 $ | <0,20 $ |
| | Parça analizi p95 süresi | <8 sn | <5 sn |
| **Memnuniyet** | Mağaza puanı / NPS | ≥4,3 / ≥30 | ≥4,6 / ≥45 |

---

## 8. Sonuç ve Öneriler

1. **Ürün teknik olarak uygulanabilir, ancak influencer profilini otomatik çekme MVP kapsamından çıkarılmalı.** Bunun yerine ekran görüntüsü ve paylaşım menüsü akışı kullanılmalı. Resmi API'ler (Instagram Business Discovery, Pinterest OAuth) v2'de eklenmeli.
2. **Link analizi her zaman bir yedek akışla tasarlanmalı** (ekran görüntüsü veya çamaşır etiketi fotoğrafı). Bot engelleri kaçınılmaz.
3. **Maliyet kontrolü:** etiketleme için Haiku, ilham ve eşleştirme için Sonnet kullanılmalı. Görseller küçültülmeli, aynı link için önbellek ve batch kullanılmalı. Bu şekilde parça başına maliyet sentin çok altında kalır.
4. **Uyum en başta tasarlanmalı:** AI veri paylaşımı için onay, hesap silme (uygulama içi ve web), KVKK yurt dışı aktarım değerlendirmesi, affiliate açıklaması.
5. **Güven, ürünün kendisi:** kalite skoru komisyondan bağımsız olmalı, AI çıktıları düzenlenebilir ve güven skoruyla gösterilmeli.
