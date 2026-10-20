import type { Garment, ID, InfluencerProfile, InspirationLook, Result } from '@/domain/types';
import { fail, ok } from '@/errors/result';
import { matchLookItems } from '@/rules/matching';
import { downloadImage } from '../imageStorage';
import { newId } from '../ids';
import { detectPlatform, type PlatformInfo } from '../platformDetect';
import { fetchProductPage } from '../productPage/fetchProductPage';
import { validateUrl } from '../urlValidation';
import { isOnline } from '../network';
import { aiGate, type FlowContext } from './aiGate';

export interface SavedLink {
  url: string;
  info: PlatformInfo;
  influencer?: InfluencerProfile;
  /** Pinterest/LTK only: the post image fetched via og:image, ready to analyse. */
  previewImageUri?: string;
}

/** Best effort: Pinterest/LTK pages usually expose og:image; any failure just means "no preview". */
async function tryFetchPreviewImage(url: string): Promise<string | undefined> {
  if (!(await isOnline())) return undefined;
  const page = await fetchProductPage(url);
  if (!page.ok || !page.value.imageUrl) return undefined;
  const image = await downloadImage(page.value.imageUrl);
  return image.ok ? image.value : undefined;
}

/**
 * Saves a profile link as an InfluencerProfile (handle parsed from the URL). Instagram/TikTok are
 * never fetched (no scraping); the caller then asks the user for screenshots.
 */
export async function saveInspirationLink(rawUrl: string, now: Date = new Date()): Promise<Result<SavedLink>> {
  const url = validateUrl(rawUrl);
  if (!url.ok) return url;
  const info = detectPlatform(url.value);
  if (info.platform === 'other') return fail('PLATFORM_UNSUPPORTED');

  const influencer: InfluencerProfile | undefined =
    info.kind === 'profile' && info.handle
      ? { id: newId(), platform: info.platform, handle: info.handle, profileUrl: url.value, createdAt: now.toISOString() }
      : undefined;
  const previewImageUri =
    info.kind === 'post' && info.supportsOgImage ? await tryFetchPreviewImage(url.value) : undefined;
  return ok({ url: url.value, info, influencer, previewImageUri });
}

export async function analyzeLook(
  input: { imageUris: string[]; influencerId?: ID; sourceUrl?: string },
  garments: readonly Garment[],
  context: FlowContext,
  now: Date = new Date(),
): Promise<Result<InspirationLook>> {
  const client = await aiGate(context);
  if (!client.ok) return client;
  const analysis = await client.value.analyzeInspiration(
    { imageUris: input.imageUris, sourceUrl: input.sourceUrl },
    { signal: context.signal },
  );
  if (!analysis.ok) return analysis;

  const items = analysis.value.items.map((item) => ({ ...item, id: newId(), matchedGarmentIds: [], matchScore: 0 }));
  const matched = matchLookItems(items, garments);
  return ok({
    id: newId(),
    influencerId: input.influencerId,
    sourceUrl: input.sourceUrl,
    imageUris: input.imageUris,
    items: matched.items,
    recreatability: matched.recreatability,
    occasions: analysis.value.occasions,
    seasons: analysis.value.seasons,
    liked: false,
    createdAt: now.toISOString(),
  });
}
