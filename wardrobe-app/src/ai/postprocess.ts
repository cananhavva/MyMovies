import type { GarmentAnalysis, InspirationAnalysis, Result } from '@/domain/types';
import { fail } from '@/errors/result';

export function requireGarment(result: Result<GarmentAnalysis>): Result<GarmentAnalysis> {
  if (result.ok && result.value.isGarment === false) return fail('AI_NOT_GARMENT');
  return result;
}

export function requireOutfit(result: Result<InspirationAnalysis>): Result<InspirationAnalysis> {
  if (result.ok && (!result.value.hasOutfit || result.value.items.length === 0)) return fail('INSPIRATION_NO_OUTFIT');
  return result;
}
