import type { CapsulePlan, Garment, ID, Season } from '@/domain/types';
import { formatGapKey, garmentSatisfies, NEUTRAL, ANY, type GapKeyParts } from './gapKey';

export interface CapsuleSpec extends GapKeyParts {
  /** Subcategories that also fulfil the slot (e.g. loafers or boots). */
  alternatives?: readonly string[];
}

/** The 14 core pieces of the capsule wardrobe (plan §3.4 step 4). */
export const CAPSULE_CORE: readonly CapsuleSpec[] = [
  { category: 'top', subcategory: 'shirt', color: 'white' },
  { category: 'top', subcategory: 't_shirt', color: 'white' },
  { category: 'top', subcategory: 't_shirt', color: 'black' },
  { category: 'knitwear', subcategory: 'fine_knit', color: NEUTRAL },
  { category: 'knitwear', subcategory: 'sweater', color: ANY },
  { category: 'bottom', subcategory: 'jeans', color: 'blue' },
  { category: 'bottom', subcategory: 'trousers', color: NEUTRAL },
  { category: 'bottom', subcategory: 'skirt', color: ANY, alternatives: ['shorts'] },
  { category: 'outerwear', subcategory: 'blazer', color: ANY },
  { category: 'outerwear', subcategory: 'trench_coat', color: ANY },
  { category: 'outerwear', subcategory: 'coat', color: ANY },
  { category: 'shoes', subcategory: 'sneakers', color: 'white' },
  { category: 'shoes', subcategory: 'loafers', color: ANY, alternatives: ['boots', 'ankle_boots'] },
  { category: 'bag', color: NEUTRAL },
];

export function capsuleSpecKey(spec: CapsuleSpec): string {
  return formatGapKey(spec);
}

function specVariants(spec: CapsuleSpec): GapKeyParts[] {
  return [spec, ...(spec.alternatives ?? []).map((subcategory) => ({ ...spec, subcategory }))];
}

/** Returns the first garment that fills the slot and is not already used by an earlier slot. */
function garmentForSpec(spec: CapsuleSpec, garments: readonly Garment[], used: ReadonlySet<ID>): Garment | undefined {
  const variants = specVariants(spec);
  return garments.find((garment) => !used.has(garment.id) && variants.some((v) => garmentSatisfies(garment, v)));
}

export interface CapsuleCoverage {
  coreGarmentIds: ID[];
  missingSpecs: CapsuleSpec[];
}

export function capsuleCoverage(garments: readonly Garment[]): CapsuleCoverage {
  const used = new Set<ID>();
  const missingSpecs: CapsuleSpec[] = [];
  for (const spec of CAPSULE_CORE) {
    const garment = garmentForSpec(spec, garments, used);
    if (garment) used.add(garment.id);
    else missingSpecs.push(spec);
  }
  return { coreGarmentIds: [...used], missingSpecs };
}

export function buildCapsulePlan(params: {
  id: ID;
  garments: readonly Garment[];
  season?: Season;
  now: Date;
}): CapsulePlan {
  const { coreGarmentIds, missingSpecs } = capsuleCoverage(params.garments);
  return {
    id: params.id,
    season: params.season,
    targetSize: CAPSULE_CORE.length,
    coreGarmentIds,
    gapKeys: missingSpecs.map(capsuleSpecKey),
    createdAt: params.now.toISOString(),
  };
}
