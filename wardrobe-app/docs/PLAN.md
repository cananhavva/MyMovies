# Gardırop Uygulaması – Planlama ve İş Kuralları (Ajan 2)

## 0. Kullanıcı kararları (onaylandı)
| Konu | Karar |
|---|---|
| Backend / AI anahtarı | Supabase Edge Functions proxy (üretim) + geliştirici BYOK modu (anahtar `expo-secure-store`'da) |
| Üyelik / veri | Üyelik yok, tüm veriler cihazda (SQLite), JSON dışa aktarma + tüm veriyi silme |
| Arayüz dili | Türkçe + İngilizce, cihaz diline göre otomatik |
| Influencer içe aktarma | Profil linki kaydı + kullanıcının yüklediği ekran görüntüleri; Pinterest/LTK linklerinden og:image çekme denemesi. Instagram/TikTok scraping YOK |
| Gelir modeli | (Sorulmadı, varsayılan) MVP ücretsiz, cihaz başına günlük AI kotası (20 analiz/gün) |

## 1. Teknoloji
**Expo (React Native) + TypeScript strict**, `expo-router` (tab + stack), `zustand`, `expo-sqlite`, `expo-image-picker`, `expo-image-manipulator`, `expo-file-system`, `expo-secure-store`, `zod`, `i18next` + `react-i18next` + `expo-localization`, `@react-native-community/netinfo`, test: `jest` + `jest-expo`.

AI: Claude. `src/config/ai.ts → AI_MODELS = { fast: 'claude-sonnet-5-5', deep: 'claude-opus-5-5' }`. API anahtarı ASLA bundle'a (EXPO_PUBLIC_*) konmaz.

Proxy endpoint'leri (Supabase Edge Functions, Deno):
- `analyze-garment` (görsel base64 + metin → GarmentAnalysis)
- `analyze-product-page` (URL → sunucuda fetch → JSON-LD/og/metin → Claude → ProductAnalysis)
- `analyze-inspiration` (görseller → parça listesi + marka tahmini)
- `gap-plan` (özet → kapsül açıklama metni)
Proxy: anahtar saklar, cihaz başına rate limit/kota, boyut limiti, 30 sn timeout, tool-use ile JSON şeması zorlar.

```ts
interface AiClient {
  analyzeGarment(input: { imageUri?: string; text?: string }): Promise<Result<GarmentAnalysis>>;
  analyzeProductPage(input: { url: string; pastedText?: string; labelImageUri?: string }): Promise<Result<ProductAnalysis>>;
  analyzeInspiration(input: { imageUris: string[]; sourceUrl?: string }): Promise<Result<InspirationAnalysis>>;
  gapPlan(input: GapPlanInput): Promise<Result<CapsulePlanText>>;
}
// ProxyAiClient, DirectAiClient (BYOK), MockAiClient (test/offline demo)
```
Kalite skoru, gap analizi, eşleştirme **deterministik TS** – AI yalnızca özellik çıkarır.

## 1.3 Klasör yapısı
```
wardrobe-app/
  app.json, eas.json, package.json, tsconfig.json, babel.config.js, jest.config.js
  app/
    _layout.tsx                 # i18n, DB init, ErrorBoundary, Toast
    (tabs)/_layout.tsx          # 4 tab
    (tabs)/index.tsx            # Gardırop
    (tabs)/add.tsx              # Ekle (Fotoğraf | Link | Manuel)
    (tabs)/inspire.tsx          # İlham
    (tabs)/insights.tsx         # Eksikler & Kapsül
    garment/[id].tsx, garment/review.tsx
    inspiration/[id].tsx, influencer/[id].tsx
    settings.tsx
  src/
    config/ domain/ rules/ ai/ services/ data/ store/ errors/ components/ i18n/
  supabase/functions/ analyze-garment/ analyze-product-page/ analyze-inspiration/ gap-plan/ _shared/
```

## 1.4 Veri modeli (`src/domain/types.ts`)
```ts
export type ID = string;
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'hot' | 'warm' | 'mild' | 'cool' | 'cold' | 'rainy' | 'windy' | 'snowy';
export type Occasion = 'casual' | 'office' | 'business_formal' | 'night_out' | 'date' | 'party'
  | 'wedding_guest' | 'sport' | 'hiking_walking' | 'travel' | 'beach' | 'home_lounge';
export type Category = 'top' | 'bottom' | 'dress' | 'outerwear' | 'knitwear' | 'shoes'
  | 'bag' | 'accessory' | 'activewear' | 'swimwear' | 'underwear_sleep';
export type Formality = 1 | 2 | 3 | 4 | 5;
export type Warmth = 1 | 2 | 3 | 4 | 5;
export type FieldSource = 'ai' | 'user' | 'rule';
export type FiberType = 'cashmere' | 'silk' | 'wool' | 'merino' | 'alpaca' | 'mohair' | 'linen' | 'cotton'
  | 'organic_cotton' | 'leather' | 'suede' | 'down' | 'lyocell' | 'modal' | 'viscose' | 'cupro'
  | 'nylon' | 'polyamide' | 'polyester' | 'recycled_polyester' | 'acrylic' | 'elastane' | 'pu_faux_leather' | 'other';
export interface FiberPart { fiber: FiberType; percent: number }
export interface QualityAssessment {
  score: number; tier: 'premium' | 'good' | 'average' | 'low' | 'unknown';
  reasons: string[]; source: 'rule';
  compositionSource: 'product_page' | 'label_photo' | 'user' | 'ai_guess' | 'none';
}
export interface Garment {
  id: ID; name: string; category: Category; subcategory?: string; colors: string[];
  pattern?: 'solid' | 'striped' | 'checked' | 'floral' | 'print' | 'other';
  seasons: Season[]; weather: Weather[]; occasions: Occasion[];
  formality?: Formality; warmth?: Warmth; composition?: FiberPart[]; quality?: QualityAssessment;
  brand?: string; productUrl?: string; price?: { amount: number; currency: string };
  imageUris: string[];
  fieldSources: Partial<Record<'seasons'|'weather'|'occasions'|'category'|'colors'|'composition'|'formality'|'warmth', FieldSource>>;
  aiConfidence?: number; pendingAnalysis?: boolean; notes?: string;
  favorite: boolean; archived: boolean; createdAt: string; updatedAt: string;
}
export interface Outfit { id: ID; name: string; garmentIds: ID[]; occasions: Occasion[]; seasons: Season[]; createdAt: string }
export type InfluencerPlatform = 'instagram' | 'tiktok' | 'pinterest' | 'ltk' | 'other';
export interface InfluencerProfile { id: ID; platform: InfluencerPlatform; handle: string; profileUrl: string; displayName?: string; notes?: string; createdAt: string }
export interface InspirationItem {
  id: ID; category: Category; subcategory?: string; colors: string[]; pattern?: Garment['pattern'];
  description: string; likelyBrands?: string[];
  shopLinks?: { label: string; url: string; source: 'post_caption'|'ltk'|'user'|'ai_search_hint' }[];
  matchedGarmentIds: ID[]; matchScore: number;
}
export interface InspirationLook {
  id: ID; influencerId?: ID; sourceUrl?: string; imageUris: string[]; items: InspirationItem[];
  occasions: Occasion[]; seasons: Season[]; liked: boolean; recreatability: number; createdAt: string;
}
export interface GapSuggestion {
  id: ID; key: string; category: Category; subcategory?: string; color?: string; title: string;
  reason: 'inspiration_frequency' | 'occasion_coverage' | 'season_coverage' | 'capsule_core';
  evidence: { lookIds: ID[]; frequency: number; occasion?: Occasion; season?: Season };
  priority: number; unlocksLookCount: number;
  status: 'open' | 'dismissed' | 'planned' | 'acquired'; createdAt: string;
}
export interface CapsulePlan { id: ID; season?: Season; targetSize: number; coreGarmentIds: ID[]; gapKeys: string[]; narrative?: string; createdAt: string }
export interface GarmentAnalysis {
  name: string; category: Category; subcategory?: string; colors: string[]; pattern?: Garment['pattern'];
  seasons: Season[]; weather: Weather[]; occasions: Occasion[]; formality?: Formality; warmth?: Warmth;
  compositionGuess?: FiberPart[]; confidence: number; isGarment?: boolean;
}
export interface ProductAnalysis extends Partial<GarmentAnalysis> {
  brand?: string; productName?: string; price?: { amount: number; currency: string };
  composition?: FiberPart[]; compositionFound: boolean; imageUrl?: string;
}
export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };
```
Depolama: `expo-sqlite`; tablolar `garments, outfits, influencers, inspiration_looks, gap_suggestions, capsule_plans, settings, schema_version`; dizi alanları JSON text. Görseller `documentDirectory/images/<uuid>.jpg`.

## 2. Ekranlar ve akışlar
Tablar: **Gardırobum** (grid + filtre chip'leri: kategori/mevsim/ortam/hava + arama, EmptyState), **Ekle** (3 büyük kart: Fotoğraf, Ürün linki, Elle), **İlham** (influencer listesi, link ekle, ekran görüntüsü yükle, kombin kartları "%60 gardırobunla yapılabilir"), **Eksikler** (GapSuggestion kartları: Planla / Aldım / Gizle; kapsül planı). Ayarlar: gardırop sağ üst dişli.

- **A – Fotoğraf:** izin → kamera/galeri → küçült (uzun kenar 1280px, JPEG 0.7) → sandbox'a kopyala → "Analiz ediliyor…" (iptal) → review ekranı (AI chip'leri ✨ işaretli, dokunmak `fieldSource='user'` yapar; kumaş: etiket fotoğrafı veya metin → kalite rozeti anında) → Kaydet → toast.
- **B – Link:** URL doğrula → `analyzeProductPage` → kumaş varsa skor; yoksa [Etiket fotoğrafı] [Kumaş metni yapıştır] [Atla] → ürün görseli indir → review.
- **C – Elle:** boş review formu, fotoğraf opsiyonel.
- **D – İlham:** link → `platformDetect` (instagram.com, tiktok.com, pinterest.*, pin.it, shopltk.com, liketoknow.it) → profil linkiyse InfluencerProfile (handle URL'den) → ekran görüntüleri (≤10) → `analyzeInspiration` → `matching.ts` → detay: her parça "Sende var / Benzeri var / Eksik", "Nereden alınmış olabilir" (tahminler "Tahmin" rozetli), ❤️ beğen.
- **E – Eksikler:** her değişiklikte yerelde yeniden hesaplanır (AI yok). "AI ile açıklama yaz" opsiyonel.

UI ilkeleri: ekran başına tek birincil aksiyon, chip > metin, AI sonuçları hep düzenlenebilir, silmede 5 sn geri al, min 48dp dokunma alanı, erişilebilirlik etiketleri.

## 3. İş kuralları
### 3.1 Taksonomi
Hava: hot >28°C, warm 20–28, mild 14–20, cool 7–14, cold <7, rainy, windy, snowy.
Ortam formality aralığı: casual 1–2, office 3, business_formal 4–5, night_out 2–4, date 2–4, party 3–4, wedding_guest 4–5, sport 1, hiking_walking 1, travel 1–2, beach 1, home_lounge 1.
Kural varsayılanları (`seasonRules.ts`, `fieldSource:'rule'`):
- warmth ≥4 → [autumn, winter], [cool, cold]; ≤2 → [spring, summer], [hot, warm, mild]; 3 → [spring, autumn], [mild, cool]
- linen ≥%50 → summer ekle; wool/cashmere/alpaca ≥%50 → winter ekle, summer çıkar
- outerwear trench/raincoat → rainy, windy; swimwear → beach, summer, hot; activewear → sport
- subcategory tablosu: trench_coat → {spring, autumn; mild/cool/rainy/windy; office/casual}, blazer → office, sneakers → casual/travel, hiking_boots → hiking_walking
- `fieldSource='user'` alanlar ASLA otomatik değişmez.

### 3.2 Kumaş kalite skoru (`rules/materialScore.ts`, `rules/compositionParser.ts`)
Taban puanlar: cashmere 95, silk 92, alpaca/mohair 90, merino 90, wool 85, leather 85, suede 82, linen 82, down 85, organic_cotton 80, cotton 75, lyocell 72, cupro 70, modal 65, viscose 50, nylon/polyamide 45, recycled_polyester 40, polyester 30, acrylic 22, pu_faux_leather 25, elastane 50*, other 50.
*Elastan ≤%5 ise hesaba katılmaz; >%5 ise aşan kısım 30 puan sayılır.

1. Parser: TR/EN/DE/FR/ES/IT eş anlamlılar (yün/wool/wolle/laine/lana; pamuk/cotton/baumwolle/coton/algodón; ipek/silk/seide/soie/seda; keten/linen/leinen/lin/lino; polyester/poliester; elastan/spandex/lycra; viskon/viscose/rayon; polyamid/nylon…). Desenler `%80 yün` ve `wool 80%`. Birden çok bölüm (Shell/Dış, Lining/Astar) varsa yalnızca dış kumaş; astar ipek/cupro ise +3. Toplam 95–105 dışındaysa 100'e normalize (`composition_normalized`); toplam <%50 → tier `unknown`.
2. `base = Σ(p_i × s_i)/Σp_i` (elastan istisnasıyla)
3. Doğal (score ≥70) toplam ≥%90 → +5; polyester+acrylic ≥%50 → −5; outerwear/activewear/swimwear'de sentetik cezası yarıya: base<60 ise + (60−base)×0.5 (`functional_synthetic`). `ai_guess` ise "tahmini".
4. clamp 0–100. Tier: ≥80 premium, 65–79 good, 45–64 average, <45 low; kumaş yoksa unknown.
5. reasons: en baskın 2 lif + uygulanan kurallar.

Test örnekleri: %100 pamuk → 75 good; %100 yün → 90 premium; %80 yün %20 polyamid → 77 good; %65 polyester %35 pamuk → 40.75 low; %95 pamuk %5 elastan → 75 good; %100 polyester trençkot → 45 average; %100 akrilik kazak → 17 low.
UI: "Kumaş bileşimine göre" ibaresi.

### 3.3 Eşleştirme (`rules/matching.ts`)
Kategori eşit değilse 0. subcategory eşit +0.45, aynı aile +0.25; renk aynı +0.35, aynı aile (black~charcoal, beige~camel~sand, navy~blue) +0.2, nötr↔nötr +0.1; desen eşit +0.1; formality farkı ≤1 +0.1. Max 1. ≥0.7 "Sende var", 0.45–0.69 "Benzeri var", <0.45 "Eksik".
`recreatability = (#var + 0.5×#benzeri)/#parça`; aksesuar/çanta paydaya 0.5 ağırlıkla.

### 3.4 Gap analizi (`rules/gapAnalysis.ts`)
1. İlham sıklığı: eksik itemlar → anahtar `category:subcategory:colorFamily`; frequency, likedFrequency, distinctInfluencers; `priority = min(100, 20·liked + 10·(freq−liked) + 10·(distinctInf−1) + 15·unlocksLookCount)`; unlocks = eklenince recreatability ≥0.8 olacak look sayısı. Eşik: freq ≥2 veya (liked ≥1 ve unlocks ≥1).
2. Ortam kapsaması (kullanıcının seçtiği sık ortamlar): office → 1 bottom f≥3, 2 top f≥3, 1 shoes f≥3; hiking_walking → hiking/sneaker ayakkabı + windy/rainy outerwear. Eksikse priority 40.
3. Mevsim kapsaması: mevcut + sonraki mevsim için ≥1 outerwear, 1 shoes, 3 top; yoksa priority 35.
4. Kapsül çekirdek (`capsule.ts`): beyaz gömlek, düz tişört ×2 (beyaz/siyah), ince triko, kalın kazak, koyu jean, kumaş pantolon, etek/şort, blazer, trençkot, yün kaban, beyaz sneaker, loafer/bot, nötr çanta. Priority 20.
5. Tekilleştirme: aynı anahtar birden çok nedende → max priority +10; dismissed 30 gün gizli; eşleşen parça eklenince acquired; priority azalan, max 10.
Örnek: "Siyah trençkot – beğendiğin 4 kombinde (3 farklı influencer) var. Eklersen 3 kombini tamamlayabilirsin."

## 4. Hata yönetimi
`AppError { code; retryable; cause? }`, `errorMessages.ts` kod→i18n. Hiçbir hata girilen veriyi kaybettirmez, "Elle devam et" hep var.

| Kod | Tetikleyen | Davranış |
|---|---|---|
| NETWORK_OFFLINE | offline/fetch TypeError | Banner + [Elle devam et][Tekrar dene]; `pendingAnalysis=true`; çevrimdışı çekirdek çalışır |
| AI_TIMEOUT | 30 sn | 1 otomatik retry (2 sn), sonra [Tekrar dene][Elle doldur] |
| AI_INVALID_RESPONSE | JSON/zod hatası | ```json temizliği + ilk {…} çıkarımı → 1 onarım isteği → kural varsayılanlarıyla doldur, kısmi geçerli alanları tut |
| AI_RATE_LIMITED | 429 / kota | retry-after geri sayım; günlük kota mesajı |
| AI_OVERLOADED / SERVER_5XX | 500/529 | 2 retry (2 sn, 6 sn) sonra mesaj + [Elle doldur] |
| AI_AUTH | 401/403 | BYOK: "API anahtarı geçersiz…"; prod: "Bir sorun oluştu (AUTH)" |
| AI_LOW_CONFIDENCE | confidence <0.5 | review'da sarı not + fotoğraf ipucu |
| AI_NOT_GARMENT | kıyafet değil | "Bu fotoğrafta kıyafet bulamadık…" |
| LINK_INVALID | parse/http(s) değil | inline mesaj |
| LINK_FETCH_BLOCKED | 403/429/captcha/boş | [Ekran görüntüsü][Bilgi yapıştır][Elle ekle]; productUrl kaydedilir |
| LINK_NOT_FOUND | 404/410 | aynı alternatifler |
| LINK_TIMEOUT | 10 sn | [Tekrar dene] + alternatifler |
| NO_MATERIAL_INFO | kumaş yok | bilgi kartı [Etiket fotoğrafı][Kumaşı yaz][Atla], "Kalite: bilinmiyor" |
| COMPOSITION_PARSE_FAILED | çözülemedi / <%50 | inline örnek format, çözülen kısımlar chip |
| IMAGE_TOO_LARGE | >5MB veya >8000px | 1024px/0.6 ile ikinci sıkıştırma, sonra mesaj |
| IMAGE_UNSUPPORTED | bozuk/video | "JPG veya PNG seç" |
| PERMISSION_CAMERA_DENIED | ret | ilk ret [Tekrar iste]; kalıcı [Ayarları aç][Galeriden seç] |
| PERMISSION_GALLERY_DENIED | ret | [Ayarları aç][Kamerayla çek]; iOS limited normal |
| PLATFORM_UNSUPPORTED | tanınmayan domain | ekran görüntüsü yönlendirmesi |
| PLATFORM_RESTRICTED | Instagram/TikTok | yönlendirme: ekran görüntüsü ekle; profil kaydedilir |
| INSPIRATION_NO_OUTFIT | kıyafet yok | "Tam boy görsel dene" |
| EMPTY_WARDROBE | 0 parça | EmptyState + [Parça ekle]; <5 parça ipucu |
| NO_INSPIRATION | 0 look | yalnızca ortam/mevsim/kapsül + kişiselleştirme kartı |
| DB_ERROR | yazma hatası | "Kaydedilemedi", form korunur |
| DUPLICATE_GARMENT | aynı productUrl | [Yine de ekle][Mevcut parçayı aç] |
| USER_CANCELLED | iptal | AbortController, mesaj yok |
| UNKNOWN | yakalanmamış | ErrorBoundary [Yeniden başlat] |

## 5. MVP kapsamı
Expo, 4 tab, TR+EN; foto/link/elle ekleme; AI parça analizi (düzenlenebilir); proxy ile ürün sayfası çıkarımı + fallback; kalite skoru + çok dilli parser; ilham: profil linki + ekran görüntüsü + eşleştirme + beğen; Pinterest/LTK og:image denemesi; gap analizi + kapsül; SQLite, JSON dışa aktarma, tüm veriyi sil; Supabase proxy + BYOK dev modu; kural motoru jest testleri.
Faz 2: hesap/bulut, hava durumu ile günlük kombin, outfit oluşturucu, arka plan kaldırma, Share Extension, affiliate. Faz 3: abonelik, cost-per-wear, resmi API'ler, embedding eşleştirme.
Kapsam dışı: Instagram/TikTok scraping, captcha aşma.

## Uygulama sırası
1. Expo iskeleti, router tab'ları, i18n, ErrorBoundary
2. domain + rules + jest testleri (AI'dan bağımsız)
3. SQLite + store'lar
4. Elle ekleme + gardırop listesi/filtre
5. ai/ katmanı: Mock → Direct (BYOK) → Proxy + supabase/functions; zod + JSON onarımı
6. Fotoğraf ve link akışları + hata kodları
7. İlham akışı
8. Eksikler + kapsül
9. app.json izin metinleri (TR/EN), eas.json
