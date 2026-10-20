import { useAiStore } from '@/store/aiStore';
import type { FlowContext } from '@/services/flows/aiGate';

export function useFlowContext(): (signal: AbortSignal) => FlowContext {
  const getClient = useAiStore((s) => s.getClient);
  const ensureConsent = useAiStore((s) => s.ensureConsent);
  return (signal) => ({ getClient, ensureConsent, signal });
}
