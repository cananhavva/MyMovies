import type { EncodedImage } from '@/ai/ports';
import type { ImageMediaType } from '@/ai/claudeMessages';
import type { Result } from '@/domain/types';
import { appError } from '@/errors/AppError';
import { err, fail, ok } from '@/errors/result';

/**
 * Browser build of imageStorage: there is no app sandbox, so images are resized on a canvas and
 * kept as JPEG data URIs inside the garment row.
 */
const LONG_EDGE = 1024;
const QUALITY = 0.7;
const MAX_BYTES = 5 * 1024 * 1024;

export interface SourceImage {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be decoded'));
    image.src = uri;
  });
}

export async function importImage(source: SourceImage): Promise<Result<string>> {
  if (source.mimeType && (!source.mimeType.startsWith('image/') || source.mimeType.includes('gif'))) {
    return fail('IMAGE_UNSUPPORTED');
  }
  try {
    const image = await loadImage(source.uri);
    const scale = Math.min(1, LONG_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg', QUALITY);
    return dataUri.length * 0.75 > MAX_BYTES ? fail('IMAGE_TOO_LARGE') : ok(dataUri);
  } catch (error) {
    return err(appError('IMAGE_UNSUPPORTED', { cause: error }));
  }
}

/** Product images stay remote on the web; the browser caches them. */
export async function downloadImage(url: string): Promise<Result<string>> {
  return ok(url);
}

export async function readImageBase64(uri: string): Promise<Result<EncodedImage>> {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(uri);
  if (!match?.[1] || !match[2]) return fail('IMAGE_UNSUPPORTED');
  return ok({ base64: match[2], mediaType: match[1] as ImageMediaType });
}

/** Data URIs live in the database rows, so deleting the rows deletes the images. */
export function deleteImages(_uris: readonly string[]): void {}

export function deleteAllImages(): void {}
