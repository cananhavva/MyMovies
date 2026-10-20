# Gardırop AI (Wardrobe AI)

Gardırobunu fotoğraf ve ürün linkinden dijitalleştiren, kumaş kalitesini puanlayan, influencer kombinlerini kendi dolabınla eşleştiren ve eksik parçaları gösteren Expo (React Native) uygulaması.

- Plan ve iş kuralları: [`docs/PLAN.md`](docs/PLAN.md) · Proje analizi: [`docs/PROJE_ANALIZI.md`](docs/PROJE_ANALIZI.md)
- Üyelik yok; tüm veriler cihazda (SQLite). JSON dışa aktarma ve "tüm veriyi sil" Ayarlar ekranında.
- Arayüz: Türkçe + İngilizce (cihaz diline göre otomatik).

## Gereksinimler

- Node.js 20+ (22 önerilir), npm
- Telefon için Expo Go **veya** development build (`expo-sqlite`, `expo-secure-store` vb. Expo Go'da da çalışır)
- Proxy için: [Supabase CLI](https://supabase.com/docs/guides/cli) ve bir Supabase projesi
- Mağaza derlemesi için: `npx eas-cli@latest` ve bir Expo hesabı

## Kurulum

```bash
cd wardrobe-app
npm install
cp .env.example .env        # değerleri doldur (aşağıya bak)
npx expo start              # QR kodu Expo Go ile okut, ya da a (Android) / i (iOS)
```

`.env` içindeki değerler **herkese açıktır** ve uygulama paketine gömülür:

| Değişken | Açıklama |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase proje URL'i (proxy fonksiyonları için) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) anahtarı |
| `EXPO_PUBLIC_APP_VARIANT` | `development` / `preview` / `production`. `production` geliştirici BYOK alanını gizler |

> Anthropic API anahtarı **asla** `EXPO_PUBLIC_*` değişkenine konmaz. Üretimde anahtar yalnızca Supabase Edge Function ortamındadır.

### AI arka ucu nasıl seçilir?

1. **Geliştirici BYOK** (production dışı): Ayarlar › Geliştirici bölümüne kendi Anthropic anahtarını gir. Anahtar cihazın anahtar zincirinde (`expo-secure-store`) saklanır, istekler doğrudan `api.anthropic.com`'a gider.
2. **Supabase proxy**: `EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` tanımlıysa.
3. **Çevrimdışı demo (Mock)**: hiçbiri yoksa; sabit örnek yanıtlar döner.

Aktif arka uç Ayarlar ekranında görünür. İlk AI analizinden önce kullanıcıdan açık onay alınır (Apple 5.1.2(i)).

## Testler ve tip kontrolü

```bash
npm test                 # jest (kural motoru, AI katmanı, servisler, çeviri anahtarları)
npm run typecheck        # tsc --noEmit (strict)
npx expo export --platform android   # paketleme duman testi
```

Deterministik çekirdek (`src/domain`, `src/rules`, `src/ai/parseJson.ts` + zod şemaları, `src/services/platformDetect.ts`, `src/services/urlValidation.ts`, `src/errors`) Expo'dan bağımsızdır ve doğrudan jest ile test edilir. PLAN 3.2'deki 7 kumaş puanı örneği `src/rules/materialScore.test.ts` içindedir.

Edge Function birim testleri (Deno):

```bash
cd supabase/functions
deno test _shared/
deno check analyze-garment/index.ts analyze-product-page/index.ts analyze-inspiration/index.ts gap-plan/index.ts
```

## Supabase proxy'yi yayına alma

```bash
cd wardrobe-app
supabase login
supabase link --project-ref <PROJE_REF>
supabase db push                                   # ai_usage tablosu + consume_ai_quota fonksiyonu
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...  # anahtar yalnızca sunucuda
supabase functions deploy analyze-garment
supabase functions deploy analyze-product-page
supabase functions deploy analyze-inspiration
supabase functions deploy gap-plan
```

- `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` Edge Function ortamında otomatik tanımlıdır (kota tablosu için).
- Her istek `x-device-id` (uygulama kurulumuna özel rastgele UUID) taşır; cihaz başına günlük **20** analiz kotası uygulanır (`_shared/quota.ts`). Kota dolunca `429 AI_RATE_LIMITED` + `retry-after` döner.
- İstek boyutu sınırlıdır (gövde ≤ 30 MB, görsel başına ≈ 5 MB, en fazla 10 görsel). Fotoğraflar saklanmaz/loglanmaz.
- `analyze-product-page` sayfayı sunucuda çeker (10 sn zaman aşımı, yönlendirmeler elle izlenir, özel IP/localhost engellenir — SSRF koruması), JSON-LD / og / meta ve görünür metni çıkarıp Claude'a verir. 403/429/captcha/boş sayfa → `LINK_FETCH_BLOCKED`, 404/410 → `LINK_NOT_FOUND`, zaman aşımı → `LINK_TIMEOUT`.
- Proxy, Claude yanıtını structured outputs (`output_config.format` JSON şeması) ile zorlar; uygulama yanıtı ayrıca zod ile doğrular.
- `config.toml` içinde `verify_jwt = true`: uygulama anon anahtarını `Authorization: Bearer` olarak yollar. Yeni "publishable key" (JWT olmayan) kullanıyorsanız `verify_jwt = false` yapın.

Yerelde denemek için: `supabase start` ve `supabase functions serve --env-file ./supabase/.env.local` (`ANTHROPIC_API_KEY` içeren, git'e eklenmeyen dosya).

## EAS ile derleme ve mağazaya gönderme

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure          # ilk sefer: projeyi EAS'e bağlar
npx eas-cli@latest build --profile development --platform ios      # dev client
npx eas-cli@latest build --profile preview --platform android      # dahili test APK/AAB
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production --platform ios
npx eas-cli@latest submit --profile production --platform android
```

- Paket kimlikleri: iOS `com.wardrobeai.app`, Android `com.wardrobeai.app`.
- `eas.json` profilleri `EXPO_PUBLIC_APP_VARIANT` değerini ayarlar. Supabase değerlerini EAS ortam değişkeni olarak ekleyin: `npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value ... --environment production`.
- `submit.production` içindeki `ascAppId` ve `secrets/google-play-service-account.json` (git'e eklenmez) değerlerini kendi hesaplarınızla doldurun.
- Kamera/galeri izin metinleri `app.json` (`expo-image-picker` eklentisi) ve `locales/tr.json`, `locales/en.json` dosyalarındadır. Mikrofon izni engellidir.

## Klasör yapısı

```
app/                  expo-router ekranları (4 tab + review/detay/ilham/influencer/ayarlar)
src/config/           AI modelleri, zaman aşımları, ortam değişkenleri, tema
src/domain/           veri modeli, taksonomi, renk ve alt kategori sözlükleri
src/rules/            saf iş kuralları: compositionParser, materialScore, seasonRules,
                      matching, gapAnalysis, capsule, gapKey
src/ai/               AiClient arayüzü, Proxy/Direct(BYOK)/Mock istemcileri, zod şemaları,
                      JSON temizleme/onarım, yeniden deneme politikası
src/services/         görsel, izin, link, platform tespiti, dışa aktarma, akışlar (flows/)
src/data/             SQLite migration'ları ve repository'ler
src/store/            zustand store'ları
src/errors/           AppError, hata kodları → i18n mesaj ve aksiyonları
src/i18n/             tr.json, en.json
supabase/functions/   4 Edge Function + _shared (Claude çağrısı, kota, sayfa çekme)
supabase/migrations/  ai_usage tablosu
```

## Bilinen sınırlamalar (MVP)

- Instagram/TikTok içeriği otomatik çekilmez (bilinçli olarak scraping yok); profil linki kaydedilir, kombinler ekran görüntüsüyle eklenir. Pinterest/LTK gönderilerinde og:image denemesi yapılır.
- Arka plan kaldırma, hava durumuna göre günlük kombin, hesap/bulut senkronu Faz 2'dedir.
- `extractProductPage` ve taksonomi listeleri hem uygulamada hem `supabase/functions/_shared` içinde bulunur (Deno uygulama kodunu içe aktaramaz); `src/ai/proxyContract.test.ts` iki kopyanın aynı kaldığını doğrular.
