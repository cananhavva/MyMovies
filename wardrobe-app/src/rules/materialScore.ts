import type { Category, CompositionSource, FiberPart, FiberType, QualityAssessment, QualityTier } from '@/domain/types';
import { isCompositionUsable, normalizeComposition } from './compositionParser';

export const FIBER_BASE_SCORES: Readonly<Record<FiberType, number>> = {
  cashmere: 95,
  silk: 92,
  alpaca: 90,
  mohair: 90,
  merino: 90,
  wool: 85,
  leather: 85,
  suede: 82,
  linen: 82,
  down: 85,
  organic_cotton: 80,
  cotton: 75,
  lyocell: 72,
  cupro: 70,
  modal: 65,
  viscose: 50,
  nylon: 45,
  polyamide: 45,
  recycled_polyester: 40,
  polyester: 30,
  acrylic: 22,
  pu_faux_leather: 25,
  elastane: 50,
  other: 50,
};

/** Up to this share elastane only adds stretch and is ignored; the excess is scored as synthetic. */
const ELASTANE_FREE_PERCENT = 5;
const ELASTANE_EXCESS_SCORE = 30;

/**
 * The plan calls fibres "natural" from score 70, but its approved examples (100 % cotton → 75)
 * only hold when the bonus starts at 80, so the bonus uses 80.
 */
const PREMIUM_NATURAL_MIN_SCORE = 80;
const PREMIUM_NATURAL_MIN_SHARE = 90;
const PREMIUM_NATURAL_BONUS = 5;

const CHEAP_SYNTHETICS: ReadonlySet<FiberType> = new Set<FiberType>(['polyester', 'acrylic']);
const CHEAP_SYNTHETIC_MIN_SHARE = 50;
const CHEAP_SYNTHETIC_PENALTY = 5;

const SYNTHETICS: ReadonlySet<FiberType> = new Set<FiberType>([
  'nylon',
  'polyamide',
  'polyester',
  'recycled_polyester',
  'acrylic',
  'elastane',
  'pu_faux_leather',
]);
/** Technical garments legitimately use synthetics (rain shells, swimwear), so their penalty is halved. */
const FUNCTIONAL_CATEGORIES: ReadonlySet<Category> = new Set<Category>(['outerwear', 'activewear', 'swimwear']);
const FUNCTIONAL_SYNTHETIC_MIN_SHARE = 50;
const FUNCTIONAL_REFERENCE_SCORE = 60;
const FUNCTIONAL_RELIEF_FACTOR = 0.5;

const PREMIUM_LINING_FIBERS: ReadonlySet<FiberType> = new Set<FiberType>(['silk', 'cupro']);
const PREMIUM_LINING_BONUS = 3;

const TIER_THRESHOLDS: readonly { min: number; tier: QualityTier }[] = [
  { min: 80, tier: 'premium' },
  { min: 65, tier: 'good' },
  { min: 45, tier: 'average' },
];

export interface MaterialScoreInput {
  composition?: readonly FiberPart[];
  lining?: readonly FiberPart[];
  category?: Category;
  compositionSource: CompositionSource;
}

interface WeightedFiber {
  fiber: FiberType;
  weight: number;
  score: number;
}

function toWeightedFibers(parts: readonly FiberPart[]): WeightedFiber[] {
  return parts.flatMap((part): WeightedFiber[] => {
    if (part.fiber !== 'elastane') {
      return [{ fiber: part.fiber, weight: part.percent, score: FIBER_BASE_SCORES[part.fiber] }];
    }
    const excess = part.percent - ELASTANE_FREE_PERCENT;
    return excess > 0 ? [{ fiber: 'elastane', weight: excess, score: ELASTANE_EXCESS_SCORE }] : [];
  });
}

function weightedAverage(fibers: readonly WeightedFiber[]): number {
  const totalWeight = fibers.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return 0;
  return fibers.reduce((sum, f) => sum + f.weight * f.score, 0) / totalWeight;
}

function shareOf(fibers: readonly WeightedFiber[], predicate: (fiber: WeightedFiber) => boolean): number {
  const totalWeight = fibers.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return 0;
  return (fibers.filter(predicate).reduce((sum, f) => sum + f.weight, 0) / totalWeight) * 100;
}

function dominantFiber(parts: readonly FiberPart[]): FiberType | undefined {
  return [...parts].sort((a, b) => b.percent - a.percent)[0]?.fiber;
}

export function tierForScore(score: number): QualityTier {
  return TIER_THRESHOLDS.find(({ min }) => score >= min)?.tier ?? 'low';
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const roundTo2 = (value: number): number => Math.round(value * 100) / 100;

/** Reason codes are "rule" or "fiber:<type>:<percent>"; the UI turns them into sentences. */
function dominantFiberReasons(parts: readonly FiberPart[]): string[] {
  return [...parts]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2)
    .map((part) => `fiber:${part.fiber}:${roundTo2(part.percent)}`);
}

function unknownAssessment(compositionSource: CompositionSource, reason: string): QualityAssessment {
  return { score: 0, tier: 'unknown', reasons: [reason], source: 'rule', compositionSource };
}

export function scoreMaterial(input: MaterialScoreInput): QualityAssessment {
  const { composition, lining = [], category, compositionSource } = input;
  if (!composition || composition.length === 0) return unknownAssessment('none', 'no_composition');
  if (!isCompositionUsable(composition)) return unknownAssessment(compositionSource, 'composition_incomplete');

  const reasons: string[] = [];
  const { parts, normalized } = normalizeComposition(composition);
  reasons.push(...dominantFiberReasons(parts));
  if (normalized) reasons.push('composition_normalized');

  const fibers = toWeightedFibers(parts);
  const base = weightedAverage(fibers);
  let score = base;

  if (shareOf(fibers, (f) => f.score >= PREMIUM_NATURAL_MIN_SCORE) >= PREMIUM_NATURAL_MIN_SHARE) {
    score += PREMIUM_NATURAL_BONUS;
    reasons.push('natural_bonus');
  }

  const isFunctional = category !== undefined && FUNCTIONAL_CATEGORIES.has(category);
  const mostlySynthetic = shareOf(fibers, (f) => SYNTHETICS.has(f.fiber)) >= FUNCTIONAL_SYNTHETIC_MIN_SHARE;
  if (isFunctional && mostlySynthetic) {
    if (base < FUNCTIONAL_REFERENCE_SCORE) {
      score += (FUNCTIONAL_REFERENCE_SCORE - base) * FUNCTIONAL_RELIEF_FACTOR;
      reasons.push('functional_synthetic');
    }
  } else if (shareOf(fibers, (f) => CHEAP_SYNTHETICS.has(f.fiber)) >= CHEAP_SYNTHETIC_MIN_SHARE) {
    score -= CHEAP_SYNTHETIC_PENALTY;
    reasons.push('synthetic_penalty');
  }

  const liningFiber = dominantFiber(lining);
  if (liningFiber && PREMIUM_LINING_FIBERS.has(liningFiber)) {
    score += PREMIUM_LINING_BONUS;
    reasons.push('premium_lining');
  }

  if (compositionSource === 'ai_guess') reasons.push('estimated');

  const finalScore = roundTo2(clamp(score, 0, 100));
  return { score: finalScore, tier: tierForScore(finalScore), reasons, source: 'rule', compositionSource };
}
