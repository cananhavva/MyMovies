import type { AppError } from '@/errors/AppError';

export type ID = string;
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'hot' | 'warm' | 'mild' | 'cool' | 'cold' | 'rainy' | 'windy' | 'snowy';
export type Occasion =
  | 'casual'
  | 'office'
  | 'business_formal'
  | 'night_out'
  | 'date'
  | 'party'
  | 'wedding_guest'
  | 'sport'
  | 'hiking_walking'
  | 'travel'
  | 'beach'
  | 'home_lounge';
export type Category =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'knitwear'
  | 'shoes'
  | 'bag'
  | 'accessory'
  | 'activewear'
  | 'swimwear'
  | 'underwear_sleep';
export type Pattern = 'solid' | 'striped' | 'checked' | 'floral' | 'print' | 'other';
export type Formality = 1 | 2 | 3 | 4 | 5;
export type Warmth = 1 | 2 | 3 | 4 | 5;
export type FieldSource = 'ai' | 'user' | 'rule';
export type FiberType =
  | 'cashmere'
  | 'silk'
  | 'wool'
  | 'merino'
  | 'alpaca'
  | 'mohair'
  | 'linen'
  | 'cotton'
  | 'organic_cotton'
  | 'leather'
  | 'suede'
  | 'down'
  | 'lyocell'
  | 'modal'
  | 'viscose'
  | 'cupro'
  | 'nylon'
  | 'polyamide'
  | 'polyester'
  | 'recycled_polyester'
  | 'acrylic'
  | 'elastane'
  | 'pu_faux_leather'
  | 'other';

export interface FiberPart {
  fiber: FiberType;
  percent: number;
}

export type QualityTier = 'premium' | 'good' | 'average' | 'low' | 'unknown';
export type CompositionSource = 'product_page' | 'label_photo' | 'user' | 'ai_guess' | 'none';

export interface QualityAssessment {
  score: number;
  tier: QualityTier;
  reasons: string[];
  source: 'rule';
  compositionSource: CompositionSource;
}

export type TaggableField =
  | 'seasons'
  | 'weather'
  | 'occasions'
  | 'category'
  | 'colors'
  | 'composition'
  | 'formality'
  | 'warmth';

export interface Price {
  amount: number;
  currency: string;
}

export interface Garment {
  id: ID;
  name: string;
  category: Category;
  subcategory?: string;
  colors: string[];
  pattern?: Pattern;
  seasons: Season[];
  weather: Weather[];
  occasions: Occasion[];
  formality?: Formality;
  warmth?: Warmth;
  composition?: FiberPart[];
  liningComposition?: FiberPart[];
  quality?: QualityAssessment;
  brand?: string;
  productUrl?: string;
  price?: Price;
  imageUris: string[];
  fieldSources: Partial<Record<TaggableField, FieldSource>>;
  aiConfidence?: number;
  pendingAnalysis?: boolean;
  notes?: string;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  id: ID;
  name: string;
  garmentIds: ID[];
  occasions: Occasion[];
  seasons: Season[];
  createdAt: string;
}

export type InfluencerPlatform = 'instagram' | 'tiktok' | 'pinterest' | 'ltk' | 'other';

export interface InfluencerProfile {
  id: ID;
  platform: InfluencerPlatform;
  handle: string;
  profileUrl: string;
  displayName?: string;
  notes?: string;
  createdAt: string;
}

export type ShopLinkSource = 'post_caption' | 'ltk' | 'user' | 'ai_search_hint';

export interface ShopLink {
  label: string;
  url: string;
  source: ShopLinkSource;
}

export interface InspirationItem {
  id: ID;
  category: Category;
  subcategory?: string;
  colors: string[];
  pattern?: Pattern;
  formality?: Formality;
  description: string;
  likelyBrands?: string[];
  shopLinks?: ShopLink[];
  matchedGarmentIds: ID[];
  matchScore: number;
}

export interface InspirationLook {
  id: ID;
  influencerId?: ID;
  sourceUrl?: string;
  imageUris: string[];
  items: InspirationItem[];
  occasions: Occasion[];
  seasons: Season[];
  liked: boolean;
  recreatability: number;
  createdAt: string;
}

export type GapReason = 'inspiration_frequency' | 'occasion_coverage' | 'season_coverage' | 'capsule_core';
export type GapStatus = 'open' | 'dismissed' | 'planned' | 'acquired';

export interface GapEvidence {
  lookIds: ID[];
  frequency: number;
  likedFrequency?: number;
  distinctInfluencers?: number;
  occasion?: Occasion;
  season?: Season;
}

export interface GapSuggestion {
  id: ID;
  key: string;
  category: Category;
  subcategory?: string;
  color?: string;
  title: string;
  reason: GapReason;
  evidence: GapEvidence;
  priority: number;
  unlocksLookCount: number;
  status: GapStatus;
  statusChangedAt?: string;
  createdAt: string;
}

export interface CapsulePlan {
  id: ID;
  season?: Season;
  targetSize: number;
  coreGarmentIds: ID[];
  gapKeys: string[];
  narrative?: string;
  createdAt: string;
}

export interface GarmentAnalysis {
  name: string;
  category: Category;
  subcategory?: string;
  colors: string[];
  pattern?: Pattern;
  seasons: Season[];
  weather: Weather[];
  occasions: Occasion[];
  formality?: Formality;
  warmth?: Warmth;
  compositionGuess?: FiberPart[];
  confidence: number;
  isGarment?: boolean;
}

export interface ProductAnalysis extends Partial<GarmentAnalysis> {
  brand?: string;
  productName?: string;
  price?: Price;
  composition?: FiberPart[];
  compositionFound: boolean;
  imageUrl?: string;
}

export interface InspirationItemAnalysis {
  category: Category;
  subcategory?: string;
  colors: string[];
  pattern?: Pattern;
  formality?: Formality;
  description: string;
  likelyBrands?: string[];
}

export interface InspirationAnalysis {
  hasOutfit: boolean;
  items: InspirationItemAnalysis[];
  occasions: Occasion[];
  seasons: Season[];
}

export interface CapsulePlanText {
  narrative: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };
