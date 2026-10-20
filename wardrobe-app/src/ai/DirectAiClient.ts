import { AI_TIMEOUT_MS, ANTHROPIC_FALLBACK_BETA, ANTHROPIC_MESSAGES_URL, ANTHROPIC_VERSION, MAX_INSPIRATION_IMAGES, type AiModelTier } from '@/config/ai';
import type { CapsulePlanText, GarmentAnalysis, InspirationAnalysis, ProductAnalysis, Result } from '@/domain/types';
import { err, fail } from '@/errors/result';
import { productPageToPrompt, type ProductPageData } from '@/services/productPage/extractProductPage';
import type {
  AiClient,
  AnalyzeGarmentInput,
  AnalyzeInspirationInput,
  AnalyzeProductPageInput,
  CallOptions,
  GapPlanInput,
} from './AiClient';
import { buildClaudeRequest, imageBlock, readAnswerText, textBlock, type ClaudeResponseBody, type ContentBlock, type Effort } from './claudeMessages';
import { fetchWithTimeout } from './fetchWithTimeout';
import { aiErrorForStatus } from './httpErrors';
import type { FetchProductPage, ReadImage } from './ports';
import { requireGarment, requireOutfit } from './postprocess';
import {
  GAP_PLAN_SYSTEM_PROMPT,
  GARMENT_SYSTEM_PROMPT,
  INSPIRATION_SYSTEM_PROMPT,
  PRODUCT_SYSTEM_PROMPT,
} from './prompts';
import { requestJson, type SendMessages } from './requestJson';
import { withRetry } from './retryPolicy';
import {
  capsulePlanTextSchema,
  garmentAnalysisSchema,
  inspirationAnalysisSchema,
  lenientGarmentAnalysisSchema,
  lenientInspirationAnalysisSchema,
  productAnalysisSchema,
} from './schemas';

interface TaskProfile {
  tier: AiModelTier;
  effort: Effort;
  system: string;
}

const TASKS = {
  garment: { tier: 'fast', effort: 'low', system: GARMENT_SYSTEM_PROMPT },
  product: { tier: 'fast', effort: 'low', system: PRODUCT_SYSTEM_PROMPT },
  inspiration: { tier: 'deep', effort: 'medium', system: INSPIRATION_SYSTEM_PROMPT },
  gapPlan: { tier: 'fast', effort: 'low', system: GAP_PLAN_SYSTEM_PROMPT },
} as const satisfies Record<string, TaskProfile>;

/**
 * Developer "bring your own key" client: calls the Anthropic API straight from the device with a
 * key kept in the keychain. Never enabled in production builds.
 */
export class DirectAiClient implements AiClient {
  readonly kind = 'direct';

  constructor(
    private readonly deps: {
      apiKey: string;
      readImage: ReadImage;
      fetchProductPage: FetchProductPage;
    },
  ) {}

  async analyzeGarment(input: AnalyzeGarmentInput, options: CallOptions = {}): Promise<Result<GarmentAnalysis>> {
    const content: ContentBlock[] = [];
    if (input.imageUri) {
      const image = await this.deps.readImage(input.imageUri);
      if (!image.ok) return image;
      content.push(imageBlock(image.value.base64, image.value.mediaType));
    }
    content.push(textBlock(input.text ? `User notes: ${input.text}` : 'Describe this item.'));
    const result = await withRetry(
      () =>
        requestJson({
          send: this.sender(TASKS.garment, options.signal),
          messages: [{ role: 'user', content }],
          schema: garmentAnalysisSchema,
          lenientSchema: lenientGarmentAnalysisSchema,
        }),
      { signal: options.signal },
    );
    return requireGarment(result);
  }

  /** An empty `url` means "label photo / pasted text only" (used to read a care label). */
  async analyzeProductPage(input: AnalyzeProductPageInput, options: CallOptions = {}): Promise<Result<ProductAnalysis>> {
    const hasFallbackSource = Boolean(input.pastedText || input.labelImageUri);
    const page = input.url ? await this.deps.fetchProductPage(input.url, options.signal) : undefined;
    if (page && !page.ok && (!hasFallbackSource || page.error.code === 'USER_CANCELLED')) return page;
    const pageData = page?.ok ? page.value : undefined;

    const content: ContentBlock[] = [];
    if (input.labelImageUri) {
      const label = await this.deps.readImage(input.labelImageUri);
      if (!label.ok) return label;
      content.push(imageBlock(label.value.base64, label.value.mediaType));
    }
    content.push(textBlock(this.productPrompt(input, pageData)));

    const result = await withRetry(
      () =>
        requestJson({
          send: this.sender(TASKS.product, options.signal),
          messages: [{ role: 'user', content }],
          schema: productAnalysisSchema,
        }),
      { signal: options.signal },
    );
    if (!result.ok || !pageData) return result;
    return { ok: true, value: { ...result.value, imageUrl: result.value.imageUrl ?? pageData.imageUrl } };
  }

  async analyzeInspiration(input: AnalyzeInspirationInput, options: CallOptions = {}): Promise<Result<InspirationAnalysis>> {
    const content: ContentBlock[] = [];
    for (const uri of input.imageUris.slice(0, MAX_INSPIRATION_IMAGES)) {
      const image = await this.deps.readImage(uri);
      if (!image.ok) return image;
      content.push(imageBlock(image.value.base64, image.value.mediaType));
    }
    if (content.length === 0) return fail('INSPIRATION_NO_OUTFIT');
    content.push(textBlock(input.sourceUrl ? `Source: ${input.sourceUrl}` : 'List the outfit pieces.'));
    const result = await withRetry(
      () =>
        requestJson({
          send: this.sender(TASKS.inspiration, options.signal),
          messages: [{ role: 'user', content }],
          schema: inspirationAnalysisSchema,
          lenientSchema: lenientInspirationAnalysisSchema,
        }),
      { signal: options.signal },
    );
    return requireOutfit(result);
  }

  gapPlan(input: GapPlanInput, options: CallOptions = {}): Promise<Result<CapsulePlanText>> {
    return withRetry(
      () =>
        requestJson({
          send: this.sender(TASKS.gapPlan, options.signal),
          messages: [{ role: 'user', content: JSON.stringify(input) }],
          schema: capsulePlanTextSchema,
        }),
      { signal: options.signal },
    );
  }

  private productPrompt(input: AnalyzeProductPageInput, page: ProductPageData | undefined): string {
    return [
      page ? productPageToPrompt(input.url, page) : input.url ? `URL: ${input.url} (page could not be loaded)` : undefined,
      input.pastedText ? `Text pasted by the user: ${input.pastedText}` : undefined,
      input.labelImageUri ? 'The attached photo is the care label.' : undefined,
    ]
      .filter((line): line is string => line !== undefined)
      .join('\n\n');
  }

  private sender(task: TaskProfile, signal: AbortSignal | undefined): SendMessages {
    return async (messages) => {
      const response = await fetchWithTimeout(
        ANTHROPIC_MESSAGES_URL,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.deps.apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'anthropic-beta': ANTHROPIC_FALLBACK_BETA,
          },
          body: JSON.stringify(buildClaudeRequest({ ...task, messages })),
        },
        { timeoutMs: AI_TIMEOUT_MS, timeoutCode: 'AI_TIMEOUT', signal },
      );
      if (!response.ok) return response;
      if (!response.value.ok) {
        return err(aiErrorForStatus(response.value.status, response.value.headers.get('retry-after')));
      }
      try {
        return readAnswerText((await response.value.json()) as ClaudeResponseBody);
      } catch {
        return fail('AI_INVALID_RESPONSE', { cause: 'non-JSON HTTP body' });
      }
    };
  }
}
