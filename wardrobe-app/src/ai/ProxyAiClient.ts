import type { z } from 'zod';
import { MAX_INSPIRATION_IMAGES } from '@/config/ai';
import type { CapsulePlanText, GarmentAnalysis, InspirationAnalysis, ProductAnalysis, Result } from '@/domain/types';
import { appError, isAppError } from '@/errors/AppError';
import { err, fail, ok } from '@/errors/result';
import type {
  AiClient,
  AnalyzeGarmentInput,
  AnalyzeInspirationInput,
  AnalyzeProductPageInput,
  CallOptions,
  GapPlanInput,
} from './AiClient';
import { fetchWithTimeout } from './fetchWithTimeout';
import { aiErrorForStatus } from './httpErrors';
import { formatZodIssues } from './parseJson';
import type { EncodedImage, ReadImage } from './ports';
import { requireGarment, requireOutfit } from './postprocess';
import { capsulePlanTextSchema, garmentAnalysisSchema, inspirationAnalysisSchema, productAnalysisSchema } from './schemas';

type Endpoint = 'analyze-garment' | 'analyze-product-page' | 'analyze-inspiration' | 'gap-plan';

/** Covers the proxy's own page fetch (10 s) plus one Claude call (30 s) and network overhead. */
const PROXY_TIMEOUT_MS = 45_000;

interface ProxyErrorBody {
  error?: { code?: unknown; retryAfterSec?: unknown };
}

/**
 * Production client: calls our Supabase Edge Functions, which hold the Anthropic key, enforce the
 * per-device quota and constrain the answer with structured outputs.
 */
export class ProxyAiClient implements AiClient {
  readonly kind = 'proxy';

  constructor(
    private readonly deps: {
      functionsBaseUrl: string;
      anonKey: string;
      getDeviceId: () => Promise<string>;
      readImage: ReadImage;
    },
  ) {}

  async analyzeGarment(input: AnalyzeGarmentInput, options: CallOptions = {}): Promise<Result<GarmentAnalysis>> {
    const image = input.imageUri ? await this.deps.readImage(input.imageUri) : undefined;
    if (image && !image.ok) return image;
    const result = await this.call('analyze-garment', { image: image?.value, text: input.text }, garmentAnalysisSchema, options);
    return requireGarment(result);
  }

  async analyzeProductPage(input: AnalyzeProductPageInput, options: CallOptions = {}): Promise<Result<ProductAnalysis>> {
    const label = input.labelImageUri ? await this.deps.readImage(input.labelImageUri) : undefined;
    if (label && !label.ok) return label;
    const body = { url: input.url, pastedText: input.pastedText, labelImage: label?.value };
    return this.call('analyze-product-page', body, productAnalysisSchema, options);
  }

  async analyzeInspiration(input: AnalyzeInspirationInput, options: CallOptions = {}): Promise<Result<InspirationAnalysis>> {
    const images: EncodedImage[] = [];
    for (const uri of input.imageUris.slice(0, MAX_INSPIRATION_IMAGES)) {
      const image = await this.deps.readImage(uri);
      if (!image.ok) return image;
      images.push(image.value);
    }
    const result = await this.call('analyze-inspiration', { images, sourceUrl: input.sourceUrl }, inspirationAnalysisSchema, options);
    return requireOutfit(result);
  }

  gapPlan(input: GapPlanInput, options: CallOptions = {}): Promise<Result<CapsulePlanText>> {
    return this.call('gap-plan', input, capsulePlanTextSchema, options);
  }

  /** No client-side retries: the proxy already retries Claude per the error table, and each call costs quota. */
  private call<T>(endpoint: Endpoint, body: unknown, schema: z.ZodType<T>, options: CallOptions): Promise<Result<T>> {
    return this.post(endpoint, body, schema, options.signal);
  }

  private async post<T>(endpoint: Endpoint, body: unknown, schema: z.ZodType<T>, signal?: AbortSignal): Promise<Result<T>> {
    const response = await fetchWithTimeout(
      `${this.deps.functionsBaseUrl}/functions/v1/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.deps.anonKey}`,
          apikey: this.deps.anonKey,
          'x-device-id': await this.deps.getDeviceId(),
        },
        body: JSON.stringify(body),
      },
      { timeoutMs: PROXY_TIMEOUT_MS, timeoutCode: 'AI_TIMEOUT', signal },
    );
    if (!response.ok) return response;

    const { status, headers } = response.value;
    let json: unknown;
    try {
      json = await response.value.json();
    } catch {
      // Gateways (Supabase, CDN) answer 401/429/5xx with HTML or plain text: keep the status meaning.
      return response.value.ok ? fail('AI_INVALID_RESPONSE') : err(aiErrorForStatus(status, headers.get('retry-after')));
    }
    if (!response.value.ok) return err(this.errorFrom(json, status, headers.get('retry-after')));

    const data = typeof json === 'object' && json !== null && 'data' in json ? json.data : undefined;
    const parsed = schema.safeParse(data);
    return parsed.success ? ok(parsed.data) : fail('AI_INVALID_RESPONSE', { cause: formatZodIssues(parsed.error) });
  }

  /** The proxy sends `{ error: { code } }` using our own codes; fall back to the HTTP status. */
  private errorFrom(json: unknown, status: number, retryAfter: string | null) {
    const error = typeof json === 'object' && json !== null ? (json as ProxyErrorBody).error : undefined;
    const candidate = { code: error?.code };
    if (isAppError(candidate)) {
      const retryAfterSec = typeof error?.retryAfterSec === 'number' ? error.retryAfterSec : undefined;
      return appError(candidate.code, { retryAfterSec });
    }
    return aiErrorForStatus(status, retryAfter);
  }
}
