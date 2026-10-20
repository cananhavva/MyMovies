import { foldCase } from './text';

/**
 * Canonical colour vocabulary. AI and users may produce free text; we normalise to these keys so
 * matching and gap keys stay stable across languages.
 */
export const COLORS = [
  'black',
  'charcoal',
  'grey',
  'white',
  'ivory',
  'beige',
  'camel',
  'sand',
  'brown',
  'navy',
  'blue',
  'light_blue',
  'green',
  'olive',
  'red',
  'burgundy',
  'pink',
  'purple',
  'yellow',
  'orange',
  'gold',
  'silver',
  'multicolor',
] as const;

export type Color = (typeof COLORS)[number];

export type ColorFamily =
  | 'black'
  | 'white'
  | 'grey'
  | 'beige'
  | 'brown'
  | 'blue'
  | 'green'
  | 'red'
  | 'pink'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'metallic'
  | 'multi';

const COLOR_FAMILY: Readonly<Record<Color, ColorFamily>> = {
  black: 'black',
  charcoal: 'black',
  grey: 'grey',
  white: 'white',
  ivory: 'white',
  beige: 'beige',
  camel: 'beige',
  sand: 'beige',
  brown: 'brown',
  navy: 'blue',
  blue: 'blue',
  light_blue: 'blue',
  green: 'green',
  olive: 'green',
  red: 'red',
  burgundy: 'red',
  pink: 'pink',
  purple: 'purple',
  yellow: 'yellow',
  orange: 'orange',
  gold: 'metallic',
  silver: 'metallic',
  multicolor: 'multi',
};

const NEUTRAL_COLORS: ReadonlySet<Color> = new Set([
  'black',
  'charcoal',
  'grey',
  'white',
  'ivory',
  'beige',
  'camel',
  'sand',
  'brown',
  'navy',
]);

const COLOR_SYNONYMS_RAW: Readonly<Record<string, Color>> = {
  siyah: 'black',
  antrasit: 'charcoal',
  'koyu gri': 'charcoal',
  gri: 'grey',
  gray: 'grey',
  beyaz: 'white',
  ekru: 'ivory',
  krem: 'ivory',
  cream: 'ivory',
  bej: 'beige',
  taba: 'camel',
  kum: 'sand',
  kahverengi: 'brown',
  kahve: 'brown',
  lacivert: 'navy',
  mavi: 'blue',
  'açık mavi': 'light_blue',
  'light blue': 'light_blue',
  denim: 'blue',
  yeşil: 'green',
  haki: 'olive',
  khaki: 'olive',
  kırmızı: 'red',
  bordo: 'burgundy',
  pembe: 'pink',
  mor: 'purple',
  sarı: 'yellow',
  turuncu: 'orange',
  altın: 'gold',
  gümüş: 'silver',
  'çok renkli': 'multicolor',
};

/** Keys are case-folded once so lookups ignore case, including "I"/"ı" (see foldCase). */
const COLOR_SYNONYMS: Readonly<Record<string, Color>> = Object.fromEntries(
  Object.entries(COLOR_SYNONYMS_RAW).map(([name, color]) => [foldCase(name), color]),
);

export function isColor(value: string): value is Color {
  return (COLORS as readonly string[]).includes(value);
}

/** Maps free text ("Lacivert", "light-blue") to a canonical colour, or undefined when unknown. */
export function normalizeColor(raw: string): Color | undefined {
  const cleaned = foldCase(raw.trim()).replace(/[\s_-]+/g, ' ');
  const underscored = cleaned.replace(/ /g, '_');
  if (isColor(underscored)) return underscored;
  return COLOR_SYNONYMS[cleaned];
}

export function normalizeColors(raw: readonly string[]): Color[] {
  const normalized = raw.map(normalizeColor).filter((c): c is Color => c !== undefined);
  return [...new Set(normalized)];
}

export function colorFamily(color: string): ColorFamily | undefined {
  const normalized = normalizeColor(color);
  return normalized ? COLOR_FAMILY[normalized] : undefined;
}

export function isNeutral(color: string): boolean {
  const normalized = normalizeColor(color);
  return normalized !== undefined && NEUTRAL_COLORS.has(normalized);
}
