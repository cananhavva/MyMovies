import { readFileSync } from 'fs';
import { join } from 'path';
import { COLORS } from '@/domain/colors';
import { SUBCATEGORIES } from '@/domain/subcategories';
import { CATEGORIES, FIBER_TYPES, OCCASIONS, PATTERNS, SEASONS, WEATHERS } from '@/domain/taxonomy';
import * as server from '../../supabase/functions/_shared/vocabulary';

const SHARED_DIR = join(__dirname, '../../supabase/functions/_shared');

/** The Deno proxy cannot import app code, so these copies are kept honest by this test. */
describe('proxy contract', () => {
  it('uses the same vocabulary as the app', () => {
    expect(server.CATEGORIES).toEqual(CATEGORIES);
    expect(server.SEASONS).toEqual(SEASONS);
    expect(server.WEATHERS).toEqual(WEATHERS);
    expect(server.OCCASIONS).toEqual(OCCASIONS);
    expect(server.PATTERNS).toEqual(PATTERNS);
    expect(server.FIBER_TYPES).toEqual(FIBER_TYPES);
    expect(server.COLORS).toEqual(COLORS);
    expect(server.SUBCATEGORIES).toEqual(SUBCATEGORIES);
  });

  it('extracts product pages with identical code', () => {
    const withoutHeader = (path: string) => readFileSync(path, 'utf8').split('\n').slice(1).join('\n');
    expect(withoutHeader(join(SHARED_DIR, 'extractProductPage.ts'))).toBe(
      withoutHeader(join(__dirname, '../services/productPage/extractProductPage.ts')),
    );
  });
});
