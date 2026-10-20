import { callClaudeJson } from '../_shared/claude.ts';
import { productPageToPrompt, type ProductPageData } from '../_shared/extractProductPage.ts';
import { fetchProductPage } from '../_shared/fetchPage.ts';
import { serveAiEndpoint } from '../_shared/handler.ts';
import { HttpError } from '../_shared/http.ts';
import { PRODUCT_SCHEMA } from '../_shared/jsonSchemas.ts';
import { PRODUCT_PROMPT } from '../_shared/prompts.ts';
import { optionalImage, optionalText } from '../_shared/validation.ts';

/**
 * URL → server-side fetch → JSON-LD / og / visible text → Claude. If the shop blocks us but the
 * user also sent a label photo or pasted text, we continue with those (plan flow B).
 * An empty url means "label photo / pasted text only".
 */
serveAiEndpoint(async (body) => {
  const url = optionalText(body.url);
  const pastedText = optionalText(body.pastedText);
  const labelImage = optionalImage(body.labelImage);
  const hasFallback = Boolean(pastedText || labelImage);
  if (!url && !hasFallback) throw new HttpError('LINK_INVALID');

  let page: ProductPageData | undefined;
  if (url) {
    try {
      page = await fetchProductPage(url);
    } catch (error) {
      if (!hasFallback || (error instanceof HttpError && error.code === 'LINK_INVALID')) throw error;
    }
  }

  const prompt = [
    page && url ? productPageToPrompt(url, page) : url ? `URL: ${url} (page could not be loaded)` : undefined,
    pastedText ? `Text pasted by the user: ${pastedText}` : undefined,
    labelImage ? 'The attached photo is the care label.' : undefined,
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n\n');

  const analysis = await callClaudeJson({
    tier: 'fast',
    effort: 'low',
    system: PRODUCT_PROMPT,
    images: labelImage ? [labelImage] : [],
    text: prompt,
    schema: PRODUCT_SCHEMA,
  });
  if (page?.imageUrl && typeof analysis === 'object' && analysis !== null && !('imageUrl' in analysis)) {
    return { ...analysis, imageUrl: page.imageUrl };
  }
  return analysis;
});
