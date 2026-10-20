import { colorFamily, isNeutral, normalizeColor, normalizeColors } from './colors';
import { normalizeSubcategory } from './subcategories';
import { foldCase } from './text';

describe('foldCase', () => {
  it('folds English and Turkish capitals to the same lowercase', () => {
    expect(foldCase('IVORY')).toBe('ivory');
    expect(foldCase('İPEK')).toBe('ipek');
    expect(foldCase('KIRMIZI')).toBe('kirmizi');
    expect(foldCase('kırmızı')).toBe('kirmizi');
  });
});

describe('normalizeColor', () => {
  // Regression: "IVORY"/"Ivory" were unknown because Turkish lowercasing produced "ıvory".
  it.each`
    raw              | color
    ${'IVORY'}       | ${'ivory'}
    ${'Ivory'}       | ${'ivory'}
    ${'White'}       | ${'white'}
    ${'PINK'}        | ${'pink'}
    ${'SILVER'}      | ${'silver'}
    ${'Light-Blue'}  | ${'light_blue'}
    ${'light  blue'} | ${'light_blue'}
    ${'LIGHT_BLUE'}  | ${'light_blue'}
    ${'Açık Mavi'}   | ${'light_blue'}
    ${'AÇIK MAVİ'}   | ${'light_blue'}
    ${'KIRMIZI'}     | ${'red'}
    ${'kirmizi'}     | ${'red'}
    ${'SİYAH'}       | ${'black'}
    ${'Koyu Gri'}    | ${'charcoal'}
    ${'çok renkli'}  | ${'multicolor'}
    ${'ALTIN'}       | ${'gold'}
    ${'  navy  '}    | ${'navy'}
  `('$raw → $color', ({ raw, color }) => {
    expect(normalizeColor(raw)).toBe(color);
  });

  it.each(['', 'mauve', '#ff0000', 'blackish'])('returns undefined for %p', (raw) => {
    expect(normalizeColor(raw)).toBeUndefined();
  });

  it('dedupes and drops unknown colours', () => {
    expect(normalizeColors(['Black', 'siyah', 'mauve', 'WHITE'])).toEqual(['black', 'white']);
  });

  it('groups families per the plan', () => {
    expect(colorFamily('charcoal')).toBe(colorFamily('black'));
    expect(['beige', 'camel', 'sand'].map(colorFamily)).toEqual(['beige', 'beige', 'beige']);
    expect(colorFamily('navy')).toBe(colorFamily('blue'));
    expect(colorFamily('unknown')).toBeUndefined();
    expect(isNeutral('NAVY')).toBe(true);
    expect(isNeutral('red')).toBe(false);
  });
});

describe('normalizeSubcategory', () => {
  // Regression: "SKIRT" became "skırt" and matched nothing.
  it.each`
    raw                | subcategory
    ${'SKIRT'}         | ${'skirt'}
    ${'Hiking Boots'}  | ${'hiking_boots'}
    ${'HIKING-BOOT'}   | ${'hiking_boots'}
    ${'T-Shirt'}       | ${'t_shirt'}
    ${'TRENÇKOT'}      | ${'trench_coat'}
    ${'Spor Ayakkabı'} | ${'sneakers'}
    ${'SPOR AYAKKABI'} | ${'sneakers'}
    ${'spor ayakkabi'} | ${'sneakers'}
    ${'HIRKA'}         | ${'cardigan'}
    ${'BIKINI'}        | ${'bikini'}
  `('$raw → $subcategory', ({ raw, subcategory }) => {
    expect(normalizeSubcategory(raw)).toBe(subcategory);
  });

  it('returns undefined for empty input', () => {
    expect(normalizeSubcategory(undefined)).toBeUndefined();
    expect(normalizeSubcategory('   ')).toBeUndefined();
  });
});
