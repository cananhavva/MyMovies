import { createClient } from 'npm:@supabase/supabase-js@2';
import { HttpError } from './http.ts';

export const DAILY_AI_QUOTA = 20;
const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECONDS_PER_DAY = 86_400;

function secondsUntilUtcMidnight(now: Date): number {
  const elapsed = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  return SECONDS_PER_DAY - elapsed;
}

/**
 * Atomically counts one AI request for the device (see migrations: consume_ai_quota) and rejects
 * it with AI_RATE_LIMITED once the daily limit is reached.
 */
export async function consumeQuota(deviceId: string | null, now: Date = new Date()): Promise<void> {
  if (!deviceId || !DEVICE_ID_PATTERN.test(deviceId)) throw new HttpError('AI_AUTH');
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc('consume_ai_quota', {
    p_device_id: deviceId.toLowerCase(),
    p_day: now.toISOString().slice(0, 10),
    p_limit: DAILY_AI_QUOTA,
  });
  if (error) throw new HttpError('SERVER_5XX');
  if (data !== true) throw new HttpError('AI_RATE_LIMITED', secondsUntilUtcMidnight(now));
}
