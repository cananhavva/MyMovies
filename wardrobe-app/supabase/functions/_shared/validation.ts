import { HttpError } from './http.ts';

export const MAX_BODY_BYTES = 30 * 1024 * 1024;
/** ~5 MB of image data once base64-decoded (the app compresses to well under this). */
const MAX_IMAGE_BASE64_CHARS = 7_000_000;
const MAX_IMAGES = 10;
const MAX_TEXT_CHARS = 10_000;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface EncodedImage {
  base64: string;
  mediaType: MediaType;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads the body with a hard size cap so oversized uploads are rejected before parsing. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) throw new HttpError('IMAGE_TOO_LARGE');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError('IMAGE_TOO_LARGE');
  try {
    const parsed: unknown = JSON.parse(text);
    if (isRecord(parsed)) return parsed;
  } catch {
    // fall through
  }
  throw new HttpError('UNKNOWN');
}

export function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new HttpError('UNKNOWN');
  return value.slice(0, MAX_TEXT_CHARS);
}

export function optionalImage(value: unknown): EncodedImage | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value) || typeof value.base64 !== 'string') throw new HttpError('IMAGE_UNSUPPORTED');
  if (!(MEDIA_TYPES as readonly unknown[]).includes(value.mediaType)) throw new HttpError('IMAGE_UNSUPPORTED');
  if (value.base64.length > MAX_IMAGE_BASE64_CHARS) throw new HttpError('IMAGE_TOO_LARGE');
  return { base64: value.base64, mediaType: value.mediaType as MediaType };
}

export function imageList(value: unknown): EncodedImage[] {
  if (!Array.isArray(value) || value.length === 0) throw new HttpError('IMAGE_UNSUPPORTED');
  if (value.length > MAX_IMAGES) throw new HttpError('IMAGE_TOO_LARGE');
  return value.map((item) => optionalImage(item)).filter((image): image is EncodedImage => image !== undefined);
}
