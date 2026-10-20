export const AI_MODELS = { fast: 'claude-sonnet-5-5', deep: 'claude-opus-5-5' } as const;
export type AiModelTier = keyof typeof AI_MODELS;

export const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';
/** Server-side refusal fallback ("default" routing); see Anthropic docs on refusals and fallbacks. */
export const ANTHROPIC_FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/** Extraction answers are small JSON objects; thinking at low effort fits comfortably. */
export const AI_MAX_OUTPUT_TOKENS = 4096;

export const AI_TIMEOUT_MS = 30_000;
export const LINK_FETCH_TIMEOUT_MS = 10_000;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;
export const MAX_INSPIRATION_IMAGES = 10;

/** Per-plan retry schedule: the delays before each automatic retry. */
export const RETRY_DELAYS_MS = {
  AI_TIMEOUT: [2_000],
  AI_OVERLOADED: [2_000, 6_000],
  SERVER_5XX: [2_000, 6_000],
} as const;
