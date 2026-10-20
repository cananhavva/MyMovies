import { normalizeColor } from '@/domain/colors';
import { nextSeason, OCCASION_FORMALITY, seasonForDate } from '@/domain/taxonomy';
import type {
  Category,
  Garment,
  GapEvidence,
  GapReason,
  GapSuggestion,
  ID,
  InspirationLook,
  Occasion,
  Season,
  Weather,
} from '@/domain/types';
import { capsuleCoverage } from './capsule';
import { colorConstraintOf, formatGapKey, garmentSatisfies, parseGapKey, ANY, type GapKeyParts } from './gapKey';
import { matchLevel, recreatability } from './matching';

export const MAX_VISIBLE_SUGGESTIONS = 10;
export const DISMISS_HIDE_DAYS = 30;
const RECREATABLE_THRESHOLD = 0.8;
const MAX_PRIORITY = 100;
const MULTI_REASON_BONUS = 10;
const OCCASION_PRIORITY = 40;
const SEASON_PRIORITY = 35;
const CAPSULE_PRIORITY = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

const INSPIRATION_WEIGHTS = { liked: 20, unliked: 10, extraInfluencer: 10, unlockedLook: 15 } as const;

export interface GapAnalysisInput {
  garments: readonly Garment[];
  looks: readonly InspirationLook[];
  frequentOccasions: readonly Occasion[];
  previous: readonly GapSuggestion[];
  now: Date;
}

export interface GapAnalysisResult {
  /** Open or planned suggestions to show, highest priority first, at most 10. */
  visible: GapSuggestion[];
  /** Every suggestion with its current status, for persistence. */
  all: GapSuggestion[];
}

interface Candidate {
  parts: GapKeyParts;
  color?: string;
  reason: GapReason;
  evidence: GapEvidence;
  priority: number;
  unlocksLookCount: number;
}

// ---------- 1. Inspiration frequency ----------

interface MissingOccurrence {
  look: InspirationLook;
  parts: GapKeyParts;
  color?: string;
}

function missingOccurrences(looks: readonly InspirationLook[]): Map<string, MissingOccurrence[]> {
  const byKey = new Map<string, MissingOccurrence[]>();
  for (const look of looks) {
    for (const item of look.items) {
      if (matchLevel(item.matchScore) !== 'missing') continue;
      const parts: GapKeyParts = {
        category: item.category,
        subcategory: item.subcategory,
        color: colorConstraintOf(item.colors),
      };
      const key = formatGapKey(parts);
      const color = item.colors[0] ? normalizeColor(item.colors[0]) : undefined;
      const occurrences = byKey.get(key) ?? [];
      if (!occurrences.some((o) => o.look.id === look.id)) occurrences.push({ look, parts, color });
      byKey.set(key, occurrences);
    }
  }
  return byKey;
}

/** A look is "unlocked" when owning this piece lifts it to ≥ 80 % recreatable. */
function wouldUnlock(look: InspirationLook, key: string): boolean {
  if (look.recreatability >= RECREATABLE_THRESHOLD) return false;
  const withPiece = look.items.map((item) => {
    const itemKey = formatGapKey({ category: item.category, subcategory: item.subcategory, color: colorConstraintOf(item.colors) });
    return itemKey === key ? { category: item.category, matchScore: 1 } : item;
  });
  return recreatability(withPiece) >= RECREATABLE_THRESHOLD;
}

function inspirationCandidates(looks: readonly InspirationLook[]): Candidate[] {
  const candidates: Candidate[] = [];
  for (const [key, occurrences] of missingOccurrences(looks)) {
    const first = occurrences[0];
    if (!first) continue;
    const frequency = occurrences.length;
    const likedFrequency = occurrences.filter((o) => o.look.liked).length;
    const influencerIds = new Set(occurrences.map((o) => o.look.influencerId).filter((id): id is ID => id !== undefined));
    const distinctInfluencers = Math.max(1, influencerIds.size);
    const unlocksLookCount = occurrences.filter((o) => wouldUnlock(o.look, key)).length;
    if (!(frequency >= 2 || (likedFrequency >= 1 && unlocksLookCount >= 1))) continue;

    const priority = Math.min(
      MAX_PRIORITY,
      INSPIRATION_WEIGHTS.liked * likedFrequency +
        INSPIRATION_WEIGHTS.unliked * (frequency - likedFrequency) +
        INSPIRATION_WEIGHTS.extraInfluencer * (distinctInfluencers - 1) +
        INSPIRATION_WEIGHTS.unlockedLook * unlocksLookCount,
    );
    candidates.push({
      parts: first.parts,
      color: first.color,
      reason: 'inspiration_frequency',
      evidence: {
        lookIds: occurrences.map((o) => o.look.id),
        frequency,
        likedFrequency,
        distinctInfluencers,
      },
      priority,
      unlocksLookCount,
    });
  }
  return candidates;
}

// ---------- 2. Occasion coverage ----------

interface Requirement {
  parts: GapKeyParts;
  count: number;
  matches: (garment: Garment) => boolean;
}

const OFFICE_MIN_FORMALITY = OCCASION_FORMALITY.office.min;

function isOfficeReady(garment: Garment): boolean {
  return (garment.formality ?? 0) >= OFFICE_MIN_FORMALITY || garment.occasions.includes('office');
}

function officePiece(category: Category, subcategory: string, count: number): Requirement {
  return {
    parts: { category, subcategory, color: ANY },
    count,
    matches: (g) => g.category === category && isOfficeReady(g),
  };
}

const PROTECTIVE_WEATHER: readonly Weather[] = ['windy', 'rainy'];

const OCCASION_REQUIREMENTS: Readonly<Partial<Record<Occasion, readonly Requirement[]>>> = {
  office: [officePiece('bottom', 'trousers', 1), officePiece('top', 'shirt', 2), officePiece('shoes', 'loafers', 1)],
  hiking_walking: [
    {
      parts: { category: 'shoes', subcategory: 'hiking_boots', color: ANY },
      count: 1,
      matches: (g) => g.category === 'shoes' && ['hiking_boots', 'sneakers'].includes(g.subcategory ?? ''),
    },
    {
      parts: { category: 'outerwear', subcategory: 'windbreaker', color: ANY },
      count: 1,
      matches: (g) => g.category === 'outerwear' && g.weather.some((w) => PROTECTIVE_WEATHER.includes(w)),
    },
  ],
};

function countActive(garments: readonly Garment[], predicate: (garment: Garment) => boolean): number {
  return garments.filter((garment) => !garment.archived && predicate(garment)).length;
}

function occasionCandidates(garments: readonly Garment[], occasions: readonly Occasion[]): Candidate[] {
  return occasions.flatMap((occasion) =>
    (OCCASION_REQUIREMENTS[occasion] ?? [])
      .filter((req) => countActive(garments, req.matches) < req.count)
      .map(
        (req): Candidate => ({
          parts: req.parts,
          reason: 'occasion_coverage',
          evidence: { lookIds: [], frequency: 0, occasion },
          priority: OCCASION_PRIORITY,
          unlocksLookCount: 0,
        }),
      ),
  );
}

// ---------- 3. Season coverage ----------

/** Concrete suggestion per season so the card says "trench coat", not just "outerwear". */
const SEASON_SUGGESTIONS: Readonly<Record<Season, Readonly<Record<'outerwear' | 'shoes' | 'top', string>>>> = {
  spring: { outerwear: 'trench_coat', shoes: 'sneakers', top: 't_shirt' },
  summer: { outerwear: 'denim_jacket', shoes: 'sandals', top: 't_shirt' },
  autumn: { outerwear: 'trench_coat', shoes: 'boots', top: 'shirt' },
  winter: { outerwear: 'coat', shoes: 'boots', top: 'shirt' },
};

const SEASON_MINIMUMS: readonly { category: 'outerwear' | 'shoes' | 'top'; count: number }[] = [
  { category: 'outerwear', count: 1 },
  { category: 'shoes', count: 1 },
  { category: 'top', count: 3 },
];

function seasonCandidates(garments: readonly Garment[], now: Date): Candidate[] {
  const current = seasonForDate(now);
  return [current, nextSeason(current)].flatMap((season) =>
    SEASON_MINIMUMS.filter(
      ({ category, count }) => countActive(garments, (g) => g.category === category && g.seasons.includes(season)) < count,
    ).map(
      ({ category }): Candidate => ({
        parts: { category, subcategory: SEASON_SUGGESTIONS[season][category], color: ANY },
        reason: 'season_coverage',
        evidence: { lookIds: [], frequency: 0, season },
        priority: SEASON_PRIORITY,
        unlocksLookCount: 0,
      }),
    ),
  );
}

// ---------- 4. Capsule core ----------

function capsuleCandidates(garments: readonly Garment[]): Candidate[] {
  return capsuleCoverage(garments).missingSpecs.map(({ category, subcategory, color }) => ({
    parts: { category, subcategory, color },
    reason: 'capsule_core',
    evidence: { lookIds: [], frequency: 0 },
    priority: CAPSULE_PRIORITY,
    unlocksLookCount: 0,
  }));
}

// ---------- 5. Dedupe, statuses, ranking ----------

function dedupe(candidates: readonly Candidate[]): Map<string, Candidate> {
  const groups = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const key = formatGapKey(candidate.parts);
    groups.set(key, [...(groups.get(key) ?? []), candidate]);
  }
  const merged = new Map<string, Candidate>();
  for (const [key, group] of groups) {
    const strongest = [...group].sort((a, b) => b.priority - a.priority)[0];
    if (!strongest) continue;
    const distinctReasons = new Set(group.map((c) => c.reason)).size;
    const bonus = distinctReasons > 1 ? MULTI_REASON_BONUS : 0;
    merged.set(key, {
      ...strongest,
      priority: Math.min(MAX_PRIORITY, strongest.priority + bonus),
      unlocksLookCount: Math.max(...group.map((c) => c.unlocksLookCount)),
    });
  }
  return merged;
}

function isDismissalActive(suggestion: GapSuggestion, now: Date): boolean {
  if (suggestion.status !== 'dismissed') return false;
  const changedAt = Date.parse(suggestion.statusChangedAt ?? suggestion.createdAt);
  return now.getTime() - changedAt < DISMISS_HIDE_DAYS * DAY_MS;
}

function isNowOwned(previous: GapSuggestion, garments: readonly Garment[]): boolean {
  const parts = parseGapKey(previous.key);
  return parts !== undefined && garments.some((garment) => garmentSatisfies(garment, parts));
}

/** Title is a language-neutral fallback; the UI renders a localised title from category/subcategory/color. */
function fallbackTitle(parts: GapKeyParts, color: string | undefined): string {
  return [color ?? (parts.color === ANY ? undefined : parts.color), parts.subcategory ?? parts.category]
    .filter(Boolean)
    .join(' ');
}

function toSuggestion(key: string, candidate: Candidate, previous: GapSuggestion | undefined, now: Date): GapSuggestion {
  const nowIso = now.toISOString();
  const reopened = previous?.status === 'dismissed' && !isDismissalActive(previous, now);
  const keepStatus = previous !== undefined && !reopened;
  return {
    id: previous?.id ?? `gap:${key}`,
    key,
    category: candidate.parts.category,
    subcategory: candidate.parts.subcategory,
    color: candidate.color ?? (candidate.parts.color === ANY ? undefined : candidate.parts.color),
    title: fallbackTitle(candidate.parts, candidate.color),
    reason: candidate.reason,
    evidence: candidate.evidence,
    priority: candidate.priority,
    unlocksLookCount: candidate.unlocksLookCount,
    status: keepStatus ? previous.status : 'open',
    statusChangedAt: keepStatus ? previous.statusChangedAt : nowIso,
    createdAt: previous?.createdAt ?? nowIso,
  };
}

export function analyzeGaps(input: GapAnalysisInput): GapAnalysisResult {
  const { garments, looks, frequentOccasions, previous, now } = input;
  const candidates = dedupe([
    ...inspirationCandidates(looks),
    ...occasionCandidates(garments, frequentOccasions),
    ...seasonCandidates(garments, now),
    ...capsuleCandidates(garments),
  ]);
  const previousByKey = new Map(previous.map((s) => [s.key, s]));

  const current = [...candidates].map(([key, candidate]) => toSuggestion(key, candidate, previousByKey.get(key), now));
  const acquired = previous
    .filter((s) => !candidates.has(s.key) && (s.status === 'open' || s.status === 'planned') && isNowOwned(s, garments))
    .map((s): GapSuggestion => ({ ...s, status: 'acquired', statusChangedAt: now.toISOString() }));
  const retained = previous.filter(
    (s) => !candidates.has(s.key) && !acquired.some((a) => a.key === s.key) && s.status !== 'open',
  );

  const all = [...current, ...acquired, ...retained];
  const visible = current
    .filter((s) => s.status === 'open' || s.status === 'planned')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_VISIBLE_SUGGESTIONS);
  return { visible, all };
}
