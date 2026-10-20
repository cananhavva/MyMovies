import { normalizeSubcategory } from '@/domain/subcategories';
import type {
  Category,
  FiberPart,
  FiberType,
  FieldSource,
  Occasion,
  Season,
  TaggableField,
  Warmth,
  Weather,
} from '@/domain/types';

export interface TagSet {
  seasons: Season[];
  weather: Weather[];
  occasions: Occasion[];
}

type TagField = keyof TagSet & TaggableField;
const TAG_FIELDS: readonly TagField[] = ['seasons', 'weather', 'occasions'];

export interface RuleInput extends TagSet {
  category: Category;
  subcategory?: string;
  warmth?: Warmth;
  composition?: readonly FiberPart[];
  fieldSources: Partial<Record<TaggableField, FieldSource>>;
}

export interface RuleOutput extends TagSet {
  fieldSources: Partial<Record<TaggableField, FieldSource>>;
}

interface TagAdjustment {
  add: Partial<TagSet>;
  remove?: Partial<TagSet>;
}

const EMPTY_TAGS: TagSet = { seasons: [], weather: [], occasions: [] };

function warmthDefaults(warmth: Warmth | undefined): Partial<TagSet> {
  if (warmth === undefined) return {};
  if (warmth >= 4) return { seasons: ['autumn', 'winter'], weather: ['cool', 'cold'] };
  if (warmth <= 2) return { seasons: ['spring', 'summer'], weather: ['hot', 'warm', 'mild'] };
  return { seasons: ['spring', 'autumn'], weather: ['mild', 'cool'] };
}

const SUBCATEGORY_RULES: Readonly<Record<string, TagAdjustment>> = {
  trench_coat: {
    add: { seasons: ['spring', 'autumn'], weather: ['mild', 'cool', 'rainy', 'windy'], occasions: ['office', 'casual'] },
  },
  raincoat: { add: { weather: ['rainy', 'windy'] } },
  blazer: { add: { occasions: ['office'] } },
  sneakers: { add: { occasions: ['casual', 'travel'] } },
  hiking_boots: { add: { occasions: ['hiking_walking'] } },
};

const CATEGORY_RULES: Readonly<Partial<Record<Category, TagAdjustment>>> = {
  swimwear: { add: { occasions: ['beach'], seasons: ['summer'], weather: ['hot'] } },
  activewear: { add: { occasions: ['sport'] } },
};

const WARM_ANIMAL_FIBERS: ReadonlySet<FiberType> = new Set<FiberType>(['wool', 'merino', 'cashmere', 'alpaca', 'mohair']);
const DOMINANT_FIBER_SHARE = 50;

function fiberShare(composition: readonly FiberPart[], fibers: ReadonlySet<FiberType>): number {
  return composition.filter((part) => fibers.has(part.fiber)).reduce((sum, part) => sum + part.percent, 0);
}

function materialAdjustments(composition: readonly FiberPart[] | undefined): TagAdjustment[] {
  if (!composition) return [];
  const adjustments: TagAdjustment[] = [];
  if (fiberShare(composition, new Set<FiberType>(['linen'])) >= DOMINANT_FIBER_SHARE) {
    adjustments.push({ add: { seasons: ['summer'] } });
  }
  if (fiberShare(composition, WARM_ANIMAL_FIBERS) >= DOMINANT_FIBER_SHARE) {
    adjustments.push({ add: { seasons: ['winter'] }, remove: { seasons: ['summer'] } });
  }
  return adjustments;
}

function collectAdjustments(input: RuleInput): TagAdjustment[] {
  const subcategoryRule = SUBCATEGORY_RULES[normalizeSubcategory(input.subcategory) ?? ''];
  const categoryRule = CATEGORY_RULES[input.category];
  return [subcategoryRule, categoryRule, ...materialAdjustments(input.composition)].filter(
    (rule): rule is TagAdjustment => rule !== undefined,
  );
}

function sameMembers<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function adjustField<F extends TagField>(
  field: F,
  current: TagSet[F],
  input: RuleInput,
  adjustments: readonly TagAdjustment[],
): TagSet[F] {
  type Value = TagSet[F][number];
  const base: Value[] = current.length > 0 ? [...current] : [...(warmthDefaults(input.warmth)[field] ?? [])];
  const added = adjustments.flatMap((adj) => (adj.add[field] ?? []) as Value[]);
  const removed = adjustments.flatMap((adj) => (adj.remove?.[field] ?? []) as Value[]);
  return [...new Set([...base, ...added])].filter((value) => !removed.includes(value)) as TagSet[F];
}

/**
 * Fills seasons / weather / occasions from warmth, material and subcategory rules.
 * Fields the user edited (fieldSource 'user') are never touched.
 */
export function applySeasonRules(input: RuleInput): RuleOutput {
  const adjustments = collectAdjustments(input);
  const output: RuleOutput = { ...EMPTY_TAGS, fieldSources: { ...input.fieldSources } };

  for (const field of TAG_FIELDS) {
    const current = input[field];
    if (input.fieldSources[field] === 'user') {
      assignField(output, field, current);
      continue;
    }
    const adjusted = adjustField(field, current, input, adjustments);
    assignField(output, field, adjusted);
    if (!sameMembers<string>(adjusted, current)) output.fieldSources[field] = 'rule';
  }
  return output;
}

function assignField<F extends TagField>(target: TagSet, field: F, value: TagSet[F]): void {
  target[field] = value;
}
