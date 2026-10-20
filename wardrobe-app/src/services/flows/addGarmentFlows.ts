import { LOW_CONFIDENCE_THRESHOLD } from '@/config/ai';
import type { FiberPart, ID, Result } from '@/domain/types';
import { appError, type AppError } from '@/errors/AppError';
import { fail, ok } from '@/errors/result';
import { draftFromGarmentAnalysis, draftFromProductAnalysis, type GarmentDraft } from '../garmentDraft';
import { downloadImage } from '../imageStorage';
import { validateUrl } from '../urlValidation';
import { aiGate, type FlowContext } from './aiGate';

export interface DraftOutcome {
  draft: GarmentDraft;
  notice?: AppError;
}

export type LinkOutcome = ({ kind: 'draft' } & DraftOutcome) | { kind: 'duplicate'; existingId: ID; url: string };

export async function analyzePhoto(imageUris: string[], context: FlowContext): Promise<Result<DraftOutcome>> {
  const client = await aiGate(context);
  if (!client.ok) return client;
  const analysis = await client.value.analyzeGarment({ imageUri: imageUris[0] }, { signal: context.signal });
  if (!analysis.ok) return analysis;
  const notice = analysis.value.confidence < LOW_CONFIDENCE_THRESHOLD ? appError('AI_LOW_CONFIDENCE') : undefined;
  return ok({ draft: draftFromGarmentAnalysis(analysis.value, imageUris), notice });
}

export interface LinkInput {
  url: string;
  pastedText?: string;
  labelImageUri?: string;
}

export async function analyzeLink(
  input: LinkInput,
  context: FlowContext & { findByProductUrl: (url: string) => Promise<{ id: ID } | undefined>; allowDuplicate?: boolean },
): Promise<Result<LinkOutcome>> {
  const url = validateUrl(input.url);
  if (!url.ok) return url;
  if (!context.allowDuplicate) {
    const existing = await context.findByProductUrl(url.value);
    if (existing) return ok({ kind: 'duplicate', existingId: existing.id, url: url.value });
  }

  const client = await aiGate(context);
  if (!client.ok) return client;
  const product = await client.value.analyzeProductPage({ ...input, url: url.value }, { signal: context.signal });
  if (!product.ok) return product;

  const image = product.value.imageUrl ? await downloadImage(product.value.imageUrl) : undefined;
  const imageUris = [...(image?.ok ? [image.value] : []), ...(input.labelImageUri ? [input.labelImageUri] : [])];
  const draft = draftFromProductAnalysis(product.value, url.value, imageUris);
  const notice = draft.composition ? undefined : appError('NO_MATERIAL_INFO');
  return ok({ kind: 'draft', draft, notice });
}

/** Reads the composition from a care-label photo (no product page involved). */
export async function readLabelComposition(labelImageUri: string, context: FlowContext): Promise<Result<FiberPart[]>> {
  const client = await aiGate(context);
  if (!client.ok) return client;
  const product = await client.value.analyzeProductPage({ url: '', labelImageUri }, { signal: context.signal });
  if (!product.ok) return product;
  const composition = product.value.composition ?? [];
  return product.value.compositionFound && composition.length > 0 ? ok(composition) : fail('COMPOSITION_PARSE_FAILED');
}
