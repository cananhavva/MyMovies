import type { InfluencerPlatform } from '@/domain/types';
import { hostnameOf } from './urlValidation';

export type LinkKind = 'profile' | 'post' | 'unknown';

export interface PlatformInfo {
  platform: InfluencerPlatform;
  kind: LinkKind;
  handle?: string;
  /** Instagram/TikTok cannot be read automatically (no scraping), only saved + screenshots. */
  restricted: boolean;
  /** Pinterest/LTK pages usually expose og:image which we may try to fetch. */
  supportsOgImage: boolean;
}

interface PlatformRule {
  platform: Exclude<InfluencerPlatform, 'other'>;
  matchesHost: (host: string) => boolean;
  restricted: boolean;
  supportsOgImage: boolean;
  /** Path segments that are never a profile handle on this platform. */
  postSegments: readonly string[];
}

const PLATFORM_RULES: readonly PlatformRule[] = [
  {
    platform: 'instagram',
    matchesHost: (host) => host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'instagr.am',
    restricted: true,
    supportsOgImage: false,
    postSegments: ['p', 'reel', 'reels', 'tv', 'stories', 'explore'],
  },
  {
    platform: 'tiktok',
    matchesHost: (host) => host === 'tiktok.com' || host.endsWith('.tiktok.com'),
    restricted: true,
    supportsOgImage: false,
    postSegments: ['video', 't', 'tag', 'music', 'discover'],
  },
  {
    platform: 'pinterest',
    // pinterest.com, pinterest.de, pinterest.co.uk, pinterest.com.au … but not pinterest.evil.com.
    matchesHost: (host) => /(^|\.)pinterest\.(com|[a-z]{2}|(co|com)\.[a-z]{2})$/.test(host) || host === 'pin.it',
    restricted: false,
    supportsOgImage: true,
    postSegments: ['pin', 'search', 'ideas'],
  },
  {
    platform: 'ltk',
    matchesHost: (host) => host === 'shopltk.com' || host === 'liketoknow.it' || host.endsWith('.shopltk.com'),
    restricted: false,
    supportsOgImage: true,
    postSegments: ['post', 'p', 'products'],
  },
];

function pathSegments(url: string): string[] {
  try {
    return new URL(url).pathname.split('/').filter(Boolean);
  } catch {
    return [];
  }
}

function classify(rule: PlatformRule, host: string, segments: readonly string[]): { kind: LinkKind; handle?: string } {
  // pin.it short links always point to a single pin.
  if (host === 'pin.it') return { kind: 'post' };
  const [first, second, third] = segments;
  if (!first) return { kind: 'unknown' };
  const lowerFirst = first.toLowerCase();

  if (rule.platform === 'ltk' && lowerFirst === 'explore' && second) {
    return third ? { kind: 'post', handle: second } : { kind: 'profile', handle: second };
  }
  if (rule.postSegments.includes(lowerFirst)) return { kind: 'post' };
  if (rule.platform === 'tiktok') {
    if (!first.startsWith('@')) return { kind: 'unknown' };
    return { kind: second ? 'post' : 'profile', handle: first.slice(1) };
  }
  const handle = first.replace(/^@/, '');
  return { kind: second ? 'post' : 'profile', handle };
}

export function detectPlatform(url: string): PlatformInfo {
  const host = hostnameOf(url);
  const rule = host ? PLATFORM_RULES.find((r) => r.matchesHost(host)) : undefined;
  if (!host || !rule) return { platform: 'other', kind: 'unknown', restricted: false, supportsOgImage: false };
  const { kind, handle } = classify(rule, host, pathSegments(url));
  return { platform: rule.platform, kind, handle, restricted: rule.restricted, supportsOgImage: rule.supportsOgImage };
}
