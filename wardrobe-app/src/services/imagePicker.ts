import * as ImagePicker from 'expo-image-picker';
import type { Result } from '@/domain/types';
import { appError } from '@/errors/AppError';
import { err, fail, ok } from '@/errors/result';
import { importImage } from './imageStorage';

export type ImageSource = 'camera' | 'gallery';

async function ensurePermission(source: ImageSource): Promise<Result<true>> {
  const response =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (response.granted) return ok(true);
  const code = source === 'camera' ? 'PERMISSION_CAMERA_DENIED' : 'PERMISSION_GALLERY_DENIED';
  return err(appError(code, { canAskAgain: response.canAskAgain }));
}

/**
 * Lets the user take or choose photos and returns sandboxed, compressed copies.
 * iOS "limited" photo access is treated as granted (plan §4).
 */
export async function pickImages(source: ImageSource, options: { multiple?: boolean; limit?: number } = {}): Promise<Result<string[]>> {
  const permission = await ensurePermission(source);
  if (!permission.ok) return permission;

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    quality: 1,
    allowsMultipleSelection: source === 'gallery' && options.multiple === true,
    selectionLimit: options.limit,
  };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(pickerOptions) : await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled) return fail('USER_CANCELLED');

  const uris: string[] = [];
  for (const asset of result.assets) {
    const imported = await importImage({ uri: asset.uri, width: asset.width, height: asset.height, mimeType: asset.mimeType });
    if (!imported.ok) return imported;
    uris.push(imported.value);
  }
  return ok(uris);
}
