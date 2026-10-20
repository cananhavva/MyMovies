/**
 * Public build-time configuration. Only EXPO_PUBLIC_* values are inlined into the bundle, so
 * nothing here may be secret: the Supabase anon key is public by design, the Anthropic key is not
 * and never appears in the app (it lives in the Edge Function environment or, in developer BYOK
 * mode, in the device keychain).
 */
export type AppVariant = 'development' | 'preview' | 'production';

function readVariant(raw: string | undefined): AppVariant {
  return raw === 'development' || raw === 'preview' ? raw : 'production';
}

export const ENV = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appVariant: readVariant(process.env.EXPO_PUBLIC_APP_VARIANT),
} as const;

export const isProductionBuild = ENV.appVariant === 'production';

export function isProxyConfigured(): boolean {
  return ENV.supabaseUrl !== '' && ENV.supabaseAnonKey !== '';
}
