import type { AiClient } from '@/ai/AiClient';
import type { Result } from '@/domain/types';
import { fail, ok } from '@/errors/result';
import { isOnline } from '../network';

export interface FlowContext {
  getClient: () => Promise<AiClient>;
  ensureConsent: () => Promise<boolean>;
  signal?: AbortSignal;
}

/** Shared gate before any AI call: consent first (Apple 5.1.2(i)), then connectivity. */
export async function aiGate(context: FlowContext): Promise<Result<AiClient>> {
  if (!(await context.ensureConsent())) return fail('USER_CANCELLED');
  if (!(await isOnline())) return fail('NETWORK_OFFLINE');
  return ok(await context.getClient());
}
