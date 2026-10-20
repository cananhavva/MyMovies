import { extractFirstJsonObject, parseJsonLoosely, parseWithSchema, stripCodeFences } from './parseJson';
import { garmentAnalysisSchema, inspirationAnalysisSchema, lenientGarmentAnalysisSchema, lenientInspirationAnalysisSchema } from './schemas';

const validGarment = {
  name: 'Black trench coat',
  category: 'outerwear',
  subcategory: 'trench_coat',
  colors: ['Black'],
  pattern: 'solid',
  seasons: ['spring', 'autumn', 'fall'],
  weather: ['rainy'],
  occasions: ['office'],
  formality: 3.4,
  warmth: 3,
  confidence: 0.92,
  isGarment: true,
};

describe('parseJson helpers', () => {
  it('strips ```json fences', () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('extracts the first balanced object, ignoring braces in strings', () => {
    expect(extractFirstJsonObject('Here: {"a":"}{","b":{"c":1}} trailing {"x":2}')).toBe('{"a":"}{","b":{"c":1}}');
  });

  it('parses JSON surrounded by prose', () => {
    expect(parseJsonLoosely('Sure! {"ok": true} Hope this helps.')).toEqual({ ok: true });
  });

  it('returns undefined when there is no JSON', () => {
    expect(parseJsonLoosely('I cannot help with that.')).toBeUndefined();
  });
});

describe('garment schema', () => {
  it('accepts a valid answer, drops unknown seasons and rounds formality', () => {
    const result = parseWithSchema(JSON.stringify(validGarment), garmentAnalysisSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.seasons).toEqual(['spring', 'autumn']);
      expect(result.value.formality).toBe(3);
      expect(result.value.colors).toEqual(['black']);
    }
  });

  it('fails with AI_INVALID_RESPONSE on an unknown category', () => {
    const result = parseWithSchema(JSON.stringify({ ...validGarment, category: 'hat' }), garmentAnalysisSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('AI_INVALID_RESPONSE');
  });

  it('salvages partial answers with the lenient schema at low confidence', () => {
    const result = parseWithSchema(JSON.stringify({ category: 'shoes', colors: 'white', seasons: ['summer'] }), lenientGarmentAnalysisSchema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.category).toBe('shoes');
      expect(result.value.colors).toEqual([]);
      expect(result.value.seasons).toEqual(['summer']);
      expect(result.value.confidence).toBeLessThan(0.5);
    }
  });
});

describe('inspiration schema', () => {
  const answer = {
    hasOutfit: true,
    items: [
      { category: 'outerwear', subcategory: 'trench_coat', colors: ['beige'], description: 'Belted trench' },
      { category: 'spaceship', colors: [], description: 'invalid' },
    ],
    occasions: ['casual'],
    seasons: ['autumn'],
  };

  it('rejects the whole answer strictly', () => {
    expect(parseWithSchema(JSON.stringify(answer), inspirationAnalysisSchema).ok).toBe(false);
  });

  it('keeps valid items leniently', () => {
    const result = parseWithSchema(JSON.stringify(answer), lenientInspirationAnalysisSchema);
    expect(result.ok && result.value.items).toHaveLength(1);
  });
});

describe('parseJson helpers – edge cases', () => {
  it.each`
    text                                         | value
    ${'```JSON\n{"a":1}\n```'}                   | ${{ a: 1 }}
    ${'```\n{"a":1}\n```'}                       | ${{ a: 1 }}
    ${'  {"a":1}  '}                             | ${{ a: 1 }}
    ${'{"a":"quote \\" and } brace"} tail'}      | ${{ a: 'quote " and } brace' }}
    ${'Text ```json\n{"a":{"b":[1,2]}}``` more'} | ${{ a: { b: [1, 2] } }}
  `('parses $text', ({ text, value }) => {
    expect(parseJsonLoosely(text)).toEqual(value);
  });

  it.each(['', '{', '{"a":', '{"a":1', 'null-ish text', '```json\n```'])('returns undefined for %p', (text) => {
    expect(parseJsonLoosely(text)).toBeUndefined();
  });

  it('returns AI_INVALID_RESPONSE with a cause for unparseable text', () => {
    const result = parseWithSchema('{"name": ', garmentAnalysisSchema);
    expect(result).toMatchObject({ ok: false, error: { code: 'AI_INVALID_RESPONSE', cause: 'no JSON object found' } });
  });

  it('accepts a top-level JSON array only if the schema does (garment schema does not)', () => {
    const result = parseWithSchema('[1,2]', garmentAnalysisSchema);
    expect(!result.ok && result.error.code).toBe('AI_INVALID_RESPONSE');
  });
});
