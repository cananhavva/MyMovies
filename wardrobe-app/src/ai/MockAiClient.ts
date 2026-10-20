import type { CapsulePlanText, GarmentAnalysis, InspirationAnalysis, ProductAnalysis, Result } from '@/domain/types';
import { fail, ok } from '@/errors/result';
import type {
  AiClient,
  AnalyzeGarmentInput,
  AnalyzeInspirationInput,
  AnalyzeProductPageInput,
  CallOptions,
  GapPlanInput,
} from './AiClient';
import { sleep } from './retryPolicy';

const DEMO_GARMENT: GarmentAnalysis = {
  name: 'Bej trençkot',
  category: 'outerwear',
  subcategory: 'trench_coat',
  colors: ['beige'],
  pattern: 'solid',
  seasons: ['spring', 'autumn'],
  weather: ['mild', 'cool', 'rainy', 'windy'],
  occasions: ['office', 'casual'],
  formality: 3,
  warmth: 3,
  compositionGuess: [{ fiber: 'cotton', percent: 100 }],
  confidence: 0.8,
  isGarment: true,
};

const DEMO_PRODUCT: ProductAnalysis = {
  productName: 'Wool blend coat',
  brand: 'Demo',
  name: 'Wool blend coat',
  category: 'outerwear',
  subcategory: 'coat',
  colors: ['camel'],
  seasons: ['autumn', 'winter'],
  weather: ['cool', 'cold'],
  occasions: ['office', 'casual'],
  formality: 3,
  warmth: 5,
  composition: [
    { fiber: 'wool', percent: 70 },
    { fiber: 'polyamide', percent: 30 },
  ],
  compositionFound: true,
};

const DEMO_INSPIRATION: InspirationAnalysis = {
  hasOutfit: true,
  items: [
    { category: 'outerwear', subcategory: 'trench_coat', colors: ['black'], description: 'Black belted trench coat' },
    { category: 'bottom', subcategory: 'jeans', colors: ['blue'], description: 'Straight blue jeans' },
    { category: 'shoes', subcategory: 'loafers', colors: ['black'], description: 'Black leather loafers', likelyBrands: ['Demo'] },
  ],
  occasions: ['casual', 'office'],
  seasons: ['autumn'],
};

const SIMULATED_LATENCY_MS = 600;

/** Offline demo and test client: deterministic answers, no network. */
export class MockAiClient implements AiClient {
  readonly kind = 'mock';

  async analyzeGarment(input: AnalyzeGarmentInput, options: CallOptions = {}): Promise<Result<GarmentAnalysis>> {
    await sleep(SIMULATED_LATENCY_MS, options.signal);
    return ok({ ...DEMO_GARMENT, name: input.text?.trim() || DEMO_GARMENT.name });
  }

  async analyzeProductPage(input: AnalyzeProductPageInput, options: CallOptions = {}): Promise<Result<ProductAnalysis>> {
    await sleep(SIMULATED_LATENCY_MS, options.signal);
    if (input.url.includes('blocked')) return fail('LINK_FETCH_BLOCKED');
    return ok(DEMO_PRODUCT);
  }

  async analyzeInspiration(input: AnalyzeInspirationInput, options: CallOptions = {}): Promise<Result<InspirationAnalysis>> {
    await sleep(SIMULATED_LATENCY_MS, options.signal);
    return input.imageUris.length === 0 ? fail('INSPIRATION_NO_OUTFIT') : ok(DEMO_INSPIRATION);
  }

  async gapPlan(input: GapPlanInput, options: CallOptions = {}): Promise<Result<CapsulePlanText>> {
    await sleep(SIMULATED_LATENCY_MS, options.signal);
    const narrative =
      input.language === 'tr'
        ? `Önce şu parçalara odaklan: ${input.gaps.map((g) => g.title).join(', ')}.`
        : `Start with: ${input.gaps.map((g) => g.title).join(', ')}.`;
    return ok({ narrative });
  }
}
