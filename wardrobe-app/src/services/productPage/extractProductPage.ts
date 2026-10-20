// NOTE: supabase/functions/_shared/extractProductPage.ts is a copy for the Deno proxy; keep both in sync.

export interface ProductPageData {
  title?: string;
  description?: string;
  imageUrl?: string;
  /** schema.org Product objects found in JSON-LD, as compact JSON strings. */
  jsonLdProducts: string[];
  /** Visible body text, whitespace-collapsed and truncated. */
  visibleText: string;
}

const MAX_VISIBLE_TEXT = 8_000;
const MAX_JSON_LD_LENGTH = 6_000;
const MIN_MEANINGFUL_TEXT = 200;

const BLOCK_MARKERS = [
  'captcha',
  'cf-chl',
  'challenge-platform',
  'access denied',
  'are you a robot',
  'robot olmadığınızı',
  'unusual traffic',
  'px-captcha',
];

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(text: string): string {
  return text
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function metaContent(html: string, key: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() !== key) continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1];
    if (content) return decodeEntities(content.trim());
  }
  return undefined;
}

function isProductNode(node: unknown): boolean {
  if (typeof node !== 'object' || node === null || !('@type' in node)) return false;
  const type = node['@type'];
  return type === 'Product' || (Array.isArray(type) && type.includes('Product'));
}

function collectProducts(node: unknown, found: unknown[]): void {
  if (Array.isArray(node)) {
    node.forEach((child) => collectProducts(child, found));
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  if (isProductNode(node)) found.push(node);
  if ('@graph' in node) collectProducts(node['@graph'], found);
}

function jsonLdProducts(html: string): string[] {
  const scripts = [...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const products: unknown[] = [];
  for (const [, body] of scripts) {
    try {
      collectProducts(JSON.parse(body ?? ''), products);
    } catch {
      // Malformed JSON-LD is common; the other sources still apply.
    }
  }
  return products.map((product) => JSON.stringify(product).slice(0, MAX_JSON_LD_LENGTH));
}

export function visibleTextOf(html: string): string {
  const withoutHidden = html
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const text = decodeEntities(withoutHidden.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '));
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_VISIBLE_TEXT);
}

export function extractProductPage(html: string): ProductPageData {
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return {
    title: metaContent(html, 'og:title') ?? (titleTag ? decodeEntities(titleTag.trim()) : undefined),
    description: metaContent(html, 'og:description') ?? metaContent(html, 'description'),
    imageUrl: metaContent(html, 'og:image') ?? metaContent(html, 'twitter:image'),
    jsonLdProducts: jsonLdProducts(html),
    visibleText: visibleTextOf(html),
  };
}

/** Bot walls and JS-only shells return 200 with nothing useful; treat them as blocked. */
export function looksBlocked(html: string, data: ProductPageData): boolean {
  const lower = html.slice(0, 50_000).toLowerCase();
  if (BLOCK_MARKERS.some((marker) => lower.includes(marker)) && data.jsonLdProducts.length === 0) return true;
  return data.jsonLdProducts.length === 0 && !data.title && data.visibleText.length < MIN_MEANINGFUL_TEXT;
}

export function productPageToPrompt(url: string, data: ProductPageData): string {
  return [
    `URL: ${url}`,
    data.title ? `Title: ${data.title}` : undefined,
    data.description ? `Description: ${data.description}` : undefined,
    data.imageUrl ? `og:image: ${data.imageUrl}` : undefined,
    ...data.jsonLdProducts.map((product) => `JSON-LD Product: ${product}`),
    `Visible text: ${data.visibleText}`,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');
}
