import { CATEGORIES, FIBER_TYPES, OCCASIONS, SEASONS, WEATHERS } from '@/domain/taxonomy';
import { COLORS } from '@/domain/colors';
import { SUBCATEGORIES } from '@/domain/subcategories';
import { ERROR_CODES } from '@/errors/AppError';
import en from './en.json';
import tr from './tr.json';

type Tree = { [key: string]: string | Tree };

function flattenKeys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flattenKeys(value, `${prefix}${key}.`),
  );
}

const enKeys = new Set(flattenKeys(en));
const trKeys = new Set(flattenKeys(tr));

describe('translations', () => {
  it('have the same keys in Turkish and English', () => {
    expect([...enKeys].filter((k) => !trKeys.has(k))).toEqual([]);
    expect([...trKeys].filter((k) => !enKeys.has(k))).toEqual([]);
  });

  it('have a message for every error code', () => {
    expect(ERROR_CODES.filter((code) => !enKeys.has(`errors.${code}`))).toEqual([]);
  });

  it('cover every enum value shown as a chip', () => {
    const required = [
      ...CATEGORIES.map((v) => `enums.category.${v}`),
      ...SEASONS.map((v) => `enums.season.${v}`),
      ...WEATHERS.map((v) => `enums.weather.${v}`),
      ...OCCASIONS.map((v) => `enums.occasion.${v}`),
      ...FIBER_TYPES.map((v) => `enums.fiber.${v}`),
      ...COLORS.map((v) => `enums.color.${v}`),
      ...Object.values(SUBCATEGORIES).flat().map((v) => `enums.subcategory.${v}`),
    ];
    expect(required.filter((key) => !enKeys.has(key))).toEqual([]);
  });
});
