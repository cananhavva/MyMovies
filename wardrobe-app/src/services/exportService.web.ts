import { exportAllData } from '@/data/dataAdmin';
import type { Database } from '@/data/database';
import type { Result } from '@/domain/types';
import { appError } from '@/errors/AppError';
import { err, ok } from '@/errors/result';

/** Browser build of exportService: downloads the JSON instead of opening a share sheet. */
export async function shareDataExport(db: Database, now: Date = new Date()): Promise<Result<void>> {
  try {
    const data = await exportAllData(db, now);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wardrobe-export-${now.toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    return ok(undefined);
  } catch (error) {
    return err(appError('DB_ERROR', { cause: error }));
  }
}
