import { CATEGORIES, COLORS, FIBER_TYPES, OCCASIONS, PATTERNS, SEASONS, WEATHERS } from './vocabulary.ts';

// JSON Schemas for Claude structured outputs (output_config.format). Structured outputs do not
// support numeric ranges, so 1–5 scales and 0–1 confidence are described in the prompt and
// validated again by the app's zod schemas.

type JsonSchema = Record<string, unknown>;

const enumOf = (values: readonly string[]): JsonSchema => ({ type: 'string', enum: [...values] });
const listOf = (items: JsonSchema): JsonSchema => ({ type: 'array', items });
const text: JsonSchema = { type: 'string' };
const integer: JsonSchema = { type: 'integer' };
const number: JsonSchema = { type: 'number' };
const boolean: JsonSchema = { type: 'boolean' };

function object(properties: Record<string, JsonSchema>, required: readonly string[]): JsonSchema {
  return { type: 'object', properties, required: [...required], additionalProperties: false };
}

const fiberPart = object({ fiber: enumOf(FIBER_TYPES), percent: number }, ['fiber', 'percent']);

const garmentProperties = {
  name: text,
  category: enumOf(CATEGORIES),
  subcategory: text,
  colors: listOf(enumOf(COLORS)),
  pattern: enumOf(PATTERNS),
  seasons: listOf(enumOf(SEASONS)),
  weather: listOf(enumOf(WEATHERS)),
  occasions: listOf(enumOf(OCCASIONS)),
  formality: integer,
  warmth: integer,
};

export const GARMENT_SCHEMA = object(
  { ...garmentProperties, compositionGuess: listOf(fiberPart), confidence: number, isGarment: boolean },
  ['name', 'category', 'colors', 'seasons', 'weather', 'occasions', 'confidence', 'isGarment'],
);

export const PRODUCT_SCHEMA = object(
  {
    ...garmentProperties,
    productName: text,
    brand: text,
    price: object({ amount: number, currency: text }, ['amount', 'currency']),
    composition: listOf(fiberPart),
    compositionFound: boolean,
    imageUrl: text,
    confidence: number,
  },
  ['compositionFound'],
);

export const INSPIRATION_SCHEMA = object(
  {
    hasOutfit: boolean,
    items: listOf(
      object(
        {
          category: enumOf(CATEGORIES),
          subcategory: text,
          colors: listOf(enumOf(COLORS)),
          pattern: enumOf(PATTERNS),
          formality: integer,
          description: text,
          likelyBrands: listOf(text),
        },
        ['category', 'colors', 'description'],
      ),
    ),
    occasions: listOf(enumOf(OCCASIONS)),
    seasons: listOf(enumOf(SEASONS)),
  },
  ['hasOutfit', 'items', 'occasions', 'seasons'],
);

export const GAP_PLAN_SCHEMA = object({ narrative: text }, ['narrative']);
