import type { Result } from '@/domain/types';
import { appError } from '@/errors/AppError';
import type { ClaudeMessage } from './claudeMessages';
import { requestJson } from './requestJson';
import { capsulePlanTextSchema, garmentAnalysisSchema, lenientGarmentAnalysisSchema } from './schemas';

/** Fake model: returns the scripted answers in order and records what it was sent. */
function scripted(answers: Result<string>[]) {
  const calls: ClaudeMessage[][] = [];
  const send = jest.fn(async (messages: ClaudeMessage[]) => {
    calls.push(messages);
    return answers[calls.length - 1] ?? { ok: false as const, error: appError('UNKNOWN') };
  });
  return { send, calls };
}

const text = (value: string): Result<string> => ({ ok: true, value });
const question: ClaudeMessage[] = [{ role: 'user', content: 'Describe this item.' }];
const garment = {
  name: 'White sneakers',
  category: 'shoes',
  colors: ['white'],
  seasons: ['spring'],
  weather: ['mild'],
  occasions: ['casual'],
  confidence: 0.9,
};

describe('requestJson – AI_INVALID_RESPONSE repair path (PLAN §4)', () => {
  it('accepts fenced JSON with prose without a repair request', async () => {
    const { send } = scripted([text(`Sure!\n\`\`\`json\n${JSON.stringify(garment)}\n\`\`\`\nAnything else?`)]);
    const result = await requestJson({ send, messages: question, schema: garmentAnalysisSchema });
    expect(result.ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('extracts the first {…} from prose without fences', async () => {
    const { send } = scripted([text(`Here you go: ${JSON.stringify({ narrative: 'Plan {a}' })} — cheers {x}`)]);
    expect(await requestJson({ send, messages: question, schema: capsulePlanTextSchema })).toEqual({
      ok: true,
      value: { narrative: 'Plan {a}' },
    });
  });

  it('sends exactly one repair request with the previous answer and the zod issues', async () => {
    const bad = JSON.stringify({ ...garment, category: 'spaceship' });
    const { send, calls } = scripted([text(bad), text(JSON.stringify(garment))]);
    const result = await requestJson({ send, messages: question, schema: garmentAnalysisSchema });
    expect(result.ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
    const repair = calls[1] ?? [];
    expect(repair).toHaveLength(3);
    expect(repair[1]).toEqual({ role: 'assistant', content: bad });
    expect(repair[2]?.role).toBe('user');
    expect(String(repair[2]?.content)).toContain('category');
    expect(String(repair[2]?.content)).not.toContain('{issues}');
  });

  it('says "no JSON object found" when the first answer had no JSON at all', async () => {
    const { send, calls } = scripted([text('I cannot see a garment.'), text(JSON.stringify(garment))]);
    await requestJson({ send, messages: question, schema: garmentAnalysisSchema });
    expect(String(calls[1]?.[2]?.content)).toContain('no JSON object found');
  });

  it('returns AI_INVALID_RESPONSE after a failed repair when there is no lenient schema', async () => {
    const { send } = scripted([text('nope'), text('still nope')]);
    const result = await requestJson({ send, messages: question, schema: capsulePlanTextSchema });
    expect(!result.ok && result.error.code).toBe('AI_INVALID_RESPONSE');
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('salvages the repaired answer with the lenient schema, keeping valid fields', async () => {
    const { send } = scripted([text('garbage'), text(JSON.stringify({ category: 'shoes', colors: ['white'], seasons: ['winter', 'monsoon'] }))]);
    const result = await requestJson({ send, messages: question, schema: garmentAnalysisSchema, lenientSchema: lenientGarmentAnalysisSchema });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({ category: 'shoes', colors: ['white'], seasons: ['winter'] });
      expect(result.value.confidence).toBeLessThan(0.5);
    }
  });

  it('falls back to salvaging the first answer when the repaired one is unusable', async () => {
    const { send } = scripted([text(JSON.stringify({ category: 'bag', colors: 'black' })), text('sorry')]);
    const result = await requestJson({ send, messages: question, schema: garmentAnalysisSchema, lenientSchema: lenientGarmentAnalysisSchema });
    expect(result.ok && result.value.category).toBe('bag');
  });

  it('passes through transport errors from the first call without repairing', async () => {
    const { send } = scripted([{ ok: false, error: appError('AI_TIMEOUT') }]);
    const result = await requestJson({ send, messages: question, schema: garmentAnalysisSchema });
    expect(!result.ok && result.error.code).toBe('AI_TIMEOUT');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('passes through a transport error from the repair call', async () => {
    const { send } = scripted([text('garbage'), { ok: false, error: appError('USER_CANCELLED') }]);
    const result = await requestJson({ send, messages: question, schema: garmentAnalysisSchema, lenientSchema: lenientGarmentAnalysisSchema });
    expect(!result.ok && result.error.code).toBe('USER_CANCELLED');
  });
});
