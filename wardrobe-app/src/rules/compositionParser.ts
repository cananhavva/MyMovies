import type { FiberPart, FiberType } from '@/domain/types';
import { FIBER_SYNONYMS } from './fiberSynonyms';

export interface ParsedComposition {
  /** Outer fabric only; this is what the quality score uses. */
  shell: FiberPart[];
  lining: FiberPart[];
  /** Percent sum of the shell as written on the label, before normalisation. */
  shellTotalPercent: number;
  /** True when the shell total was outside 95–105 % and was rescaled to 100. */
  normalized: boolean;
  /** Words next to a percentage that matched no known fibre (counted as `other`). */
  unrecognized: string[];
  /** A composition is usable for scoring only when at least half of it was understood. */
  usable: boolean;
}

type SectionKind = 'shell' | 'lining' | 'ignored';

const SECTION_MARKERS: Readonly<Record<SectionKind, readonly string[]>> = {
  shell: [
    'dis kumas',
    'ana kumas',
    'dis',
    'govde',
    'outer shell',
    'shell',
    'outer',
    'main fabric',
    'main',
    'body',
    'aussenstoff',
    'oberstoff',
    'obermaterial',
    'exterieur',
    'tissu principal',
    'exterior',
    'tejido principal',
    'esterno',
    'tessuto principale',
  ],
  lining: ['astar', 'lining', 'futter', 'doublure', 'forro', 'fodera'],
  ignored: [
    'dolgu',
    'filling',
    'padding',
    'wattierung',
    'fullung',
    'rembourrage',
    'relleno',
    'imbottitura',
    'ribana',
    'rib',
    'trim',
    'cep',
    'pocket',
    'tasche',
    'poche',
    'bolsillo',
    'tasca',
  ],
};

const NORMALIZE_MIN_TOTAL = 95;
const NORMALIZE_MAX_TOTAL = 105;
const MIN_USABLE_TOTAL = 50;

/** Whole digit runs, so "1000%" is seen as one (implausible) number rather than as "000%". */
const PERCENT_PATTERN = /%\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*%/g;
const MAX_PERCENT_INTEGER_DIGITS = 3;

/** Lowercases and strips diacritics so "Yün", "YUN" and "yün" compare equal and `\b` works. */
export function normalizeLabelText(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

interface SynonymEntry {
  fiber: FiberType;
  term: string;
}

const SYNONYMS_LONGEST_FIRST: readonly SynonymEntry[] = (Object.keys(FIBER_SYNONYMS) as FiberType[])
  .flatMap((fiber) => FIBER_SYNONYMS[fiber].map((term) => ({ fiber, term: normalizeLabelText(term) })))
  .sort((a, b) => b.term.length - a.term.length);

const isLetter = (char: string | undefined): boolean => char !== undefined && /\p{L}/u.test(char);

function fiberAtStart(fragment: string): FiberType | undefined {
  const text = fragment.replace(/^[^\p{L}]+/u, '');
  const entry = SYNONYMS_LONGEST_FIRST.find(({ term }) => text.startsWith(term) && !isLetter(text[term.length]));
  return entry?.fiber;
}

function fiberAtEnd(fragment: string): FiberType | undefined {
  const text = fragment.replace(/[^\p{L}]+$/u, '');
  const entry = SYNONYMS_LONGEST_FIRST.find(
    ({ term }) => text.endsWith(term) && !isLetter(text[text.length - term.length - 1]),
  );
  return entry?.fiber;
}

function firstWord(fragment: string): string | undefined {
  return fragment.match(/\p{L}[\p{L}\s-]*/u)?.[0]?.trim();
}

function lastWord(fragment: string): string | undefined {
  return fragment.match(/\p{L}[\p{L}-]*(?=[^\p{L}]*$)/u)?.[0];
}

interface PercentMatch {
  value: number;
  /** False for numbers like "1000" that cannot be a percentage (typos, article numbers). */
  plausible: boolean;
  start: number;
  end: number;
}

function findPercentages(segment: string): PercentMatch[] {
  return [...segment.matchAll(PERCENT_PATTERN)].map((match) => {
    const raw = match[1] ?? match[2] ?? '0';
    return {
      value: Number(raw.replace(',', '.')),
      plausible: (raw.split(/[.,]/)[0] ?? '').length <= MAX_PERCENT_INTEGER_DIGITS,
      start: match.index,
      end: match.index + match[0].length,
    };
  });
}

interface SegmentParse {
  parts: FiberPart[];
  unrecognized: string[];
}

/**
 * Labels are written either "80% wool" (percent first) or "wool 80%" (fibre first). The layout
 * is decided once per segment from the first percentage, so "wool 80% polyamide 20%" is not
 * misread as "80% polyamide".
 */
function parseSegment(segment: string): SegmentParse {
  const matches = findPercentages(segment);
  const first = matches[0];
  if (!first) return { parts: [], unrecognized: [] };
  const fiberFirst = fiberAtEnd(segment.slice(0, first.start)) !== undefined;

  const parts: FiberPart[] = [];
  const unrecognized: string[] = [];
  matches.forEach((match, index) => {
    if (!match.plausible) return;
    const previousEnd = index === 0 ? 0 : (matches[index - 1]?.end ?? 0);
    const nextStart = matches[index + 1]?.start ?? segment.length;
    const fragment = fiberFirst ? segment.slice(previousEnd, match.start) : segment.slice(match.end, nextStart);
    const fiber = fiberFirst ? fiberAtEnd(fragment) : fiberAtStart(fragment);
    if (fiber) {
      parts.push({ fiber, percent: match.value });
      return;
    }
    const word = fiberFirst ? lastWord(fragment) : firstWord(fragment);
    if (word) {
      unrecognized.push(word);
      parts.push({ fiber: 'other', percent: match.value });
    }
  });
  return { parts, unrecognized };
}

const MARKER_PATTERN = new RegExp(
  `\\b(${(Object.values(SECTION_MARKERS) as string[][])
    .flat()
    .sort((a, b) => b.length - a.length)
    .map((marker) => marker.replace(/\s+/g, '\\s+'))
    .join('|')})\\b\\s*(?::|(?=%|\\d))`,
  'g',
);

function sectionKindOf(marker: string): SectionKind {
  const compact = marker.replace(/\s+/g, ' ');
  const kinds = Object.keys(SECTION_MARKERS) as SectionKind[];
  return kinds.find((kind) => SECTION_MARKERS[kind].includes(compact)) ?? 'ignored';
}

/** Text before any section marker is treated as shell, which covers single-section labels. */
function splitSections(text: string): Record<SectionKind, string> {
  const sections: Record<SectionKind, string> = { shell: '', lining: '', ignored: '' };
  let currentKind: SectionKind = 'shell';
  let cursor = 0;
  for (const match of text.matchAll(MARKER_PATTERN)) {
    sections[currentKind] += ` ${text.slice(cursor, match.index)}`;
    currentKind = sectionKindOf(match[1] ?? '');
    cursor = match.index + match[0].length;
  }
  sections[currentKind] += ` ${text.slice(cursor)}`;
  return sections;
}

function mergeSameFiber(parts: readonly FiberPart[]): FiberPart[] {
  const totals = new Map<FiberType, number>();
  for (const { fiber, percent } of parts) totals.set(fiber, (totals.get(fiber) ?? 0) + percent);
  return [...totals.entries()].map(([fiber, percent]) => ({ fiber, percent }));
}

export function sumPercent(parts: readonly FiberPart[]): number {
  return parts.reduce((total, part) => total + part.percent, 0);
}

const roundTo2 = (value: number): number => Math.round(value * 100) / 100;

/** Rescales to 100 % when the total is outside the tolerance band (label typos, rounding). */
export function normalizeComposition(parts: readonly FiberPart[]): { parts: FiberPart[]; normalized: boolean } {
  const total = sumPercent(parts);
  if (total === 0 || (total >= NORMALIZE_MIN_TOTAL && total <= NORMALIZE_MAX_TOTAL)) {
    return { parts: [...parts], normalized: false };
  }
  return {
    parts: parts.map((part) => ({ ...part, percent: roundTo2((part.percent / total) * 100) })),
    normalized: true,
  };
}

export function isCompositionUsable(parts: readonly FiberPart[]): boolean {
  return sumPercent(parts) >= MIN_USABLE_TOTAL;
}

const byPercentDesc = (a: FiberPart, b: FiberPart): number => b.percent - a.percent;

export function parseComposition(rawText: string): ParsedComposition {
  const sections = splitSections(normalizeLabelText(rawText));
  const shellParse = parseSegment(sections.shell);
  const liningParse = parseSegment(sections.lining);
  const shell = mergeSameFiber(shellParse.parts);
  const shellTotalPercent = sumPercent(shell);
  const usable = shellTotalPercent >= MIN_USABLE_TOTAL;
  const { parts: normalizedShell, normalized } = usable
    ? normalizeComposition(shell)
    : { parts: shell, normalized: false };

  return {
    shell: normalizedShell.sort(byPercentDesc),
    lining: mergeSameFiber(liningParse.parts).sort(byPercentDesc),
    shellTotalPercent,
    normalized,
    unrecognized: [...shellParse.unrecognized, ...liningParse.unrecognized],
    usable,
  };
}
