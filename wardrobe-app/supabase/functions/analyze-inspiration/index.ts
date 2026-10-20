import { callClaudeJson } from '../_shared/claude.ts';
import { serveAiEndpoint } from '../_shared/handler.ts';
import { INSPIRATION_SCHEMA } from '../_shared/jsonSchemas.ts';
import { INSPIRATION_PROMPT } from '../_shared/prompts.ts';
import { imageList, optionalText } from '../_shared/validation.ts';

serveAiEndpoint(async (body) => {
  const images = imageList(body.images);
  const sourceUrl = optionalText(body.sourceUrl);
  return callClaudeJson({
    tier: 'deep',
    effort: 'medium',
    system: INSPIRATION_PROMPT,
    images,
    text: sourceUrl ? `Source: ${sourceUrl}` : 'List the outfit pieces.',
    schema: INSPIRATION_SCHEMA,
  });
});
