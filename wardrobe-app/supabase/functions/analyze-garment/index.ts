import { callClaudeJson } from '../_shared/claude.ts';
import { serveAiEndpoint } from '../_shared/handler.ts';
import { HttpError } from '../_shared/http.ts';
import { GARMENT_SCHEMA } from '../_shared/jsonSchemas.ts';
import { GARMENT_PROMPT } from '../_shared/prompts.ts';
import { optionalImage, optionalText } from '../_shared/validation.ts';

serveAiEndpoint(async (body) => {
  const image = optionalImage(body.image);
  const text = optionalText(body.text);
  if (!image && !text) throw new HttpError('IMAGE_UNSUPPORTED');
  return callClaudeJson({
    tier: 'fast',
    effort: 'low',
    system: GARMENT_PROMPT,
    images: image ? [image] : [],
    text: text ? `User notes: ${text}` : 'Describe this item.',
    schema: GARMENT_SCHEMA,
  });
});
