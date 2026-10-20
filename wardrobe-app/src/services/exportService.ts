import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportAllData } from '@/data/dataAdmin';
import type { Database } from '@/data/database';
import type { Result } from '@/domain/types';
import { appError } from '@/errors/AppError';
import { err, ok } from '@/errors/result';

/** Writes the export to the cache directory and opens the share sheet. */
export async function shareDataExport(db: Database, now: Date = new Date()): Promise<Result<void>> {
  try {
    const data = await exportAllData(db, now);
    const file = new File(Paths.cache, `wardrobe-export-${now.toISOString().slice(0, 10)}.json`);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(data, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Wardrobe export' });
    }
    return ok(undefined);
  } catch (error) {
    return err(appError('DB_ERROR', { cause: error }));
  }
}
