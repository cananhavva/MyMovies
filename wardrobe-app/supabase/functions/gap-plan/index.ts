import { callClaudeJson } from '../_shared/claude.ts';
import { serveAiEndpoint } from '../_shared/handler.ts';
import { GAP_PLAN_SCHEMA } from '../_shared/jsonSchemas.ts';
import { GAP_PLAN_PROMPT } from '../_shared/prompts.ts';

const MAX_SUMMARY_CHARS = 8_000;

/** Receives only an aggregated, non-personal wardrobe summary (no photos). */
serveAiEndpoint(async (body) =>
  callClaudeJson({
    tier: 'fast',
    effort: 'low',
    system: GAP_PLAN_PROMPT,
    text: JSON.stringify(body).slice(0, MAX_SUMMARY_CHARS),
    schema: GAP_PLAN_SCHEMA,
  }),
);
