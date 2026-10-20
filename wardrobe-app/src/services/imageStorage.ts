import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { EncodedImage } from '@/ai/ports';
import type { ImageMediaType } from '@/ai/claudeMessages';
import type { Result } from '@/domain/types';
import { appError } from '@/errors/AppError';
import { err, fail, ok } from '@/errors/result';
import { newId } from './ids';

/** Plan §2-A: long edge 1280 px, JPEG 0.7; a second, smaller pass when still too large. */
const COMPRESSION_PASSES = [
  { longEdge: 1280, quality: 0.7 },
  { longEdge: 1024, quality: 0.6 },
] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 8000;

function imagesDirectory(): Directory {
  const directory = new Directory(Paths.document, 'images');
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

export interface SourceImage {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
}

function isSupportedSource(image: SourceImage): boolean {
  if (!image.mimeType) return true;
  return image.mimeType.startsWith('image/') && !image.mimeType.includes('gif');
}

async function compress(image: SourceImage, pass: (typeof COMPRESSION_PASSES)[number]): Promise<File> {
  const context = ImageManipulator.manipulate(image.uri);
  if (Math.max(image.width, image.height) > pass.longEdge) {
    context.resize(image.width >= image.height ? { width: pass.longEdge } : { height: pass.longEdge });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: pass.quality, format: SaveFormat.JPEG });
  return new File(saved.uri);
}

/**
 * Resizes, re-encodes as JPEG (which also drops EXIF/GPS metadata) and copies the image into the
 * app sandbox so it survives the picker's temporary files being cleaned up.
 */
export async function importImage(image: SourceImage): Promise<Result<string>> {
  if (!isSupportedSource(image)) return fail('IMAGE_UNSUPPORTED');
  try {
    const oversizedSource = Math.max(image.width, image.height) > MAX_SOURCE_PIXELS;
    const passes = oversizedSource ? COMPRESSION_PASSES.slice(1) : COMPRESSION_PASSES;
    for (const pass of passes) {
      const file = await compress(image, pass);
      if (file.size <= MAX_BYTES) {
        const destination = new File(imagesDirectory(), `${newId()}.jpg`);
        file.move(destination);
        return ok(destination.uri);
      }
      file.delete();
    }
    return fail('IMAGE_TOO_LARGE');
  } catch (error) {
    return err(appError('IMAGE_UNSUPPORTED', { cause: error }));
  }
}

/** Downloads a product image (og:image) into the sandbox; failures are non-fatal for callers. */
export async function downloadImage(url: string): Promise<Result<string>> {
  try {
    const file = await File.downloadFileAsync(url, new File(imagesDirectory(), `${newId()}.jpg`));
    return ok(file.uri);
  } catch (error) {
    return err(appError('NETWORK_OFFLINE', { cause: error }));
  }
}

function mediaTypeOf(uri: string): ImageMediaType {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function readImageBase64(uri: string): Promise<Result<EncodedImage>> {
  try {
    return ok({ base64: await new File(uri).base64(), mediaType: mediaTypeOf(uri) });
  } catch (error) {
    return err(appError('IMAGE_UNSUPPORTED', { cause: error }));
  }
}

export function deleteImages(uris: readonly string[]): void {
  for (const uri of uris) {
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}

export function deleteAllImages(): void {
  const directory = new Directory(Paths.document, 'images');
  if (directory.exists) directory.delete();
}
